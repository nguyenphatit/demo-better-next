"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { member, user } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getMemberPermissions } from "@/lib/rbac";

async function getSessionAndOrg() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || !session.session.activeOrganizationId) {
        throw new Error("Unauthorized");
    }

    const orgId = session.session.activeOrganizationId;

    const currentMember = await db.query.member.findFirst({
        where: (member, { and, eq }) => and(
            eq(member.organizationId, orgId),
            eq(member.userId, session.user.id)
        ),
    });

    if (!currentMember) {
        throw new Error("Forbidden: Not a member of this organization");
    }

    const permissions = await getMemberPermissions(session.user.id, orgId);

    return { session, orgId, currentMember, permissions };
}

export async function getOrganizationUsers() {
    const { orgId, permissions } = await getSessionAndOrg();

    if (!permissions.includes("user.read")) {
        throw new Error("Forbidden: Insufficient permissions");
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

export async function inviteUser(email: string, role: string) {
    const { orgId, currentMember, permissions } = await getSessionAndOrg();

    if (!permissions.includes("user.create")) {
        throw new Error("Forbidden: Insufficient permissions");
    }

    // Admin can only invite "member" role
    if (currentMember.role === "admin" && role !== "member") {
        throw new Error("Forbidden: Admins can only invite users with 'member' role");
    }

    try {
        await auth.api.createInvitation({
            headers: await headers(),
            body: {
                email,
                role: role as "member" | "admin" | "owner",
                organizationId: orgId,
            }
        });
        revalidatePath("/admin/users");
    } catch (error: any) {
        console.error("Failed to invite user:", error);
        throw new Error(error.message || "Failed to invite user");
    }
}

export async function updateMemberRole(memberUserId: string, newRole: string) {
    const { orgId, currentMember, permissions } = await getSessionAndOrg();

    if (!permissions.includes("user.update")) {
        throw new Error("Forbidden: Insufficient permissions");
    }

    // Get the target member's current role
    const targetMember = await db.query.member.findFirst({
        where: (member, { and, eq }) => and(
            eq(member.organizationId, orgId),
            eq(member.userId, memberUserId)
        ),
    });

    if (!targetMember) {
        throw new Error("Target member not found");
    }

    // Hierarchy check:
    // Admin: Can only edit/manage users with lower roles (e.g., Member role).
    if (currentMember.role === "admin") {
        if (targetMember.role !== "member") {
            throw new Error("Forbidden: Admins can only manage users with 'member' role");
        }
        if (newRole !== "member") {
            throw new Error("Forbidden: Admins can only set role to 'member'");
        }
    }

    // Owner/Admin can manage everyone (though usually owners can't be demoted by admins)
    // For simplicity, let's allow Admin/Owner to change roles.

    try {
        await auth.api.updateMemberRole({
            headers: await headers(),
            body: {
                memberId: targetMember.id,
                role: newRole as "member" | "admin" | "owner",
                organizationId: orgId,
            }
        });
        revalidatePath("/admin/users");
    } catch (error) {
        console.error("Failed to update member role:", error);
        throw new Error("Failed to update member role");
    }
}

export async function removeMember(memberUserId: string) {
    const { session, orgId, currentMember, permissions } = await getSessionAndOrg();

    if (!permissions.includes("user.delete")) {
        throw new Error("Forbidden: Insufficient permissions");
    }

    const targetMember = await db.query.member.findFirst({
        where: (member, { and, eq }) => and(
            eq(member.organizationId, orgId),
            eq(member.userId, memberUserId)
        ),
    });

    if (!targetMember) {
        throw new Error("Target member not found");
    }

    // Hierarchy check:
    if (currentMember.role === "admin") {
        if (targetMember.role !== "member") {
            throw new Error("Forbidden: Admins can only remove users with 'member' role");
        }
    }

    // Prevent self-removal if needed, or owner removal
    if (targetMember.userId === session.user.id) {
        throw new Error("Cannot remove yourself");
    }

    try {
        await auth.api.removeMember({
            headers: await headers(),
            body: {
                memberIdOrEmail: targetMember.id,
                organizationId: orgId,
            }
        });
        revalidatePath("/admin/users");
    } catch (error) {
        console.error("Failed to remove member:", error);
        throw new Error("Failed to remove member");
    }
}
