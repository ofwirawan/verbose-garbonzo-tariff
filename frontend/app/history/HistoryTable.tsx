"use client"

import * as React from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
} from "@tanstack/react-table"
import { ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { toast } from "sonner"
import { authenticatedFetch } from "@/lib/auth"

// Backend Transaction model structure
export interface BackendTransaction {
    tid: number
    tDate: string
    hs6code: string
    importerCode: string
    exporterCode?: string
    tradeOriginal: number
    tradeFinal: number
    netWeight?: number
    appliedRate?: any
    uid: string
}

// Frontend display structure
export interface HistoryItem {
    id: number
    date: string
    product: string
    route: string
    tradeValue: number
    tariffRate: number
    tariffCost: number
    weight: number | null
    appliedRate?: any  // Add the full applied rate JSON
}

// Transform backend data to frontend format
export function transformTransactionToHistoryItem(transaction: BackendTransaction): HistoryItem {
    return {
        id: transaction.tid,
        date: transaction.tDate,
        product: transaction.hs6code,
        route: `${transaction.importerCode}${transaction.exporterCode ? ` → ${transaction.exporterCode}` : ''}`,
        tradeValue: transaction.tradeOriginal,
        tariffRate: transaction.appliedRate?.rate || 0,
        tariffCost: transaction.tradeFinal - transaction.tradeOriginal,
        weight: transaction.netWeight || null,
        appliedRate: transaction.appliedRate  // Include the full applied rate data
    }
}

interface HistoryTableProps {
    data: HistoryItem[]
    onDelete: (ids: number[]) => void
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
            const [year, month, day] = value.split('-').map(Number);
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
            return <div>{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg</div>;
        },
    },
    {
        accessorKey: "tradeValue",
        header: "Trade Value",
        cell: ({ row }) => {
            const value = row.getValue<number>("tradeValue") || 0;
            return <div>${value.toLocaleString()}</div>;
        },
    },
    {
        accessorKey: "tariffRate",
        header: "Tariff Rate (%)",
        cell: ({ row }) => {
            const value = row.getValue<number>("tariffRate");
            return value !== undefined && value !== null ? `${Number(value).toFixed(2)}%` : "N/A";
        },
    },
    {
        accessorKey: "appliedRate",
        header: "Rate Details",
        cell: ({ row }) => {
            const appliedRate = row.getValue<any>("appliedRate");
            
            if (!appliedRate) {
                return <div className="text-gray-500">No rate data</div>;
            }

            const renderRateDetails = () => {
                const rates = [];
                
                // Check for suspension
                if (appliedRate.suspension !== undefined) {
                    rates.push(
                        <div key="suspension" className="text-xs bg-gray-100 px-2 py-1 rounded mb-1">
                            <span className="font-medium text-gray-700">Suspended:</span> {Number(appliedRate.suspension).toFixed(2)}%
                        </div>
                    );
                }
                
                // Check for preferential rate
                if (appliedRate.prefAdval !== undefined) {
                    rates.push(
                        <div key="preferential" className="text-xs bg-green-100 px-2 py-1 rounded mb-1">
                            <span className="font-medium text-green-700">Preferential:</span> {Number(appliedRate.prefAdval).toFixed(2)}%
                        </div>
                    );
                }
                
                // Check for MFN rate
                if (appliedRate.mfnAdval !== undefined) {
                    rates.push(
                        <div key="mfn" className="text-xs bg-blue-100 px-2 py-1 rounded mb-1">
                            <span className="font-medium text-blue-700">MFN:</span> {Number(appliedRate.mfnAdval).toFixed(2)}%
                        </div>
                    );
                }
                
                // Check for specific duty
                if (appliedRate.specific !== undefined) {
                    rates.push(
                        <div key="specific" className="text-xs bg-orange-100 px-2 py-1 rounded mb-1">
                            <span className="font-medium text-orange-700">Specific:</span> ${Number(appliedRate.specific).toFixed(2)}/kg
                        </div>
                    );
                }
                
                return rates.length > 0 ? rates : <div className="text-gray-500 text-xs">No rate components</div>;
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
]

export function HistoryTable({ data, onDelete }: HistoryTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [history, setHistory] = React.useState<HistoryItem[]>(data.filter(item => item != null))

    const table = useReactTable({
        data: history,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
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
    })

    const handleBulkDelete = () => {
        const selectedIds = table.getSelectedRowModel().rows.map((row) => row.original.id)
        if (selectedIds.length > 0) {
            onDelete(selectedIds)
            table.resetRowSelection()
        }
        toast.success("History Deleted Successfully!");
    }

    return (
        <div className="w-full">
            {/* Toolbar */}
            <div className="flex items-center py-4 space-x-2">
                <Input
                    placeholder="Filter products..."
                    value={(table.getColumn("product")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("product")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />

                {/* Delete button with confirmation */}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={table.getFilteredSelectedRowModel().rows.length === 0}
                        >
                            Delete {table.getFilteredSelectedRowModel().rows.length} selected
                            {table.getFilteredSelectedRowModel().rows.length === 1 ? " item" : " items"}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete{" "}
                                <strong>{table.getFilteredSelectedRowModel().rows.length}</strong>{" "}
                                selected item
                                {table.getFilteredSelectedRowModel().rows.length === 1 ? "" : "s"}?
                                This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={async () => {
                                    const selected = table.getFilteredSelectedRowModel().rows

                                    try {
                                        // Call backend DELETE for each row using query parameters
                                        const deletePromises = selected.map(async (row) => {
                                            const response = await authenticatedFetch(`/api/history?id=${row.original.id}`, {
                                                method: "DELETE",
                                            })
                                            return response
                                        })

                                        const results = await Promise.all(deletePromises)

                                        // Update frontend state
                                        setHistory((prev) =>
                                            prev.filter(
                                                (item) => !selected.some((row) => row.original.id === item.id)
                                            )
                                        )

                                        // Reset checkbox selection
                                        table.resetRowSelection()

                                        // Show toast notification
                                        toast.success(
                                            `${selected.length} item${selected.length > 1 ? "s" : ""} deleted successfully!`
                                        )
                                    } catch (err) {
                                        console.error("Failed to delete selected items:", err)
                                        toast.error("Failed to delete items. Please try again.")
                                    }
                                }}
                            >
                                Confirm Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>


                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="ml-auto">
                            Columns <ChevronDown />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((col) => col.getCanHide())
                            .map((col) => (
                                <DropdownMenuCheckboxItem
                                    key={col.id}
                                    className="capitalize"
                                    checked={col.getIsVisible()}
                                    onCheckedChange={(value) => col.toggleVisibility(!!value)}
                                >
                                    {typeof col.columnDef.header === "string"
                                        ? col.columnDef.header
                                        : col.id}
                                </DropdownMenuCheckboxItem>
                            ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
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
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between py-4">
                <div className="text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    )
}
