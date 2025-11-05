"use client";

import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "../DataTable";
import { FormDialog } from "../FormDialog";
import { measureAPI, countryAPI, productAPI, Measure, Country, Product, PaginatedResponse } from "@/app/admin/lib/api";

export function MeasuresManager() {
  const [measures, setMeasures] = useState<Measure[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
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

  const loadMeasures = async (page = 0, search = "") => {
    try {
      setIsLoading(true);
      console.log("📥 Loading measures from page:", page, "search:", search);
      const response = await measureAPI.getAll(page, 25, search);
      console.log("✅ Measures loaded:", {
        page,
        count: response.content.length,
        responseNumber: response.number,
        totalPages: response.totalPages,
        fullResponse: response,
      });
      setMeasures(response.content);
      // Spring returns 'number' for current page, not 'currentPage'
      setCurrentPage(response.number ?? page);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("❌ Error loading measures:", error);
      toast.error(
        `Failed to load measures: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadCountries = async () => {
    try {
      const response = await countryAPI.getAll(0, 1000);
      setCountries(response.content);
    } catch (error) {
      console.error("❌ Error loading countries:", error);
      toast.error("Failed to load countries");
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productAPI.getAll(0, 1000);
      setProducts(response.content);
    } catch (error) {
      console.error("❌ Error loading products:", error);
      toast.error("Failed to load products");
    }
  };

  useEffect(() => {
    // Only load on client side after component mounts
    if (typeof window !== "undefined") {
      loadMeasures(currentPage, searchQuery);
      loadCountries();
      loadProducts();
    }
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Reset to page 0 when searching and load with search query
    loadMeasures(0, query);
  };

  const handlePageChange = (page: number) => {
    loadMeasures(page, searchQuery);
  };

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
      loadMeasures(currentPage, searchQuery);
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
      loadMeasures(currentPage, searchQuery);
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
        onPageChange={handlePageChange}
        onSearch={handleSearch}
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
            <Select
              value={formData.importerCode}
              onValueChange={(value) =>
                setFormData({ ...formData, importerCode: value })
              }
            >
              <SelectTrigger id="importerCode">
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.countryCode} value={country.countryCode}>
                    {country.countryCode} - {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3">
            <Label htmlFor="productCode">Product Code</Label>
            <Select
              value={formData.productCode}
              onValueChange={(value) =>
                setFormData({ ...formData, productCode: value })
              }
            >
              <SelectTrigger id="productCode">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.hs6Code} value={product.hs6Code}>
                    {product.hs6Code} - {product.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              placeholder="e.g., 5"
              value={formData.mfnAdvalRate || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mfnAdvalRate:
                    e.target.value === "" ? 0 : parseFloat(e.target.value),
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
              placeholder="e.g., 0.35"
              value={formData.specificRatePerKg || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  specificRatePerKg:
                    e.target.value === "" ? 0 : parseFloat(e.target.value),
                })
              }
            />
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
