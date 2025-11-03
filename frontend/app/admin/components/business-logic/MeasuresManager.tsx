"use client";

import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DataTable } from "../DataTable";
import { FormDialog } from "../FormDialog";
import { measureAPI, Measure, PaginatedResponse } from "@/app/admin/lib/api";

export function MeasuresManager() {
  const [measures, setMeasures] = useState<Measure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMeasure, setEditingMeasure] = useState<Measure | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Measure>({
    importerCode: "",
    productCode: "",
    validFrom: "",
    validTo: "",
    mfnAdvalRate: 0,
    specificRatePerKg: 0,
  });

  const loadMeasures = async (page = 0) => {
    try {
      setIsLoading(true);
      const response = await measureAPI.getAll(page, 10);
      setMeasures(response.content);
      setCurrentPage(response.currentPage);
      setTotalPages(response.totalPages);
    } catch (error) {
      toast.error("Failed to load measures");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMeasures(0);
  }, []);

  const handleAdd = () => {
    setEditingMeasure(null);
    setFormData({
      importerCode: "",
      productCode: "",
      validFrom: "",
      validTo: "",
      mfnAdvalRate: 0,
      specificRatePerKg: 0,
    });
    setDialogOpen(true);
  };

  const handleEdit = (row: Measure) => {
    setEditingMeasure(row);
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
      if (editingMeasure && editingMeasure.id) {
        await measureAPI.update(editingMeasure.id, formData);
        toast.success("Measure updated successfully");
      } else {
        await measureAPI.create(formData);
        toast.success("Measure created successfully");
      }
      setDialogOpen(false);
      loadMeasures(currentPage);
    } catch (error) {
      toast.error(
        `Failed to save measure: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async (row: Measure) => {
    if (row.id) {
      await measureAPI.delete(row.id);
      loadMeasures(currentPage);
    }
  };

  const columns: ColumnDef<Measure>[] = [
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
      accessorKey: "mfnAdvalRate",
      header: "MFN AdVal Rate (%)",
    },
    {
      accessorKey: "specificRatePerKg",
      header: "Specific Rate/kg",
    },
  ];

  return (
    <div>
      <DataTable
        columns={columns}
        data={measures}
        isLoading={isLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDeleteConfirm={handleDeleteConfirm}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={loadMeasures}
        title="Measures"
      />

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingMeasure ? "Edit Measure" : "Add Measure"}
        description={
          editingMeasure
            ? "Update the measure information"
            : "Create a new measure"
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
            <Label htmlFor="mfnAdvalRate">MFN AdVal Rate (%)</Label>
            <Input
              id="mfnAdvalRate"
              type="number"
              step="0.01"
              value={formData.mfnAdvalRate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mfnAdvalRate: parseFloat(e.target.value),
                })
              }
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="specificRatePerKg">Specific Rate Per Kg</Label>
            <Input
              id="specificRatePerKg"
              type="number"
              step="0.01"
              value={formData.specificRatePerKg}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  specificRatePerKg: parseFloat(e.target.value),
                })
              }
            />
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
