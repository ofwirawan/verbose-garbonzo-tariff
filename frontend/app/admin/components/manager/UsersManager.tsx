"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DataTable } from "../DataTable";
import { FormDialog } from "../FormDialog";
import { userAPI, User, PaginatedResponse } from "@/app/admin/lib/api";

export function UsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<User>({
    uid: "",
    email: "",
    pwHash: "",
    roles: "user",
  });

  const loadUsers = async (page = 0) => {
    try {
      setIsLoading(true);
      const response = await userAPI.getAll(page, 10);
      setUsers(response.content);
      setCurrentPage(response.currentPage);
      setTotalPages(response.totalPages);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(0);
  }, []);

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({ uid: "", email: "", pwHash: "", roles: "user" });
    setDialogOpen(true);
  };

  const handleEdit = (row: User) => {
    setEditingUser(row);
    setFormData(row);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.uid || !formData.email || !formData.roles) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUser) {
        await userAPI.update(editingUser.uid, {
          email: formData.email,
          roles: formData.roles,
          ...(formData.pwHash && { pwHash: formData.pwHash }),
        });
        toast.success("User updated successfully");
      } else {
        if (!formData.pwHash) {
          toast.error("Password hash is required for new users");
          setIsSubmitting(false);
          return;
        }
        await userAPI.create(formData);
        toast.success("User created successfully");
      }
      setDialogOpen(false);
      loadUsers(currentPage);
    } catch (error) {
      toast.error(
        `Failed to save user: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async (row: User) => {
    await userAPI.delete(row.uid);
    loadUsers(currentPage);
  };

  const columns = [
    { key: "uid", label: "User ID" },
    { key: "email", label: "Email" },
    { key: "roles", label: "Role" },
    {
      key: "createdAt",
      label: "Created",
      render: (value: string) =>
        value ? new Date(value).toLocaleDateString() : "N/A",
    },
  ];

  return (
    <div>
      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={() => {}}
        onDeleteConfirm={handleDeleteConfirm}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={loadUsers}
        title="Users"
      />

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingUser ? "Edit User" : "Add User"}
        description={
          editingUser ? "Update the user information" : "Create a new user"
        }
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="uid">User ID (UUID)</Label>
            <Input
              id="uid"
              value={formData.uid}
              onChange={(e) =>
                setFormData({ ...formData, uid: e.target.value })
              }
              placeholder="e.g., b3e1e7e2-8c2d-4b7a-9e6e-123456789abc"
              disabled={!!editingUser}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="e.g., user@example.com"
            />
          </div>
          <div>
            <Label htmlFor="pwHash">Password Hash</Label>
            <Input
              id="pwHash"
              value={formData.pwHash || ""}
              onChange={(e) =>
                setFormData({ ...formData, pwHash: e.target.value })
              }
              placeholder={
                editingUser ? "Leave empty to keep current" : "e.g., hashed..."
              }
            />
          </div>
          <div>
            <Label htmlFor="roles">Role</Label>
            <Input
              id="roles"
              value={formData.roles}
              onChange={(e) =>
                setFormData({ ...formData, roles: e.target.value })
              }
              placeholder="e.g., admin, user"
            />
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
