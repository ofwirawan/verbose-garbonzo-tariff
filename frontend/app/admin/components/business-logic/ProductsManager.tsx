"use client";

import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DataTable } from "../DataTable";
import { FormDialog } from "../FormDialog";
import { productAPI, Product, PaginatedResponse } from "@/app/admin/lib/api";

export function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Product>({
    hs6Code: "",
    description: "",
  });

  const loadProducts = async (page = 0, search = "") => {
    try {
      setIsLoading(true);
      console.log("📥 Loading products from page:", page, "search:", search);
      const response = await productAPI.getAll(page, 25, search);
      console.log("✅ Products loaded:", {
        page,
        count: response.content.length,
        responseNumber: response.number,
        totalPages: response.totalPages,
        fullResponse: response,
      });
      setProducts(response.content);
      // Spring returns 'number' for current page, not 'currentPage'
      setCurrentPage(response.number ?? page);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("❌ Error loading products:", error);
      toast.error(
        `Failed to load products: ${
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
      loadProducts(currentPage, searchQuery);
    }
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Reset to page 0 when searching and load with search query
    loadProducts(0, query);
  };

  const handlePageChange = (page: number) => {
    loadProducts(page, searchQuery);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setFormData({ hs6Code: "", description: "" });
    setDialogOpen(true);
  };

  const handleEdit = (row: Product) => {
    setEditingProduct(row);
    setFormData(row);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.hs6Code || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await productAPI.update(editingProduct.hs6Code, formData);
        toast.success("Product updated successfully");
      } else {
        await productAPI.create(formData);
        toast.success("Product created successfully");
      }
      setDialogOpen(false);
      loadProducts(currentPage, searchQuery);
    } catch (error) {
      toast.error(
        `Failed to save product: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async (row: Product) => {
    await productAPI.delete(row.hs6Code);
    loadProducts(currentPage, searchQuery);
  };

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "hs6Code",
      header: "HS6 Code",
    },
    {
      accessorKey: "description",
      header: "Description",
    },
  ];

  return (
    <div>
      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDeleteConfirm={handleDeleteConfirm}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        title="Products"
      />

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingProduct ? "Edit Product" : "Add Product"}
        description={
          editingProduct
            ? "Update the product information"
            : "Create a new product"
        }
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      >
        <div className="space-y-4">
          <div className="grid gap-3">
            <Label htmlFor="hs6Code">HS6 Code</Label>
            <Input
              id="hs6Code"
              value={formData.hs6Code}
              onChange={(e) =>
                setFormData({ ...formData, hs6Code: e.target.value })
              }
              placeholder="e.g., 123456"
              disabled={!!editingProduct}
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="e.g., Test Product"
            />
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
