import React from "react";
import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsIsoDate,
} from "nuqs/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { getCreditPassedPreApplications } from "@/lib/queries";

const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  per_page: parseAsInteger.withDefault(50),
  start_date: parseAsIsoDate,
  end_date: parseAsIsoDate,
});

export default async function IncompleteLoansPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const raw = await props.searchParams;
  const {
    page,
    per_page,
    start_date: parsedStart,
    end_date: parsedEnd,
  } = searchParamsCache.parse(raw);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 2);
  const startDateObj = parsedStart ?? startOfMonth;
  const endDateObj = parsedEnd ?? now;
  const start_date = startDateObj.toISOString();
  const end_date = endDateObj.toISOString();

  const rows = await getCreditPassedPreApplications(
    page,
    per_page,
    start_date,
    end_date
  );

  console.log("Incomplete applications:", rows);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Incomplete Applications</h1>
        <p className="text-sm text-muted-foreground">
          Users who passed credit check but haven't completed their application
          from {startDateObj.toLocaleDateString()} to{" "}
          {endDateObj.toLocaleDateString()} (page {page})
        </p>
      </div>
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>ID Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Latest Application</TableHead>
              <TableHead>Credit Check</TableHead>
              <TableHead>Last Event</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-sm text-muted-foreground py-6"
                >
                  No incomplete applications in this range.
                </TableCell>
              </TableRow>
            )}
            {rows.map((item: any) => {
              const profile = item.profile;
              const app = item.application;
              const check = item.credit_check;
              const lastEvent =
                app?.created_at ||
                check?.checked_at ||
                profile?.created_at ||
                item.created_at;
              const targetHref = app
                ? `/dashboard/applications/${app.id}`
                : `/dashboard/users/${profile?.id}`;
              return (
                <TableRow
                  key={`pre-app-${item.id}-${profile?.id || ""}-${app?.id || ""}`}
                >
                  <TableCell className="max-w-[200px]">
                    <Link
                      href={targetHref}
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
                      <span className="mt-0.5 text-[10px] text-muted-foreground">
                        Pre-App ID: {item.id}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">
                    {item.id_number || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        Credit Passed
                      </Badge>
                      {item.reason === "no_application" && (
                        <Badge variant="secondary">No Application</Badge>
                      )}
                      {item.reason === "application_started" && (
                        <Badge variant="outline">Application Started</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {app?.created_at
                      ? new Date(app.created_at).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {check ? (
                      <div className="flex flex-col text-xs">
                        <span className="font-medium capitalize">
                          {check.status}
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(check.checked_at).toLocaleDateString()}
                        </span>
                        {item.credit_score && (
                          <span className="text-muted-foreground">
                            Score: {item.credit_score}
                          </span>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {lastEvent ? new Date(lastEvent).toLocaleDateString() : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
