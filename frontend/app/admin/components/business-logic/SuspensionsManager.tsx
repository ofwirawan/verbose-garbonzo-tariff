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
  suspensionAPI,
  countryAPI,
  productAPI,
  Suspension,
  Country,
  Product,
} from "@/app/admin/lib/api";

export function SuspensionsManager() {
  const [suspensions, setSuspensions] = useState<Suspension[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSuspension, setEditingSuspension] = useState<Suspension | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validFromPopoverOpen, setValidFromPopoverOpen] = useState(false);
  const [validToPopoverOpen, setValidToPopoverOpen] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<Suspension>({
    importerCode: "",
    productCode: "",
    validFrom: "",
    validTo: "",
    suspensionFlag: false,
    suspensionNote: "",
    suspensionRate: 0,
  });

  const loadSuspensions = async (page = 0, search = "") => {
    try {
      setIsLoading(true);
      console.log("📥 Loading suspensions from page:", page, "search:", search);
      const response = await suspensionAPI.getAll(page, 25, search);
      console.log("✅ Suspensions loaded:", {
        page,
        count: response.content.length,
        responseNumber: response.number,
        totalPages: response.totalPages,
        fullResponse: response,
      });
      setSuspensions(response.content);
      setCurrentPage(response.number ?? page);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("❌ Error loading suspensions:", error);
      toast.error(
        `Failed to load suspensions: ${
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
      loadSuspensions(0, "");
      loadCountries();
      loadProducts();
    }
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    loadSuspensions(0, query);
  };

  const handlePageChange = (page: number) => {
    loadSuspensions(page, searchQuery);
  };

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
      if (editingSuspension && editingSuspension.suspensionId) {
        await suspensionAPI.update(editingSuspension.suspensionId, formData);
        toast.success("Suspension updated successfully");
      } else {
        await suspensionAPI.create(formData);
        toast.success("Suspension created successfully");
      }
      setDialogOpen(false);
      loadSuspensions(currentPage, searchQuery);
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
    if (!row.suspensionId) {
      throw new Error("Invalid suspension ID");
    }

    await suspensionAPI.delete(row.suspensionId);
    // Reload the data after successful deletion
    await loadSuspensions(currentPage, searchQuery);
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
        onPageChange={handlePageChange}
        onSearch={handleSearch}
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
              value={formData.suspensionRate || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  suspensionRate:
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
