"use client";

import React, { useState } from "react";
import { format, subDays, addDays, subWeeks, addWeeks } from "date-fns";
import { useQueryStates, parseAsInteger, parseAsIsoDate } from "nuqs";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Loader2,
  X,
} from "lucide-react";


const queryConfig = {
  per_page: parseAsInteger.withDefault(25),
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
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const { per_page, start_date, end_date } = values;

  const handleStartDateChange = (date: Date | undefined) => {
    setValues({ start_date: date ?? null });
    setStartOpen(false);
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setValues({ end_date: date ?? null });
    setEndOpen(false);
  };

  const handleStartDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      setValues({ start_date: null });
      return;
    }
    const parsed = new Date(val + "T00:00:00");
    if (!isNaN(parsed.getTime())) {
      setValues({ start_date: parsed });
    }
  };

  const handleEndDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      setValues({ end_date: null });
      return;
    }
    const parsed = new Date(val + "T00:00:00");
    if (!isNaN(parsed.getTime())) {
      setValues({ end_date: parsed });
    }
  };

  const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextPerPage = parseInt(e.target.value, 10);
    setValues({ per_page: nextPerPage });
  };

  const handleClearDates = () => {
    setValues({ start_date: null, end_date: null });
  };

  // Shift start date earlier / later
  const shiftStartBack1Day = () => {
    const base = start_date ?? new Date();
    setValues({ start_date: subDays(base, 1) });
  };
  const shiftStartForward1Day = () => {
    const base = start_date ?? new Date();
    setValues({ start_date: addDays(base, 1) });
  };
  const shiftStartBack1Week = () => {
    const base = start_date ?? new Date();
    setValues({ start_date: subWeeks(base, 1) });
  };
  const shiftStartForward1Week = () => {
    const base = start_date ?? new Date();
    setValues({ start_date: addWeeks(base, 1) });
  };

  // Shift end date earlier / later
  const shiftEndBack1Day = () => {
    const base = end_date ?? new Date();
    setValues({ end_date: subDays(base, 1) });
  };
  const shiftEndForward1Day = () => {
    const base = end_date ?? new Date();
    setValues({ end_date: addDays(base, 1) });
  };
  const shiftEndBack1Week = () => {
    const base = end_date ?? new Date();
    setValues({ end_date: subWeeks(base, 1) });
  };
  const shiftEndForward1Week = () => {
    const base = end_date ?? new Date();
    setValues({ end_date: addWeeks(base, 1) });
  };

  const handleDownloadCSV = async () => {
    setIsDownloading(true);
    try {
      const params = new URLSearchParams();
      if (start_date) params.append("start_date", start_date.toISOString());
      if (end_date) params.append("end_date", end_date.toISOString());

      const url = `/api/declined-loans/csv?${params.toString()}`;
      window.open(url, "_blank");
    } catch (error) {
      console.error("Error downloading CSV:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between flex-wrap",
        className
      )}
    >
      {/* Start Date */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium uppercase text-muted-foreground">
          Start Date
        </Label>
        <div className="flex items-center gap-1">
  
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-900"
            onClick={shiftStartBack1Week}
            title="Back 1 week"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-900"
            onClick={shiftStartBack1Day}
            title="Back 1 day"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Typed date input */}
          <Input
            type="date"
            value={start_date ? format(start_date, "yyyy-MM-dd") : ""}
            onChange={handleStartDateInput}
            className="h-9 w-36"
          />

          {/* Calendar picker */}
          <Popover open={startOpen} onOpenChange={setStartOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                title="Open calendar"
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={start_date ?? undefined}
                onSelect={handleStartDateChange}
                defaultMonth={start_date ?? undefined}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Forward controls – emerald / green tones */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900"
            onClick={shiftStartForward1Day}
            title="Forward 1 day"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900"
            onClick={shiftStartForward1Week}
            title="Forward 1 week"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* End Date */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium uppercase text-muted-foreground">
          End Date
        </Label>
        <div className="flex items-center gap-1">
          {/* Backward controls – blue tones */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-900"
            onClick={shiftEndBack1Week}
            title="Back 1 week"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-900"
            onClick={shiftEndBack1Day}
            title="Back 1 day"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Typed date input */}
          <Input
            type="date"
            value={end_date ? format(end_date, "yyyy-MM-dd") : ""}
            onChange={handleEndDateInput}
            className="h-9 w-36"
          />

          {/* Calendar picker */}
          <Popover open={endOpen} onOpenChange={setEndOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                title="Open calendar"
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={end_date ?? undefined}
                onSelect={handleEndDateChange}
                defaultMonth={end_date ?? undefined}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Forward controls – emerald / green tones */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900"
            onClick={shiftEndForward1Day}
            title="Forward 1 day"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900"
            onClick={shiftEndForward1Week}
            title="Forward 1 week"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Clear dates */}
      {(start_date || end_date) && (
        <div className="flex items-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearDates}
            className="text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4 mr-1" />
            Clear dates
          </Button>
        </div>
      )}

      {/* Per page & export */}
      <div className="flex items-end gap-4">
        <div className="flex flex-col gap-1">
          <Label
            htmlFor="per_page"
            className="text-xs font-medium uppercase text-muted-foreground"
          >
            Per Page
          </Label>
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
