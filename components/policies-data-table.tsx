"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

import type { PolicyWithHolder } from "@/lib/queries/policies";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PoliciesDataTableProps = {
  data: PolicyWithHolder[];
  className?: string;
};

function formatCurrency(value: number | null | undefined, currency = "ZAR") {
  if (value == null) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return value.toFixed(2);
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

const columns: ColumnDef<PolicyWithHolder>[] = [
  {
    accessorKey: "id",
    header: () => <span>ID</span>,
    cell: ({ getValue }) => (
      <span className="tabular-nums">{getValue<number>()}</span>
    ),
    enableSorting: true,
    size: 80,
  },
  {
    id: "holder",
    header: () => <span>Policy holder</span>,
    cell: ({ row }) => {
      const holder = row.original.policy_holder;
      const name =
        holder?.organization_name ||
        [holder?.first_name, holder?.last_name].filter(Boolean).join(" ");
      return <span>{name || "—"}</span>;
    },
    sortingFn: (a, b) => {
      const an = (
        a.original.policy_holder?.organization_name ||
        `${a.original.policy_holder?.first_name ?? ""} ${a.original.policy_holder?.last_name ?? ""}`
      )
        .trim()
        .toLowerCase();
      const bn = (
        b.original.policy_holder?.organization_name ||
        `${b.original.policy_holder?.first_name ?? ""} ${b.original.policy_holder?.last_name ?? ""}`
      )
        .trim()
        .toLowerCase();
      return an.localeCompare(bn);
    },
    enableSorting: true,
  },
  {
    accessorKey: "policy_status",
    header: () => <span>Status</span>,
    cell: ({ getValue }) => (
      <span className="uppercase text-xs font-medium">
        {String(getValue())}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "frequency",
    header: () => <span>Frequency</span>,
    cell: ({ getValue }) => (
      <span className="capitalize">{String(getValue())}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "premium_amount",
    header: () => <span>Premium</span>,
    cell: ({ getValue }) => (
      <span>{formatCurrency(getValue<number | null>())}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "start_date",
    header: () => <span>Start</span>,
    cell: ({ getValue }) => (
      <span>{formatDate(getValue<string | null>())}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "end_date",
    header: () => <span>End</span>,
    cell: ({ getValue }) => (
      <span>{formatDate(getValue<string | null>())}</span>
    ),
    enableSorting: true,
  },
];

export function PoliciesDataTable({ data, className }: PoliciesDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      if (!filterValue) return true;
      const search = String(filterValue).toLowerCase();
      const holder = row.original.policy_holder;
      const name =
        holder?.organization_name ||
        `${holder?.first_name ?? ""} ${holder?.last_name ?? ""}`;
      return (
        `${row.original.id}`.includes(search) ||
        row.original.policy_status.toLowerCase().includes(search) ||
        row.original.frequency.toLowerCase().includes(search) ||
        (name?.toLowerCase().includes(search) ?? false)
      );
    },
  });

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="Search policies..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-60"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          className={cn(
                            "inline-flex items-center gap-1",
                            canSort ? "select-none" : "cursor-default"
                          )}
                          onClick={
                            canSort
                              ? header.column.getToggleSortingHandler()
                              : undefined
                          }
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {sorted === "asc" && <span aria-hidden>↑</span>}
                          {sorted === "desc" && <span aria-hidden>↓</span>}
                        </button>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  className="h-24 text-center"
                >
                  No policies found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default PoliciesDataTable;
