import { db } from "./db";
import { member, role, rolePermission, permission, memberRole } from "./db/schema";
import { eq, and, or, isNull, inArray } from "drizzle-orm";

/**
 * Retrieves all permissions for a member in an organization.
 * It combines permissions from the default role string in the member table
 * and any additional roles assigned via the memberRole table.
 */
export async function getMemberPermissions(userId: string, organizationId: string): Promise<string[]> {
    const currentMember = await db.query.member.findFirst({
        where: (m, { and, eq }) => and(
            eq(m.userId, userId),
            eq(m.organizationId, organizationId)
        ),
    });

    if (!currentMember) {
        return [];
    }

    const roleIds: string[] = [];

    // 1. Get role ID from the role string in member table
    // We match against seeded roles "Admin", "Manager", "User" (case-insensitive)
    let memberRoleName = currentMember.role.toLowerCase();
    
    if (memberRoleName === "owner") {
        memberRoleName = "admin";
    } else if (memberRoleName === "member") {
        memberRoleName = "user";
    }

    const baseRoles = await db.select({ id: role.id })
        .from(role)
        .where(
            and(
                or(
                    eq(role.name, memberRoleName),
                    eq(role.name, memberRoleName.charAt(0).toUpperCase() + memberRoleName.slice(1))
                ),
                or(
                    eq(role.organizationId, organizationId),
                    isNull(role.organizationId)
                )
            )
        );

    baseRoles.forEach(r => roleIds.push(r.id));

    // 2. Also check memberRole table for any explicitly assigned roles
    const extraMemberRoles = await db.select({ roleId: memberRole.roleId })
        .from(memberRole)
        .where(eq(memberRole.memberId, currentMember.id));

    extraMemberRoles.forEach(emr => {
        if (!roleIds.includes(emr.roleId)) {
            roleIds.push(emr.roleId);
        }
    });

    if (roleIds.length === 0) {
        return [];
    }

    // 3. Fetch all unique permissions for these roles
    const permissions = await db.select({ name: permission.name })
        .from(rolePermission)
        .innerJoin(permission, eq(rolePermission.permissionId, permission.id))
        .where(inArray(rolePermission.roleId, roleIds));

    return [...new Set(permissions.map(p => p.name))];
}

/**
 * Checks if a member has a specific permission in an organization.
 */
export async function hasPermission(userId: string, organizationId: string, requiredPermission: string): Promise<boolean> {
    const permissions = await getMemberPermissions(userId, organizationId);
    return permissions.includes(requiredPermission);
}
