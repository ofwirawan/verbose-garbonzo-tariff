"use client";

import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { DataTable } from "../DataTable";
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
  const [searchQuery, setSearchQuery] = useState("");

  const loadTransactions = async (page = 0, search = "") => {
    try {
      setIsLoading(true);
      console.log("📥 Loading transactions from page:", page, "search:", search);
      const response = await transactionAPI.getAll(page, 25, search);
      console.log("✅ Transactions loaded:", {
        page,
        count: response.content.length,
        responseNumber: response.number,
        totalPages: response.totalPages,
        fullResponse: response,
      });
      setTransactions(response.content);
      // Spring returns 'number' for current page, not 'currentPage'
      setCurrentPage(response.number ?? page);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("❌ Error loading transactions:", error);
      toast.error(
        `Failed to load transactions: ${
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
      loadTransactions(0, "");
    }
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Reset to page 0 when searching and load with search query
    loadTransactions(0, query);
  };

  const handlePageChange = (page: number) => {
    loadTransactions(page, searchQuery);
  };

  const handleDeleteConfirm = async (row: Transaction) => {
    if (row.tid !== undefined) {
      await transactionAPI.delete(row.tid);
      loadTransactions(currentPage, searchQuery);
    }
  };

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "tid",
      header: "ID",
      size: 60,
    },
    {
      accessorKey: "user",
      header: "User",
      size: 100,
    },
    {
      accessorKey: "tDate",
      header: "Date",
      size: 100,
      cell: ({ row }) => {
        const date = new Date(row.original.tDate);
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: '2-digit'
        });
      },
    },
    {
      id: "trade",
      header: "Trade Details",
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="font-medium">
            {row.original.importer} → {row.original.exporter}
          </div>
          <div className="text-gray-500 truncate max-w-32">
            {row.original.product}
          </div>
        </div>
      ),
    },
    {
      id: "values",
      header: "Trade Value",
      cell: ({ row }) => (
        <div className="text-sm text-right">
          <div className="font-medium">
            ${row.original.tradeFinal?.toLocaleString() || 'N/A'}
          </div>
          <div className="text-gray-500">
            ${row.original.tradeOriginal?.toLocaleString() || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "appliedRate",
      header: "Rate %",
      size: 80,
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.appliedRate?.rate
            ? `${row.original.appliedRate.rate.toFixed(1)}%`
            : "N/A"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <DataTable
        columns={columns}
        data={transactions}
        isLoading={isLoading}
        onAdd={() => {}}
        onEdit={() => {}}
        onDeleteConfirm={handleDeleteConfirm}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        title="Transactions"
        emptyMessage="No transactions found"
        showAddButton={false}
      />
    </div>
  );
}
