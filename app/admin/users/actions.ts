"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { member, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function getOrganizationUsers() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || !session.session.activeOrganizationId) {
        throw new Error("Unauthorized");
    }

    const orgId = session.session.activeOrganizationId;

    // Check if the user is an admin or owner in the organization
    const currentMember = await db.query.member.findFirst({
        where: (member, { and, eq }) => and(
            eq(member.organizationId, orgId),
            eq(member.userId, session.user.id)
        ),
    });

    if (!currentMember || (currentMember.role !== "admin" && currentMember.role !== "owner")) {
        throw new Error("Forbidden: Admin access required");
    }

    const users = await db.select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: member.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, orgId));

    return users.map(u => ({
        ...u,
        status: u.emailVerified ? "Active" : "Pending",
    }));
}
