import { getDeclinedApplications } from "@/lib/queries";
import { DeclinedLoansControls } from "@/components/declined-loans-controls";
import { DeclinedLoansPagination } from "@/components/declined-loans-pagination";
import React from "react";
import Link from "next/link";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsIsoDate,
} from "nuqs/server";
import { format } from "date-fns";

// Define server-side search param parsing with nuqs
const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  per_page: parseAsInteger.withDefault(25),
  // Dates optional; we'll fallback to current month if missing.
  start_date: parseAsIsoDate, // returns Date | null
  end_date: parseAsIsoDate,
});

export default async function DeclinedLoansPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const raw = await props.searchParams;
  const {
    page,
    per_page,
    start_date: parsedStart,
    end_date: parsedEnd,
  } = searchParamsCache.parse(raw);

  // Fallbacks for dates (starting from June 1st, 2025)
  const now = new Date();
  const startOfJune2025 = new Date(2025, 5, 1); // Month is 0-indexed, so 5 = June
  const startDateObj = parsedStart ?? startOfJune2025;
  const endDateObj = parsedEnd ?? now;

  const start_date = startDateObj.toISOString();
  const end_date = endDateObj.toISOString();

  const declinedResult = await getDeclinedApplications(
    page,
    per_page,
    start_date,
    end_date
  );
  
  const declinedUsers = declinedResult.data;
  const totalPages = declinedResult.totalPages;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Declined Loans</h1>
        <p className="text-sm text-muted-foreground">
          Showing declined applications from{" "}
          {format(startDateObj, "d MMMM  yyyy")} to{" "}
          {format(endDateObj, "d MMMM  yyyy")} (page {page})
        </p>
        <DeclinedLoansControls />
      </div>
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>ID Number</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Application Date</TableHead>
              <TableHead>Credit Check</TableHead>
              <TableHead>Last Event</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {declinedUsers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-sm text-muted-foreground py-6"
                >
                  No declined applications or failed credit checks in this
                  range.
                </TableCell>
              </TableRow>
            )}
            {declinedUsers.map((item: any) => {
              const profile = item.profile;
              const app = item.application;
              const check = item.credit_check;
              const lastEvent =
                app?.created_at || check?.checked_at || profile?.created_at;
              const targetHref = app
                ? `/dashboard/applications/${app.id}`
                : profile?.id
                  ? `/dashboard/users/${profile.id}`
                  : "#";
              const linkTitle = app
                ? "View application details"
                : "View user profile";
              return (
                <TableRow
                  key={
                    (profile?.id || "") + (app?.id || "") + (check?.id || "")
                  }
                >
                  <TableCell className="max-w-[180px]">
                    <Link
                      href={targetHref}
                      title={linkTitle}
                      className="flex flex-col group focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-sm"
                      prefetch={false}
                    >
                      <span className="font-medium underline-offset-2 group-hover:underline">
                        {profile?.full_name || "Unknown"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {profile?.email || profile?.phone_number || ""}
                      </span>
                      {app && (
                        <span className="mt-0.5 text-[10px] text-muted-foreground">
                          App ID: {app.id}
                        </span>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">
                    {item.id_number || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.reason === "declined_application" ||
                      item.reason === "both" ? (
                        <Badge variant="destructive">Declined</Badge>
                      ) : null}
                      {item.reason === "failed_credit_check" ||
                      item.reason === "both" ? (
                        <Badge variant="secondary">Credit Check Failed</Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    {app?.created_at
                      ? format(new Date(app.created_at), "d MMM yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {check ? (
                      <div className="flex flex-col text-xs">
                        <span className="font-medium capitalize">
                          {check.status}
                        </span>
                        <span className="text-muted-foreground">
                          {format(new Date(check.checked_at), "d MMM yyyy")}
                        </span>
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {lastEvent
                      ? format(new Date(lastEvent), "d MMM yyyy")
                      : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Component */}
      {totalPages > 1 && (
        <DeclinedLoansPagination
          currentPage={page}
          totalPages={totalPages}
        />
      )}
    </div>
  );
}
