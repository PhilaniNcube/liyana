"use client";

import React from "react";
import { DateRange } from "react-day-picker";
import { useQueryStates, parseAsInteger, parseAsIsoDate } from "nuqs";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

// Query state configuration (must mirror server parsing keys)
const queryConfig = {
  per_page: parseAsInteger.withDefault(50),
  start_date: parseAsIsoDate, // Date | null
  end_date: parseAsIsoDate, // Date | null
};

interface DeclinedLoansControlsProps {
  className?: string;
}

export function DeclinedLoansControls({
  className,
}: DeclinedLoansControlsProps) {
  const [values, setValues] = useQueryStates(queryConfig, {
    shallow: false, // full navigation so server refetch occurs
  });
  const [isDownloading, setIsDownloading] = useState(false);

  const { per_page, start_date, end_date } = values;

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setValues({
      start_date: range?.from ?? null,
      end_date: range?.to ?? null,
    });
  };

  const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextPerPage = parseInt(e.target.value, 10);
    setValues({ per_page: nextPerPage });
  };

  const handleClearDates = () => {
    setValues({ start_date: null, end_date: null });
  };

  const handleDownloadCSV = async () => {
    setIsDownloading(true);
    try {
      // Build query parameters for the CSV download
      const params = new URLSearchParams();
      if (start_date) params.append("start_date", start_date.toISOString());
      if (end_date) params.append("end_date", end_date.toISOString());

      // Trigger download
      const url = `/api/declined-loans/csv?${params.toString()}`;
      window.open(url, "_blank");
    } catch (error) {
      console.error("Error downloading CSV:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const dateRange: DateRange | undefined =
    start_date || end_date
      ? { from: start_date ?? undefined, to: end_date ?? undefined }
      : undefined;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium uppercase text-muted-foreground">
          Date Range
        </label>
        <div className="flex items-end gap-2">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            placeholder="Select date range"
          />
          {(start_date || end_date) && (
            <Button variant="ghost" size="sm" onClick={handleClearDates}>
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-end gap-4">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="per_page"
            className="text-xs font-medium uppercase text-muted-foreground"
          >
            Per Page
          </label>
          <select
            id="per_page"
            value={per_page}
            onChange={handlePerPageChange}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCSV}
            disabled={isDownloading}
            className="ml-2"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
