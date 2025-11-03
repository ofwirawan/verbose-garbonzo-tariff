"use client";

import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DataTable } from "../DataTable";
import { FormDialog } from "../FormDialog";
import {
  transactionAPI,
  Transaction,
  PaginatedResponse,
} from "@/app/admin/lib/api";

export function TransactionsManager() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Transaction>({
    user: "",
    tDate: "",
    importer: "",
    exporter: "",
    product: "",
    tradeOriginal: 0,
    netWeight: 0,
    tradeFinal: 0,
    appliedRate: { rate: 0 },
  });

  const loadTransactions = async (page = 0) => {
    try {
      setIsLoading(true);
      const response = await transactionAPI.getAll(page, 10);
      setTransactions(response.content);
      setCurrentPage(response.currentPage);
      setTotalPages(response.totalPages);
    } catch (error) {
      toast.error("Failed to load transactions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions(0);
  }, []);

  const handleAdd = () => {
    setEditingTransaction(null);
    setFormData({
      user: "",
      tDate: "",
      importer: "",
      exporter: "",
      product: "",
      tradeOriginal: 0,
      netWeight: 0,
      tradeFinal: 0,
      appliedRate: { rate: 0 },
    });
    setDialogOpen(true);
  };

  const handleEdit = (row: Transaction) => {
    setEditingTransaction(row);
    setFormData(row);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (
      !formData.user ||
      !formData.tDate ||
      !formData.importer ||
      !formData.exporter ||
      !formData.product
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTransaction && editingTransaction.tid !== undefined) {
        await transactionAPI.update(editingTransaction.tid, formData);
        toast.success("Transaction updated successfully");
      } else {
        await transactionAPI.create(formData);
        toast.success("Transaction created successfully");
      }
      setDialogOpen(false);
      loadTransactions(currentPage);
    } catch (error) {
      toast.error(
        `Failed to save transaction: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async (row: Transaction) => {
    if (row.tid !== undefined) {
      await transactionAPI.delete(row.tid);
      loadTransactions(currentPage);
    }
  };

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "tid",
      header: "Transaction ID",
    },
    {
      accessorKey: "user",
      header: "User",
    },
    {
      accessorKey: "tDate",
      header: "Date",
    },
    {
      accessorKey: "importer",
      header: "Importer",
    },
    {
      accessorKey: "exporter",
      header: "Exporter",
    },
    {
      accessorKey: "product",
      header: "Product",
    },
    {
      accessorKey: "tradeOriginal",
      header: "Original Trade Value",
    },
    {
      accessorKey: "tradeFinal",
      header: "Final Trade Value",
    },
    {
      accessorKey: "appliedRate",
      header: "Applied Rate (%)",
      cell: ({ row }) =>
        row.original.appliedRate?.rate
          ? row.original.appliedRate.rate.toFixed(2)
          : "N/A",
    },
  ];

  return (
    <div>
      <DataTable
        columns={columns}
        data={transactions}
        isLoading={isLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDeleteConfirm={handleDeleteConfirm}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={loadTransactions}
        title="Transactions"
        emptyMessage="No transactions found"
      />

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingTransaction ? "Edit Transaction" : "Add Transaction"}
        description={
          editingTransaction
            ? "Update the transaction information"
            : "Create a new transaction"
        }
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel={editingTransaction ? "Update" : "Create"}
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <div className="grid gap-3">
            <Label htmlFor="user">User ID (UUID)</Label>
            <Input
              id="user"
              value={formData.user}
              onChange={(e) =>
                setFormData({ ...formData, user: e.target.value })
              }
              placeholder="e.g., b3e1e7e2-8c2d-4b7a-9e6e-123456789abc"
              disabled={!!editingTransaction}
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="tDate">Transaction Date (YYYY-MM-DD)</Label>
            <Input
              id="tDate"
              type="date"
              value={formData.tDate}
              onChange={(e) =>
                setFormData({ ...formData, tDate: e.target.value })
              }
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="importer">Importer Code</Label>
            <Input
              id="importer"
              value={formData.importer}
              onChange={(e) =>
                setFormData({ ...formData, importer: e.target.value })
              }
              placeholder="e.g., SG"
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="exporter">Exporter Code</Label>
            <Input
              id="exporter"
              value={formData.exporter}
              onChange={(e) =>
                setFormData({ ...formData, exporter: e.target.value })
              }
              placeholder="e.g., MY"
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="product">Product Code</Label>
            <Input
              id="product"
              value={formData.product}
              onChange={(e) =>
                setFormData({ ...formData, product: e.target.value })
              }
              placeholder="e.g., 123456"
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="tradeOriginal">Original Trade Value</Label>
            <Input
              id="tradeOriginal"
              type="number"
              step="0.01"
              value={formData.tradeOriginal}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tradeOriginal: parseFloat(e.target.value),
                })
              }
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="netWeight">Net Weight (kg)</Label>
            <Input
              id="netWeight"
              type="number"
              step="0.01"
              value={formData.netWeight}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  netWeight: parseFloat(e.target.value),
                })
              }
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="tradeFinal">Final Trade Value</Label>
            <Input
              id="tradeFinal"
              type="number"
              step="0.01"
              value={formData.tradeFinal}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tradeFinal: parseFloat(e.target.value),
                })
              }
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="appliedRate">Applied Rate (%)</Label>
            <Input
              id="appliedRate"
              type="number"
              step="0.01"
              value={formData.appliedRate.rate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  appliedRate: { rate: parseFloat(e.target.value) },
                })
              }
            />
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
