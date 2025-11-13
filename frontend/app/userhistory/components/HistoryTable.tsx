"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";

import { ChevronDown, Trash2 } from "lucide-react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/auth";
import { HistoryItem, AppliedRate } from "../types";

interface HistoryTableProps {
  data: HistoryItem[];
}

export const columns: ColumnDef<HistoryItem>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const value = row.getValue<string>("date");
      if (!value) return "N/A";

      // Parse the date string directly without timezone conversion
      // Assuming the backend sends dates in YYYY-MM-DD format
      const [year, month, day] = value.split("-").map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed

      return date.toLocaleDateString();
    },
  },
  {
    accessorKey: "product",
    header: "Product",
    cell: ({ row }) => row.getValue("product") || "N/A",
  },
  {
    accessorKey: "route",
    header: "Route",
    cell: ({ row }) => row.getValue("route") || "N/A",
  },
  {
    accessorKey: "weight",
    header: "Weight (kg)",
    cell: ({ row }) => {
      const value = row.getValue<number | null>("weight");
      if (value === null || value === undefined) {
        return <div>N/A</div>;
      }
      return (
        <div>
          {value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          kg
        </div>
      );
    },
  },
  {
    accessorKey: "tradeValue",
    header: "Trade ($)",
    cell: ({ row }) => {
      const value = row.getValue<number>("tradeValue") || 0;
      return <div>${value.toLocaleString()}</div>;
    },
  },
  {
    accessorKey: "appliedRate",
    header: "Rate Details",
    cell: ({ row }) => {
      const appliedRate = row.getValue<AppliedRate>("appliedRate");

      if (!appliedRate) {
        return <div className="text-gray-500">No rate data</div>;
      }

      const renderRateDetails = () => {
        const rates = [];

        // Check for suspension
        if (appliedRate.suspension !== undefined) {
          rates.push(
            <div
              key="suspension"
              className="text-xs bg-gray-100 px-2 py-1 rounded mb-1"
            >
              <span className="font-medium text-gray-700">Suspended:</span>{" "}
              {Number(appliedRate.suspension).toFixed(2)}%
            </div>
          );
        }

        // Check for preferential rate
        if (appliedRate.prefAdval !== undefined) {
          rates.push(
            <div
              key="preferential"
              className="text-xs bg-green-100 px-2 py-1 rounded mb-1"
            >
              <span className="font-medium text-green-700">Preferential:</span>{" "}
              {Number(appliedRate.prefAdval).toFixed(2)}%
            </div>
          );
        }

        // Check for MFN rate
        if (appliedRate.mfnAdval !== undefined) {
          rates.push(
            <div
              key="mfn"
              className="text-xs bg-blue-100 px-2 py-1 rounded mb-1"
            >
              <span className="font-medium text-blue-700">MFN:</span>{" "}
              {Number(appliedRate.mfnAdval).toFixed(2)}%
            </div>
          );
        }

        // Check for specific duty
        if (appliedRate.specific !== undefined) {
          rates.push(
            <div
              key="specific"
              className="text-xs bg-orange-100 px-2 py-1 rounded mb-1"
            >
              <span className="font-medium text-orange-700">Specific:</span> $
              {Number(appliedRate.specific).toFixed(2)}/kg
            </div>
          );
        }

        return rates.length > 0 ? (
          rates
        ) : (
          <div className="text-gray-500 text-xs">No rate components</div>
        );
      };

      return <div className="space-y-1">{renderRateDetails()}</div>;
    },
  },
  {
    accessorKey: "tariffCost",
    header: "Tariff Cost",
    cell: ({ row }) => {
      const value = row.getValue<number>("tariffCost") || 0;
      return <div>${value.toLocaleString()}</div>;
    },
  },
  // New columns for enhanced data
  {
    accessorKey: "freightCost",
    header: "Freight",
    cell: ({ row }) => {
      const cost = row.getValue<number>("freightCost");
      const type = row.original.freightType;

      if (cost === null || cost === undefined) {
        return <div className="text-gray-500">N/A</div>;
      }

      return (
        <div>
          <div>${cost.toLocaleString()}</div>
          {type && <div className="text-xs text-gray-500">Type: {type}</div>}
        </div>
      );
    },
  },
  {
    accessorKey: "insuranceCost",
    header: "Insurance",
    cell: ({ row }) => {
      const cost = row.getValue<number>("insuranceCost");
      const rate = row.original.insuranceRate;

      if (cost === null || cost === undefined) {
        return <div className="text-gray-500">N/A</div>;
      }

      return (
        <div>
          <div>${cost.toLocaleString()}</div>
          {rate && <div className="text-xs text-gray-500">Rate: {rate}%</div>}
        </div>
      );
    },
  },
  // {
  //   accessorKey: "tradeFinal",
  //   header: "Final Trade Value",
  //   cell: ({ row }) => {
  //     const value = row.getValue<number>("tradeFinal");
  //     if (value === null || value === undefined) {
  //       return <div className="text-gray-500">N/A</div>;
  //     }
  //     return <div className="font-medium">${value.toLocaleString()}</div>;
  //   },
  // },
  {
    accessorKey: "totalLandedCost",
    header: "Total Landed Cost",
    cell: ({ row }) => {
      const value = row.getValue<number>("totalLandedCost");
      if (value === null || value === undefined) {
        return <div className="text-gray-500">N/A</div>;
      }
      return <div>${value.toLocaleString()}</div>;
    },
  },
];

