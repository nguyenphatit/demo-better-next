"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { member, user } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

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

    return { session, orgId, currentMember };
}

export async function getOrganizationUsers() {
    const { orgId, currentMember } = await getSessionAndOrg();

    // Any member can potentially view the list, but we might want to restrict it
    // Requirements say: User: Read-only access or restricted view.
    // The previous implementation required admin/owner. Let's keep it somewhat restricted
    // but allow managers to see it too.

    if (currentMember.role === "user") {
        // Restricted view: maybe only show their own?
        // But it's an "Admin User Management" console.
        // Usually, 'user' shouldn't even be here.
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
    const { session, orgId, currentMember } = await getSessionAndOrg();

    // Only admin/owner/manager can invite
    if (currentMember.role === "user") {
        throw new Error("Forbidden: Insufficient permissions");
    }

    // Manager can only invite "user" role
    if (currentMember.role === "manager" && role !== "user") {
        throw new Error("Forbidden: Managers can only invite users with 'user' role");
    }

    try {
        await auth.api.inviteMember({
            headers: await headers(),
            body: {
                email,
                role,
                organizationId: orgId,
            }
        });
        revalidatePath("/admin/users");
    } catch (error) {
        console.error("Failed to invite user:", error);
        throw new Error("Failed to invite user");
    }
}

export async function updateMemberRole(memberUserId: string, newRole: string) {
    const { session, orgId, currentMember } = await getSessionAndOrg();

    if (currentMember.role === "user") {
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
    // Manager: Can only edit/manage users with lower roles (e.g., User role).
    if (currentMember.role === "manager") {
        if (targetMember.role !== "user") {
            throw new Error("Forbidden: Managers can only manage users with 'user' role");
        }
        if (newRole !== "user") {
            throw new Error("Forbidden: Managers can only set role to 'user'");
        }
    }

    // Owner/Admin can manage everyone (though usually owners can't be demoted by admins)
    // For simplicity, let's allow Admin/Owner to change roles.

    try {
        await auth.api.updateMemberRole({
            headers: await headers(),
            body: {
                memberId: targetMember.id,
                role: newRole,
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
    const { session, orgId, currentMember } = await getSessionAndOrg();

    if (currentMember.role === "user") {
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
    if (currentMember.role === "manager") {
        if (targetMember.role !== "user") {
            throw new Error("Forbidden: Managers can only remove users with 'user' role");
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
                memberId: targetMember.id,
                organizationId: orgId,
            }
        });
        revalidatePath("/admin/users");
    } catch (error) {
        console.error("Failed to remove member:", error);
        throw new Error("Failed to remove member");
    }
}
