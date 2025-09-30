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


export interface HistoryItem {
    id: number
    date: string
    product: string
    route: string
    tradeValue: number
    tariffRate: number
    tariffCost: number
}

interface HistoryTableProps {
    data: HistoryItem[]
    onDelete: (ids: number[]) => void
}

// Columns (no actions column)
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
    { accessorKey: "date", header: "Date" },
    { accessorKey: "product", header: "Product" },
    { accessorKey: "route", header: "Route" },
    {
        accessorKey: "tradeValue",
        header: "Trade Value",
        cell: ({ row }) => (
            <div>${row.getValue<number>("tradeValue").toLocaleString()}</div>
        ),
    },
    { accessorKey: "tariffRate", header: "Tariff Rate (%)" },
    {
        accessorKey: "tariffCost",
        header: "Tariff Cost",
        cell: ({ row }) => (
            <div>${row.getValue<number>("tariffCost").toLocaleString()}</div>
        ),
    },
]

export function HistoryTable({ data, onDelete }: HistoryTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    )
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [open, setOpen] = React.useState(false);
    const [history, setHistory] = React.useState<HistoryItem[]>(data); // start with your fetched data


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
        const selectedIds = table
            .getSelectedRowModel()
            .rows.map((row) => row.original.id)
        if (selectedIds.length > 0) {
            onDelete(selectedIds)
            table.resetRowSelection()
        }
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
                                        // call DELETE API for each selected item
                                        await Promise.all(
                                            selected.map((row) =>
                                                fetch(`http://localhost:8080/api/history/${row.original.id}`, {
                                                    method: "DELETE",
                                                })
                                            )
                                        )

                                        // update frontend state to remove deleted rows
                                        setHistory((prev) =>
                                            prev.filter(
                                                (item) => !selected.some((row) => row.original.id === item.id)
                                            )
                                        )

                                        console.log("Deleted items:", selected.map((row) => row.original.id))
                                    } catch (err) {
                                        console.error("Failed to delete selected items:", err)
                                    }

                                    // close the dialog
                                    setOpen(false)
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
