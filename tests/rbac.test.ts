import { describe, it, expect, vi, beforeEach } from "vitest";
import { getMemberPermissions, hasPermission } from "../lib/rbac";
import { db } from "../lib/db";
import { role, rolePermission, permission } from "../lib/db/schema";

vi.mock("../lib/db", () => ({
    db: {
        query: {
            member: {
                findFirst: vi.fn(),
            },
        },
        select: vi.fn(),
        innerJoin: vi.fn(),
        where: vi.fn(),
    },
}));

describe("RBAC Permissions", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return empty array if member not found", async () => {
        (db.query.member.findFirst as any).mockResolvedValue(null);
        const perms = await getMemberPermissions("user-1", "org-1");
        expect(perms).toEqual([]);
    });

    it("should resolve permissions for a member with 'Admin' role", async () => {
        // Mock member
        (db.query.member.findFirst as any).mockResolvedValue({
            id: "member-1",
            userId: "user-1",
            organizationId: "org-1",
            role: "Admin",
        });

        // Mock baseRoles query
        const mockBaseRoles = [{ id: "role-admin-id" }];
        (db.select as any).mockReturnValue({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue(mockBaseRoles),
        });

        // Mock extraMemberRoles query (empty)
        // Note: the second call to db.select in getMemberPermissions
        (db.select as any)
            .mockReturnValueOnce({ // for baseRoles
                from: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue(mockBaseRoles),
            })
            .mockReturnValueOnce({ // for extraMemberRoles
                from: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue([]),
            })
            .mockReturnValueOnce({ // for permissions
                from: vi.fn().mockReturnThis(),
                innerJoin: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue([
                    { name: "user.create" },
                    { name: "user.read" },
                    { name: "user.update" },
                    { name: "user.delete" },
                    { name: "org.update" },
                ]),
            });

        const perms = await getMemberPermissions("user-1", "org-1");
        expect(perms).toContain("user.create");
        expect(perms).toContain("user.delete");
        expect(perms).toHaveLength(5);
    });

    it("should resolve permissions for a member with 'User' role", async () => {
        (db.query.member.findFirst as any).mockResolvedValue({
            id: "member-2",
            userId: "user-2",
            organizationId: "org-1",
            role: "user",
        });

        const mockBaseRoles = [{ id: "role-user-id" }];
        (db.select as any)
            .mockReturnValueOnce({ // baseRoles
                from: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue(mockBaseRoles),
            })
            .mockReturnValueOnce({ // extraMemberRoles
                from: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue([]),
            })
            .mockReturnValueOnce({ // permissions
                from: vi.fn().mockReturnThis(),
                innerJoin: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue([{ name: "user.read" }]),
            });

        const perms = await getMemberPermissions("user-2", "org-1");
        expect(perms).toEqual(["user.read"]);
    });

    it("should aggregate permissions from multiple roles", async () => {
        (db.query.member.findFirst as any).mockResolvedValue({
            id: "member-3",
            userId: "user-3",
            organizationId: "org-1",
            role: "User",
        });

        (db.select as any)
            .mockReturnValueOnce({ // baseRoles (User)
                from: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue([{ id: "role-user-id" }]),
            })
            .mockReturnValueOnce({ // extraMemberRoles (Custom Role)
                from: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue([{ roleId: "role-custom-id" }]),
            })
            .mockReturnValueOnce({ // permissions for both roles
                from: vi.fn().mockReturnThis(),
                innerJoin: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue([
                    { name: "user.read" },
                    { name: "custom.perm" }
                ]),
            });

        const perms = await getMemberPermissions("user-3", "org-1");
        expect(perms).toContain("user.read");
        expect(perms).toContain("custom.perm");
        expect(perms).toHaveLength(2);
    });

    it("hasPermission should return true if user has permission", async () => {
        (db.query.member.findFirst as any).mockResolvedValue({
            id: "member-1",
            userId: "user-1",
            organizationId: "org-1",
            role: "Admin",
        });

        (db.select as any)
            .mockReturnValueOnce({ from: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([{ id: "1" }]) })
            .mockReturnValueOnce({ from: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([]) })
            .mockReturnValueOnce({
                from: vi.fn().mockReturnThis(),
                innerJoin: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue([{ name: "user.create" }]),
            });

        const result = await hasPermission("user-1", "org-1", "user.create");
        expect(result).toBe(true);
    });

    it("hasPermission should return false if user does not have permission", async () => {
        (db.query.member.findFirst as any).mockResolvedValue({
            id: "member-1",
            userId: "user-1",
            organizationId: "org-1",
            role: "User",
        });

        (db.select as any)
            .mockReturnValueOnce({ from: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([{ id: "1" }]) })
            .mockReturnValueOnce({ from: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([]) })
            .mockReturnValueOnce({
                from: vi.fn().mockReturnThis(),
                innerJoin: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue([{ name: "user.read" }]),
            });

        const result = await hasPermission("user-1", "org-1", "user.delete");
        expect(result).toBe(false);
    });
});