export function HistoryTable({ data }: HistoryTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [history, setHistory] = useState<HistoryItem[]>(
    data.filter((item) => item != null)
  );
  const [deleteRow, setDeleteRow] = useState<HistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterValue, setFilterValue] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  const table = useReactTable({
    data: history,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const handleDeleteSelected = async () => {
    const selected = table.getFilteredSelectedRowModel().rows;

    setIsDeleting(true);
    try {
      // Call backend DELETE for each row using query parameters
      await Promise.all(
        selected.map((row) =>
          authenticatedFetch(`/api/history?id=${row.original.id}`, {
            method: "DELETE",
          })
        )
      );

      // Update frontend state
      setHistory((prev) =>
        prev.filter(
          (item) => !selected.some((row) => row.original.id === item.id)
        )
      );

      // Reset checkbox selection
      table.resetRowSelection();

      // Show toast notification
      toast.success(
        `${selected.length} item${selected.length > 1 ? "s" : ""} deleted successfully!`
      );
      setDeleteRow(null);
    } catch (err) {
      console.error("Failed to delete selected items:", err);
      toast.error("Failed to delete items. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFilterChange = (value: string) => {
    setFilterValue(value);

    // Clear previous timeout
    if (searchTimeout) clearTimeout(searchTimeout);

    // Apply filter to product column
    const timeout = setTimeout(() => {
      table.getColumn("product")?.setFilterValue(value);
    }, 300); // 300ms debounce
    setSearchTimeout(timeout);
  };

  return (
    <div className="w-full space-y-4 px-4 sm:px-0">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg sm:text-2xl font-semibold">History</h3>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <Input
            placeholder="Filter products..."
            value={filterValue}
            onChange={(event) => handleFilterChange(event.target.value)}
            className="w-full sm:max-w-sm text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-4"
          />
          <div className="flex gap-2 sm:gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-4"
                >
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline ml-2">Columns</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((col) => col.getCanHide())
                  .map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      className="capitalize text-xs sm:text-sm"
                      checked={col.getIsVisible()}
                      onCheckedChange={(value) =>
                        col.toggleVisibility(!!value)
                      }
                    >
                      {typeof col.columnDef.header === "string"
                        ? col.columnDef.header
                        : col.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={!!deleteRow} onOpenChange={(open) => !open && setDeleteRow(null)}>
              <Button
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-4 text-red-600 hover:bg-red-50"
                disabled={table.getFilteredSelectedRowModel().rows.length === 0}
                onClick={() => {
                  if (table.getFilteredSelectedRowModel().rows.length > 0) {
                    setDeleteRow(table.getFilteredSelectedRowModel().rows[0].original);
                  }
                }}
              >
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline ml-2">
                  Delete ({table.getFilteredSelectedRowModel().rows.length})
                </span>
                <span className="sm:hidden ml-1">
                  ({table.getFilteredSelectedRowModel().rows.length})
                </span>
              </Button>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete{" "}
                    <strong>{table.getFilteredSelectedRowModel().rows.length}</strong>{" "}
                    selected item
                    {table.getFilteredSelectedRowModel().rows.length === 1
                      ? ""
                      : "s"}
                    ? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteSelected}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isDeleting ? "Deleting..." : "Confirm Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        className={`rounded-md border overflow-hidden overflow-x-auto ${
          history.length > 10 ? "flex flex-col" : ""
        }`}
      >
        <div
          className={
            history.length > 10 ? "overflow-y-auto max-h-[600px]" : ""
          }
        >
          <Table className="min-w-full text-xs sm:text-sm">
            <TableHeader className="bg-card sticky top-0 z-0">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="px-2 sm:px-4 py-2 whitespace-nowrap text-xs sm:text-sm font-medium"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="px-2 sm:px-4 py-2 text-xs sm:text-sm break-words max-w-[150px] sm:max-w-none"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-xs sm:text-sm"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col items-center justify-between gap-2 sm:gap-4 sm:flex-row text-xs sm:text-sm">
        <div className="text-muted-foreground truncate">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
      </div>
    </div>
  );
}
