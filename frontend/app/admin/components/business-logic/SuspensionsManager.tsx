"use client";

import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DataTable } from "../DataTable";
import { FormDialog } from "../FormDialog";
import {
  suspensionAPI,
  Suspension,
  PaginatedResponse,
} from "@/app/admin/lib/api";

export function SuspensionsManager() {
  const [suspensions, setSuspensions] = useState<Suspension[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSuspension, setEditingSuspension] = useState<Suspension | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Suspension>({
    importerCode: "",
    productCode: "",
    validFrom: "",
    validTo: "",
    suspensionFlag: false,
    suspensionNote: "",
    suspensionRate: 0,
  });

  const loadSuspensions = async (page = 0) => {
    try {
      setIsLoading(true);
      const response = await suspensionAPI.getAll(page, 10);
      setSuspensions(response.content);
      setCurrentPage(response.currentPage);
      setTotalPages(response.totalPages);
    } catch (error) {
      toast.error("Failed to load suspensions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSuspensions(0);
  }, []);

  const handleAdd = () => {
    setEditingSuspension(null);
    setFormData({
      importerCode: "",
      productCode: "",
      validFrom: "",
      validTo: "",
      suspensionFlag: false,
      suspensionNote: "",
      suspensionRate: 0,
    });
    setDialogOpen(true);
  };

  const handleEdit = (row: Suspension) => {
    setEditingSuspension(row);
    setFormData(row);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (
      !formData.importerCode ||
      !formData.productCode ||
      !formData.validFrom ||
      !formData.validTo
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSuspension && editingSuspension.id) {
        await suspensionAPI.update(editingSuspension.id, formData);
        toast.success("Suspension updated successfully");
      } else {
        await suspensionAPI.create(formData);
        toast.success("Suspension created successfully");
      }
      setDialogOpen(false);
      loadSuspensions(currentPage);
    } catch (error) {
      toast.error(
        `Failed to save suspension: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async (row: Suspension) => {
    if (row.id) {
      await suspensionAPI.delete(row.id);
      loadSuspensions(currentPage);
    }
  };

  const columns: ColumnDef<Suspension>[] = [
    {
      accessorKey: "importerCode",
      header: "Importer Code",
    },
    {
      accessorKey: "productCode",
      header: "Product Code",
    },
    {
      accessorKey: "validFrom",
      header: "Valid From",
    },
    {
      accessorKey: "validTo",
      header: "Valid To",
    },
    {
      accessorKey: "suspensionFlag",
      header: "Active",
      cell: ({ row }) => (row.original.suspensionFlag ? "Yes" : "No"),
    },
    {
      accessorKey: "suspensionRate",
      header: "Rate (%)",
    },
  ];

  return (
    <div>
      <DataTable
        columns={columns}
        data={suspensions}
        isLoading={isLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDeleteConfirm={handleDeleteConfirm}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={loadSuspensions}
        title="Suspensions"
      />

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingSuspension ? "Edit Suspension" : "Add Suspension"}
        description={
          editingSuspension
            ? "Update the suspension information"
            : "Create a new suspension"
        }
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      >
        <div className="space-y-4">
          <div className="grid gap-3">
            <Label htmlFor="importerCode">Importer Code</Label>
            <Input
              id="importerCode"
              value={formData.importerCode}
              onChange={(e) =>
                setFormData({ ...formData, importerCode: e.target.value })
              }
              placeholder="e.g., SG"
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="productCode">Product Code</Label>
            <Input
              id="productCode"
              value={formData.productCode}
              onChange={(e) =>
                setFormData({ ...formData, productCode: e.target.value })
              }
              placeholder="e.g., 123456"
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="validFrom">Valid From (YYYY-MM-DD)</Label>
            <Input
              id="validFrom"
              type="date"
              value={formData.validFrom}
              onChange={(e) =>
                setFormData({ ...formData, validFrom: e.target.value })
              }
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="validTo">Valid To (YYYY-MM-DD)</Label>
            <Input
              id="validTo"
              type="date"
              value={formData.validTo}
              onChange={(e) =>
                setFormData({ ...formData, validTo: e.target.value })
              }
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="suspensionFlag" className="flex items-center gap-2">
              <input
                id="suspensionFlag"
                type="checkbox"
                checked={formData.suspensionFlag}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    suspensionFlag: e.target.checked,
                  })
                }
                className="w-4 h-4"
              />
              Active Suspension
            </Label>
          </div>
          <div className="grid gap-3">
            <Label htmlFor="suspensionNote">Suspension Note</Label>
            <Input
              id="suspensionNote"
              value={formData.suspensionNote}
              onChange={(e) =>
                setFormData({ ...formData, suspensionNote: e.target.value })
              }
              placeholder="e.g., Test note"
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="suspensionRate">Suspension Rate (%)</Label>
            <Input
              id="suspensionRate"
              type="number"
              step="0.01"
              value={formData.suspensionRate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  suspensionRate: parseFloat(e.target.value),
                })
              }
            />
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
