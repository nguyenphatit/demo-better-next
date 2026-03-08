import { getOrganizationUsers } from "./actions";
import { UserTable } from "@/components/admin/user-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminUsersPage() {
    const users = await getOrganizationUsers();

    return (
        <div className="container mx-auto py-10">
            <Card>
                <CardHeader>
                    <CardTitle>User Directory</CardTitle>
                    <CardDescription>
                        Manage and view all users within your organization.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <UserTable data={users} />
                </CardContent>
            </Card>
        </div>
    );
}
