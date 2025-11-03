"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DataTable } from "../DataTable";
import { FormDialog } from "../FormDialog";
import { countryAPI, Country, PaginatedResponse } from "@/app/admin/lib/api";

export function CountriesManager() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Country>({
    countryCode: "",
    numericCode: "",
    name: "",
  });

  const loadCountries = async (page = 0) => {
    try {
      setIsLoading(true);
      console.log("📥 Loading countries from page:", page);
      // Debug: Check if token exists in localStorage
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("jwt_token");
        console.log("🔑 Token in localStorage:", {
          exists: !!token,
          preview: token ? `${token.substring(0, 30)}...` : "NO TOKEN",
          length: token?.length,
        });
      }
      const response = await countryAPI.getAll(page, 10);
      console.log("✅ Countries loaded successfully:", response);
      setCountries(response.content);
      setCurrentPage(response.currentPage);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("❌ Error loading countries:", error);
      toast.error(
        `Failed to load countries: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only load on client side after component mounts
    if (typeof window !== "undefined") {
      loadCountries(currentPage);
    }
  }, []);

  const handleAdd = () => {
    setEditingCountry(null);
    setFormData({ countryCode: "", numericCode: "", name: "" });
    setDialogOpen(true);
  };

  const handleEdit = (row: Country) => {
    setEditingCountry(row);
    setFormData(row);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.countryCode || !formData.numericCode || !formData.name) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCountry) {
        await countryAPI.update(editingCountry.countryCode, formData);
        toast.success("Country updated successfully");
      } else {
        await countryAPI.create(formData);
        toast.success("Country created successfully");
      }
      setDialogOpen(false);
      loadCountries(currentPage);
    } catch (error) {
      toast.error(
        `Failed to save country: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async (row: Country) => {
    await countryAPI.delete(row.countryCode);
    loadCountries(currentPage);
  };

  const columns = [
    { key: "countryCode", label: "Country Code" },
    { key: "numericCode", label: "Numeric Code" },
    { key: "name", label: "Country Name" },
  ];

  return (
    <div>
      <DataTable
        columns={columns}
        data={countries}
        isLoading={isLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={() => {}}
        onDeleteConfirm={handleDeleteConfirm}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={loadCountries}
        title="Countries"
      />

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingCountry ? "Edit Country" : "Add Country"}
        description={
          editingCountry
            ? "Update the country information"
            : "Create a new country"
        }
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="countryCode">Country Code</Label>
            <Input
              id="countryCode"
              value={formData.countryCode}
              onChange={(e) =>
                setFormData({ ...formData, countryCode: e.target.value })
              }
              placeholder="e.g., SG"
              disabled={!!editingCountry}
            />
          </div>
          <div>
            <Label htmlFor="numericCode">Numeric Code</Label>
            <Input
              id="numericCode"
              value={formData.numericCode}
              onChange={(e) =>
                setFormData({ ...formData, numericCode: e.target.value })
              }
              placeholder="e.g., 702"
            />
          </div>
          <div>
            <Label htmlFor="name">Country Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Singapore"
            />
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
