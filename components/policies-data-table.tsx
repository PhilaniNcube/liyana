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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { exportDataToCSV } from "@/lib/actions/csv-export";

type PoliciesDataTableProps = {
  data: PolicyWithHolder[];
  className?: string;
  exportFilters?: {
    productType?: "funeral_policy" | "life_insurance" | "payday_loan";
    status?: "pending" | "active" | "lapsed" | "cancelled";
  };
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
  if (!value) return "";
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

export function PoliciesDataTable({
  data,
  className,
  exportFilters,
}: PoliciesDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [isExporting, setIsExporting] = React.useState(false);

  const router = useRouter();

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      // Generate filename
      const timestamp = new Date().toISOString().split("T")[0];
      const filterSuffix = exportFilters?.status
        ? `_${exportFilters.status}`
        : "";
      const productSuffix = exportFilters?.productType
        ? `_${exportFilters.productType}`
        : "";
      const filename = `policies${productSuffix}${filterSuffix}_${timestamp}.csv`;

      // Process data to match what's displayed in the table
      const processedData = data.map((policy) => {
        const holder = policy.policy_holder;
        const holderName =
          holder?.organization_name ||
          [holder?.first_name, holder?.last_name].filter(Boolean).join(" ") ||
          "";

        return {
          ID: policy.id,
          "Policy Holder": holderName,
          Status: policy.policy_status?.toUpperCase() || "",
          Frequency: policy.frequency
            ? policy.frequency.charAt(0).toUpperCase() +
              policy.frequency.slice(1)
            : "",
          Premium: policy.premium_amount || 0,
          "Start Date": formatDate(policy.start_date),
          "End Date": formatDate(policy.end_date),
          "Product Type": policy.product_type || "",
          "Created Date": formatDate(policy.created_at),
          // Policy holder details (available fields only)
          "Holder First Name": holder?.first_name || "",
          "Holder Last Name": holder?.last_name || "",
          "Holder Organization": holder?.organization_name || "",
          "Holder ID Number": holder?.id_number || "",
        };
      });

      const result = await exportDataToCSV({
        data: processedData,
        filename: filename,
      });

      if (!result.success) {
        toast.error("Failed to export CSV", {
          description:
            result.error || "An error occurred while exporting the data.",
        });
        return;
      }

      if (!result.data || !result.filename) {
        toast.error("Export failed", {
          description: "No data was returned from the export.",
        });
        return;
      }

      // Create blob and download
      const blob = new Blob([result.data], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", result.filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success("CSV exported successfully", {
          description: `Downloaded ${result.filename}`,
        });
      }
    } catch (error) {
      toast.error("Export failed", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsExporting(false);
    }
  };

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
        <Button
          onClick={exportToCSV}
          disabled={isExporting}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {isExporting ? "Exporting..." : "Export CSV"}
        </Button>
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
                  onClick={() =>
                    router.push(`/dashboard/insurance/${row.original.id}`)
                  }
                  className="cursor-pointer hover:bg-gray-100"
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
