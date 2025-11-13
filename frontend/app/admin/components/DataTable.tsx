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
import { ChevronDown, Edit2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (row: TData) => void;
  onDeleteConfirm: (row: TData) => Promise<void>;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSearch?: (query: string) => void;
  title: string;
  emptyMessage?: string;
  filterColumnId?: string;
  showAddButton?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  onAdd,
  onEdit,
  onDeleteConfirm,
  currentPage,
  totalPages,
  onPageChange,
  onSearch,
  title,
  emptyMessage = "No data found",
  showAddButton = true,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [deleteRow, setDeleteRow] = useState<TData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterValue, setFilterValue] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Add actions column dynamically
  const columnsWithActions: ColumnDef<TData, TValue>[] = [
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
    } as ColumnDef<TData, TValue>,
    ...columns,
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(row.original)}
            className="text-blue-600 hover:bg-blue-50"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteRow(row.original)}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    } as ColumnDef<TData, TValue>,
  ];

  const table = useReactTable({
    data,
    columns: columnsWithActions,
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

  const handleDeleteConfirm = async () => {
    if (!deleteRow) return;
    setIsDeleting(true);
    try {
      await onDeleteConfirm(deleteRow);
      toast.success(`${title} deleted successfully`);
      setDeleteRow(null);
    } catch (error) {
      toast.error(
        `Failed to delete ${title}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full space-y-4 px-4 sm:px-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg sm:text-2xl font-semibold">{title}</h3>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <Input
            placeholder={`Search ${title.toLowerCase()}...`}
            className="w-full sm:max-w-sm text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-4"
            value={filterValue}
            onChange={(e) => {
              const value = e.target.value;
              setFilterValue(value);

              // Clear previous timeout
              if (searchTimeout) clearTimeout(searchTimeout);

              // If onSearch callback is provided, use server-side search
              if (onSearch) {
                const timeout = setTimeout(() => {
                  onSearch(value);
                }, 300); // 300ms debounce
                setSearchTimeout(timeout);
              }
            }}
          />
          <div className="flex gap-2 sm:gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-4">
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline ml-2">Columns</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize text-xs sm:text-sm"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
            {showAddButton && (
              <Button
                onClick={onAdd}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-4"
                disabled={isLoading}
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline ml-2">Add {title}</span>
                <span className="sm:hidden ml-1">Add</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          Loading...
        </div>
      ) : (
        <>
          <div
            className={`rounded-md border overflow-hidden overflow-x-auto ${
              data.length > 10 ? "flex flex-col" : ""
            }`}
          >
            <div
              className={
                data.length > 10 ? "overflow-y-auto max-h-[600px]" : ""
              }
            >
              <Table className="min-w-full text-xs sm:text-sm">
                <TableHeader className="bg-card sticky top-0 z-0">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
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
                        );
                      })}
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
                        colSpan={columnsWithActions.length}
                        className="h-24 text-center text-xs sm:text-sm"
                      >
                        {emptyMessage}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-2 sm:gap-4 sm:flex-row text-xs sm:text-sm">
            <div className="text-muted-foreground truncate">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="flex gap-1 sm:gap-2 items-center flex-wrap justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 0 || isLoading}
                className="text-xs h-8 px-2"
              >
                Prev
              </Button>
              <div className="text-xs sm:text-sm font-medium text-foreground px-1 sm:px-2 py-1 bg-muted rounded min-w-fit">
                {currentPage + 1}/{totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1 || isLoading}
                className="text-xs h-8 px-2"
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteRow}
        onOpenChange={(open) => !open && setDeleteRow(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {title}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {title.toLowerCase()}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
