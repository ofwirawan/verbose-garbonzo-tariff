"use client";

import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DataTable } from "../DataTable";
import { FormDialog } from "../FormDialog";
import { countryAPI, Country } from "@/app/admin/lib/api";

export function CountriesManager() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Country>({
    countryCode: "",
    numericCode: "",
    name: "",
    city: "",
  });

  const loadCountries = async (page = 0, search = "") => {
    try {
      setIsLoading(true);
      console.log("📥 Loading countries from page:", page, "search:", search);
      const response = await countryAPI.getAll(page, 25, search);
      console.log("✅ Countries loaded:", {
        page,
        count: response.content.length,
        responseNumber: response.number,
        totalPages: response.totalPages,
        fullResponse: response,
      });
      setCountries(response.content);
      // Spring returns 'number' for current page, not 'currentPage'
      setCurrentPage(response.number ?? page);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("❌ Error loading countries:", error);
      toast.error(
        `Failed to load countries: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only load on client side after component mounts
    if (typeof window !== "undefined") {
      loadCountries(currentPage, searchQuery);
    }
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Reset to page 0 when searching and load with search query
    loadCountries(0, query);
  };

  const handlePageChange = (page: number) => {
    loadCountries(page, searchQuery);
  };

  const handleAdd = () => {
    setEditingCountry(null);
    setFormData({ countryCode: "", numericCode: "", name: "", city: "" });
    setDialogOpen(true);
  };

  const handleEdit = (row: Country) => {
    setEditingCountry(row);
    setFormData(row);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (
      !formData.countryCode ||
      !formData.numericCode ||
      !formData.name ||
      !formData.city
    ) {
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

  const columns: ColumnDef<Country>[] = [
    {
      accessorKey: "countryCode",
      header: "Country Code",
    },
    {
      accessorKey: "numericCode",
      header: "Numeric Code",
    },
    {
      accessorKey: "name",
      header: "Country Name",
    },
    {
      accessorKey: "city",
      header: "City",
    },
  ];

  return (
    <div>
      <DataTable
        columns={columns}
        data={countries}
        isLoading={isLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDeleteConfirm={handleDeleteConfirm}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
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
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <div className="grid gap-3">
            <Label htmlFor="countryCode">Country Code</Label>
            <Input
              id="countryCode"
              value={formData.countryCode}
              onChange={(e) =>
                setFormData({ ...formData, countryCode: e.target.value })
              }
              placeholder="e.g., SGP"
              disabled={!!editingCountry}
              maxLength={3}
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="numericCode">Numeric Code</Label>
            <Input
              id="numericCode"
              value={formData.numericCode}
              onChange={(e) =>
                setFormData({ ...formData, numericCode: e.target.value })
              }
              placeholder="e.g., 702"
              maxLength={3}
            />
          </div>
          <div className="grid gap-3">
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
          <div className="grid gap-3">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              placeholder="e.g., Singapore"
            />
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
