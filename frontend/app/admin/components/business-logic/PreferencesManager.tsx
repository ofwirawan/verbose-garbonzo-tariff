"use client";

import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DataTable } from "../DataTable";
import { FormDialog } from "../FormDialog";
import {
  preferenceAPI,
  countryAPI,
  productAPI,
  Preference,
  Country,
  Product,
} from "@/app/admin/lib/api";

export function PreferencesManager() {
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPreference, setEditingPreference] = useState<Preference | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validFromPopoverOpen, setValidFromPopoverOpen] = useState(false);
  const [validToPopoverOpen, setValidToPopoverOpen] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<Preference>({
    importerCode: "",
    exporterCode: "",
    productCode: "",
    validFrom: "",
    validTo: "",
    prefAdValRate: 0,
  });

  const loadPreferences = async (page = 0, search = "") => {
    try {
      setIsLoading(true);
      console.log("📥 Loading preferences from page:", page, "search:", search);
      const response = await preferenceAPI.getAll(page, 25, search);
      console.log("✅ Preferences loaded:", {
        page,
        count: response.content.length,
        responseNumber: response.number,
        totalPages: response.totalPages,
        fullResponse: response,
      });
      setPreferences(response.content);
      setCurrentPage(response.number ?? page);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("❌ Error loading preferences:", error);
      toast.error(
        `Failed to load preferences: ${
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
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productAPI.getAll(0, 1000);
      setProducts(response.content);
    } catch (error) {
      console.error("❌ Error loading products:", error);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      loadPreferences(0, "");
      loadCountries();
      loadProducts();
    }
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    loadPreferences(0, query);
  };

  const handlePageChange = (page: number) => {
    loadPreferences(page, searchQuery);
  };

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
      if (editingPreference && editingPreference.preferenceId) {
        await preferenceAPI.update(editingPreference.preferenceId, formData);
        toast.success("Preference updated successfully");
      } else {
        await preferenceAPI.create(formData);
        toast.success("Preference created successfully");
      }
      setDialogOpen(false);
      loadPreferences(currentPage, searchQuery);
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
    if (!row.preferenceId) {
      throw new Error("Invalid preference ID");
    }

    await preferenceAPI.delete(row.preferenceId);
    // Reload the data after successful deletion
    await loadPreferences(currentPage, searchQuery);
  };

  const columns: ColumnDef<Preference>[] = [
    {
      accessorKey: "importerCode",
      header: "Importer Code",
    },
    {
      accessorKey: "exporterCode",
      header: "Exporter Code",
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
      accessorKey: "prefAdValRate",
      header: "Pref AdVal Rate (%)",
    },
  ];

  return (
    <div>
      <DataTable
        columns={columns}
        data={preferences}
        isLoading={isLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDeleteConfirm={handleDeleteConfirm}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
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
          <div className="grid gap-3">
            <Label htmlFor="importerCode">Importer Country</Label>
            <Select
              value={formData.importerCode}
              onValueChange={(value) =>
                setFormData({ ...formData, importerCode: value })
              }
            >
              <SelectTrigger id="importerCode">
                <SelectValue placeholder="Select importer country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem
                    key={country.countryCode}
                    value={country.countryCode}
                  >
                    {country.countryCode} - {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3">
            <Label htmlFor="exporterCode">Exporter Country</Label>
            <Select
              value={formData.exporterCode}
              onValueChange={(value) =>
                setFormData({ ...formData, exporterCode: value })
              }
            >
              <SelectTrigger id="exporterCode">
                <SelectValue placeholder="Select exporter country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem
                    key={country.countryCode}
                    value={country.countryCode}
                  >
                    {country.countryCode} - {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3">
            <Label htmlFor="productCode">Product</Label>
            <Select
              value={formData.productCode}
              onValueChange={(value) =>
                setFormData({ ...formData, productCode: value })
              }
            >
              <SelectTrigger id="productCode" className="truncate">
                <SelectValue
                  placeholder="Select product"
                  className="truncate"
                />
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
            <Label htmlFor="validFrom">Valid From</Label>
            <Popover open={validFromPopoverOpen} onOpenChange={setValidFromPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="validFrom"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left h-10 px-3 border-border hover:border-ring transition-colors font-normal",
                    !formData.validFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.validFrom
                    ? format(new Date(formData.validFrom), "MMM d, yyyy")
                    : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    formData.validFrom
                      ? new Date(formData.validFrom)
                      : undefined
                  }
                  onSelect={(date) => {
                    if (date) {
                      setFormData({
                        ...formData,
                        validFrom: format(date, "yyyy-MM-dd"),
                      });
                      setValidFromPopoverOpen(false);
                    }
                  }}
                  captionLayout="dropdown"
                  startMonth={new Date(1990, 0)}
                  endMonth={new Date(new Date().getFullYear() + 1, 11)}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-3">
            <Label htmlFor="validTo">Valid To</Label>
            <Popover open={validToPopoverOpen} onOpenChange={setValidToPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="validTo"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left h-10 px-3 border-border hover:border-ring transition-colors font-normal",
                    !formData.validTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.validTo
                    ? format(new Date(formData.validTo), "MMM d, yyyy")
                    : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    formData.validTo ? new Date(formData.validTo) : undefined
                  }
                  onSelect={(date) => {
                    if (date) {
                      setFormData({
                        ...formData,
                        validTo: format(date, "yyyy-MM-dd"),
                      });
                      setValidToPopoverOpen(false);
                    }
                  }}
                  captionLayout="dropdown"
                  startMonth={new Date(1990, 0)}
                  endMonth={new Date(new Date().getFullYear() + 1, 11)}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-3">
            <Label htmlFor="prefAdValRate">Preference AdVal Rate (%)</Label>
            <Input
              id="prefAdValRate"
              type="number"
              step="0.01"
              value={formData.prefAdValRate || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  prefAdValRate:
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
