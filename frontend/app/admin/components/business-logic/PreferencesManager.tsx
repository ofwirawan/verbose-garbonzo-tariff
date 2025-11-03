"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DataTable } from "../DataTable";
import { FormDialog } from "../FormDialog";
import {
  preferenceAPI,
  Preference,
  PaginatedResponse,
} from "@/app/admin/lib/api";

export function PreferencesManager() {
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPreference, setEditingPreference] = useState<Preference | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Preference>({
    importerCode: "",
    exporterCode: "",
    productCode: "",
    validFrom: "",
    validTo: "",
    prefAdValRate: 0,
  });

  const loadPreferences = async (page = 0) => {
    try {
      setIsLoading(true);
      const response = await preferenceAPI.getAll(page, 10);
      setPreferences(response.content);
      setCurrentPage(response.currentPage);
      setTotalPages(response.totalPages);
    } catch (error) {
      toast.error("Failed to load preferences");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences(0);
  }, []);

  const handleAdd = () => {
    setEditingPreference(null);
    setFormData({
      importerCode: "",
      exporterCode: "",
      productCode: "",
      validFrom: "",
      validTo: "",
      prefAdValRate: 0,
    });
    setDialogOpen(true);
  };

  const handleEdit = (row: Preference) => {
    setEditingPreference(row);
    setFormData(row);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (
      !formData.importerCode ||
      !formData.exporterCode ||
      !formData.productCode ||
      !formData.validFrom ||
      !formData.validTo
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPreference && editingPreference.id) {
        await preferenceAPI.update(editingPreference.id, formData);
        toast.success("Preference updated successfully");
      } else {
        await preferenceAPI.create(formData);
        toast.success("Preference created successfully");
      }
      setDialogOpen(false);
      loadPreferences(currentPage);
    } catch (error) {
      toast.error(
        `Failed to save preference: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async (row: Preference) => {
    if (row.id) {
      await preferenceAPI.delete(row.id);
      loadPreferences(currentPage);
    }
  };

  const columns = [
    { key: "importerCode", label: "Importer Code" },
    { key: "exporterCode", label: "Exporter Code" },
    { key: "productCode", label: "Product Code" },
    { key: "validFrom", label: "Valid From" },
    { key: "validTo", label: "Valid To" },
    { key: "prefAdValRate", label: "Pref AdVal Rate (%)" },
  ];

  return (
    <div>
      <DataTable
        columns={columns}
        data={preferences}
        isLoading={isLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={() => {}}
        onDeleteConfirm={handleDeleteConfirm}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={loadPreferences}
        title="Preferences"
      />

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingPreference ? "Edit Preference" : "Add Preference"}
        description={
          editingPreference
            ? "Update the preference information"
            : "Create a new preference"
        }
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      >
        <div className="space-y-4">
          <div>
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
          <div>
            <Label htmlFor="exporterCode">Exporter Code</Label>
            <Input
              id="exporterCode"
              value={formData.exporterCode}
              onChange={(e) =>
                setFormData({ ...formData, exporterCode: e.target.value })
              }
              placeholder="e.g., MY"
            />
          </div>
          <div>
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
          <div>
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
          <div>
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
          <div>
            <Label htmlFor="prefAdValRate">Preference AdVal Rate (%)</Label>
            <Input
              id="prefAdValRate"
              type="number"
              step="0.01"
              value={formData.prefAdValRate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  prefAdValRate: parseFloat(e.target.value),
                })
              }
            />
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
