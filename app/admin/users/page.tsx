import { getOrganizationUsers } from "./actions";
import { UserTable } from "@/components/admin/user-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteUserDialog } from "@/components/admin/invite-user-dialog";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";

export default async function AdminUsersPage() {
    const users = await getOrganizationUsers();

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const orgId = session?.session.activeOrganizationId;
    let currentUserRole = "user";

    if (orgId && session?.user.id) {
        const member = await db.query.member.findFirst({
            where: (member, { and, eq }) => and(
                eq(member.organizationId, orgId),
                eq(member.userId, session.user.id)
            ),
        });
        currentUserRole = member?.role || "user";
    }

    return (
        <div className="container mx-auto py-10 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                    <p className="text-muted-foreground">
                        Manage and view all users within your organization.
                    </p>
                </div>
                {currentUserRole !== "user" && (
                    <InviteUserDialog currentUserRole={currentUserRole} />
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>User Directory</CardTitle>
                    <CardDescription>
                        A list of all users in your organization including their name, email, and role.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <UserTable data={users} currentUserRole={currentUserRole} />
                </CardContent>
            </Card>
        </div>
    );
}
