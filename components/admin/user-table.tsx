"use client";

import { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { MoreHorizontal, UserCog, UserMinus } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateMemberRole, removeMember } from "@/app/admin/users/actions";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface UserTableProps {
  data: User[];
  currentUserRole?: string;
  permissions?: string[];
}

export function UserTable({ data, currentUserRole, permissions = [] }: UserTableProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateRole = async () => {
    if (!editingUser) return;
    setIsLoading(true);
    try {
      await updateMemberRole(editingUser.id, newRole);
      toast.success(`Updated ${editingUser.name}'s role to ${newRole}`);
      setEditingUser(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUser = async () => {
    if (!deletingUser) return;
    setIsLoading(true);
    try {
      await removeMember(deletingUser.id);
      toast.success(`Removed ${deletingUser.name} from organization`);
      setDeletingUser(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to remove user");
    } finally {
      setIsLoading(false);
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Display Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        return <Badge variant="outline" className="capitalize">{role}</Badge>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge variant={status === "Active" ? "default" : "secondary"}>
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;

        const canUpdate = permissions.includes("user.update");
        const canDelete = permissions.includes("user.delete");

        // Hierarchy check still applies (e.g., admin can only edit 'member')
        const isHigherRole = currentUserRole === "admin" || currentUserRole === "owner";
        const canManageUser = isHigherRole || (currentUserRole === "admin" && user.role === "member");

        if (!canManageUser || (!canUpdate && !canDelete)) return null;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {canUpdate && (
                <DropdownMenuItem
                  onClick={() => {
                    setEditingUser(user);
                    setNewRole(user.role);
                  }}
                >
                  <UserCog className="mr-2 h-4 w-4" />
                  Change Role
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => setDeletingUser(user)}
                  >
                    <UserMinus className="mr-2 h-4 w-4" />
                    Remove User
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User Role</DialogTitle>
            <DialogDescription>
              Change the role for {editingUser?.name} ({editingUser?.email}).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                {(currentUserRole === "admin" || currentUserRole === "owner") && (
                  <>
                    <SelectItem value="admin">Admin</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button onClick={handleUpdateRole} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove User</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {deletingUser?.name} from the organization? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingUser(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRemoveUser} disabled={isLoading}>
              {isLoading ? "Removing..." : "Remove User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
