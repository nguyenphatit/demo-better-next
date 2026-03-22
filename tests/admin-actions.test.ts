import { describe, it, expect, vi, beforeEach } from "vitest";
import { getOrganizationUsers, inviteUser, updateMemberRole, removeMember } from "../app/admin/users/actions";
import { auth } from "../lib/auth";
import { db } from "../lib/db";
import { getMemberPermissions } from "../lib/rbac";
import { revalidatePath } from "next/cache";

vi.mock("../lib/auth", () => ({
    auth: {
        api: {
            getSession: vi.fn(),
            inviteMember: vi.fn(),
            updateMemberRole: vi.fn(),
            removeMember: vi.fn(),
        },
    },
}));

vi.mock("../lib/db", () => ({
    db: {
        query: {
            member: {
                findFirst: vi.fn(),
            },
        },
        select: vi.fn(),
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn(),
    },
}));

vi.mock("../lib/rbac", () => ({
    getMemberPermissions: vi.fn(),
}));

vi.mock("next/headers", () => ({
    headers: vi.fn().mockResolvedValue({}),
}));

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

describe("Admin Server Actions", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("getOrganizationUsers", () => {
        it("should return users for authorized requests", async () => {
            // Mock session
            (auth.api.getSession as any).mockResolvedValue({
                user: { id: "user-1" },
                session: { activeOrganizationId: "org-1" },
            });

            // Mock current member
            (db.query.member.findFirst as any).mockResolvedValue({ id: "m-1", role: "admin" });

            // Mock permissions
            (getMemberPermissions as any).mockResolvedValue(["user.read"]);

            // Mock users query
            (db.select as any).mockReturnValue({
                from: vi.fn().mockReturnThis(),
                innerJoin: vi.fn().mockReturnThis(),
                where: vi.fn().mockResolvedValue([
                    { id: "u-1", name: "User 1", email: "u1@example.com", role: "admin", emailVerified: true, createdAt: new Date() },
                    { id: "u-2", name: "User 2", email: "u2@example.com", role: "user", emailVerified: false, createdAt: new Date() },
                ]),
            });

            const users = await getOrganizationUsers();
            expect(users).toHaveLength(2);
            expect(users[0].status).toBe("Active");
            expect(users[1].status).toBe("Pending");
        });

        it("should throw error if session is missing", async () => {
            (auth.api.getSession as any).mockResolvedValue(null);
            await expect(getOrganizationUsers()).rejects.toThrow("Unauthorized");
        });

        it("should throw error if insufficient permissions", async () => {
             (auth.api.getSession as any).mockResolvedValue({
                user: { id: "user-1" },
                session: { activeOrganizationId: "org-1" },
            });
            (db.query.member.findFirst as any).mockResolvedValue({ id: "m-1", role: "user" });
            (getMemberPermissions as any).mockResolvedValue([]); // No permissions

            await expect(getOrganizationUsers()).rejects.toThrow("Forbidden: Insufficient permissions");
        });
    });

    describe("inviteUser", () => {
        it("should allow Admin to invite any role", async () => {
            (auth.api.getSession as any).mockResolvedValue({
                user: { id: "admin-id" },
                session: { activeOrganizationId: "org-1" },
            });
            (db.query.member.findFirst as any).mockResolvedValue({ role: "admin" });
            (getMemberPermissions as any).mockResolvedValue(["user.create"]);

            await inviteUser("new@example.com", "manager");
            expect(auth.api.inviteMember).toHaveBeenCalledWith(expect.objectContaining({
                body: { email: "new@example.com", role: "manager", organizationId: "org-1" }
            }));
            expect(revalidatePath).toHaveBeenCalledWith("/admin/users");
        });

        it("should allow Manager to invite 'user' role", async () => {
            (auth.api.getSession as any).mockResolvedValue({
                user: { id: "manager-id" },
                session: { activeOrganizationId: "org-1" },
            });
            (db.query.member.findFirst as any).mockResolvedValue({ role: "manager" });
            (getMemberPermissions as any).mockResolvedValue(["user.create"]);

            await inviteUser("new@example.com", "user");
            expect(auth.api.inviteMember).toHaveBeenCalled();
        });

        it("should prevent Manager from inviting 'admin' role", async () => {
            (auth.api.getSession as any).mockResolvedValue({
                user: { id: "manager-id" },
                session: { activeOrganizationId: "org-1" },
            });
            (db.query.member.findFirst as any).mockResolvedValue({ role: "manager" });
            (getMemberPermissions as any).mockResolvedValue(["user.create"]);

            await expect(inviteUser("new@example.com", "admin")).rejects.toThrow("Forbidden: Managers can only invite users with 'user' role");
        });
    });

    describe("updateMemberRole", () => {
        it("should prevent Manager from updating non-user role", async () => {
            (auth.api.getSession as any).mockResolvedValue({
                user: { id: "manager-id" },
                session: { activeOrganizationId: "org-1" },
            });
            (db.query.member.findFirst as any)
                .mockResolvedValueOnce({ role: "manager" }) // currentMember
                .mockResolvedValueOnce({ id: "m-target", role: "admin" }); // targetMember

            (getMemberPermissions as any).mockResolvedValue(["user.update"]);

            await expect(updateMemberRole("target-id", "user")).rejects.toThrow("Forbidden: Managers can only manage users with 'user' role");
        });

        it("should prevent Manager from setting role to something other than 'user'", async () => {
            (auth.api.getSession as any).mockResolvedValue({
                user: { id: "manager-id" },
                session: { activeOrganizationId: "org-1" },
            });
            (db.query.member.findFirst as any)
                .mockResolvedValueOnce({ role: "manager" })
                .mockResolvedValueOnce({ id: "m-target", role: "user" });

            (getMemberPermissions as any).mockResolvedValue(["user.update"]);

            await expect(updateMemberRole("target-id", "manager")).rejects.toThrow("Forbidden: Managers can only set role to 'user'");
        });
    });

    describe("removeMember", () => {
        it("should prevent Manager from removing an admin", async () => {
            (auth.api.getSession as any).mockResolvedValue({
                user: { id: "manager-id" },
                session: { activeOrganizationId: "org-1" },
            });
            (db.query.member.findFirst as any)
                .mockResolvedValueOnce({ role: "manager" })
                .mockResolvedValueOnce({ id: "m-target", role: "admin" });

            (getMemberPermissions as any).mockResolvedValue(["user.delete"]);

            await expect(removeMember("target-id")).rejects.toThrow("Forbidden: Managers can only remove users with 'user' role");
        });

        it("should prevent self-removal", async () => {
            (auth.api.getSession as any).mockResolvedValue({
                user: { id: "user-1" },
                session: { activeOrganizationId: "org-1" },
            });
            (db.query.member.findFirst as any)
                .mockResolvedValueOnce({ id: "m-1", role: "admin" })
                .mockResolvedValueOnce({ id: "m-1", userId: "user-1", role: "admin" });

            (getMemberPermissions as any).mockResolvedValue(["user.delete"]);

            await expect(removeMember("user-1")).rejects.toThrow("Cannot remove yourself");
        });
    });
});
