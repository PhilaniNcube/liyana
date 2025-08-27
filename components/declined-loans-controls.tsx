"use client";

import React from "react";
import { DateRange } from "react-day-picker";
import { useQueryStates, parseAsInteger, parseAsIsoDate } from "nuqs";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Query state configuration (must mirror server parsing keys)
const queryConfig = {
  page: parseAsInteger.withDefault(1),
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

  const { page, per_page, start_date, end_date } = values;

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setValues({
      start_date: range?.from ?? null,
      end_date: range?.to ?? null,
      page: 1, // reset page when date changes
    });
  };

  const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextPerPage = parseInt(e.target.value, 10);
    setValues({ per_page: nextPerPage, page: 1 });
  };

  const handleClearDates = () => {
    setValues({ start_date: null, end_date: null, page: 1 });
  };

  const handleNextPage = () => setValues({ page: (page || 1) + 1 });
  const handlePrevPage = () =>
    setValues({ page: Math.max(1, (page || 1) - 1) });

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

        <div className="flex items-end gap-2 pt-5 md:pt-0">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={handlePrevPage}
          >
            Prev
          </Button>
          <span className="text-sm tabular-nums min-w-[3ch] text-center">
            {page}
          </span>
          <Button variant="outline" size="sm" onClick={handleNextPage}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
