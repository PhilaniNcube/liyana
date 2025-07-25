"use client";

import { Suspense } from "react";
import { parseAsIsoDate, useQueryStates } from "nuqs";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { DollarSign, Users, Calendar, TrendingUp } from "lucide-react";
import type { ApprovedLoanWithDetails } from "@/lib/queries/approved_loans";

interface LoansPageClientProps {
  initialLoans: ApprovedLoanWithDetails[];
}

export function LoansPageClient({ initialLoans }: LoansPageClientProps) {
  const [{ fromDate, toDate }, setDateParams] = useQueryStates({
    fromDate: parseAsIsoDate,
    toDate: parseAsIsoDate,
  });

  // Since we're doing server-side filtering, we use initialLoans directly
  const filteredLoans = initialLoans;

  // Calculate loan statistics for filtered data
  const totalLoanAmount = filteredLoans.reduce(
    (sum, loan) => sum + (loan.total_repayment_amount || 0),
    0
  );
  const averageLoanAmount =
    filteredLoans.length > 0 ? totalLoanAmount / filteredLoans.length : 0;

  const handleDateRangeChange = (dateRange: DateRange | undefined) => {
    setDateParams({
      fromDate: dateRange?.from || null,
      toDate: dateRange?.to || null,
    });
  };

  const dateRange: DateRange | undefined =
    fromDate || toDate
      ? { from: fromDate || undefined, to: toDate || undefined }
      : undefined;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Loans</h1>
          <p className="text-muted-foreground">
            Manage approved loans and track loan portfolio
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center space-x-2">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            placeholder="Filter by approval date"
            className="w-auto"
          />
        </div>
      </div>

      {/* Loan Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Active Loans
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredLoans.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Portfolio Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R{totalLoanAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Loan Amount
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R{Math.round(averageLoanAmount).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                filteredLoans.filter((loan) => {
                  const loanDate = new Date(
                    loan.approved_date || loan.created_at || ""
                  );
                  const now = new Date();
                  return (
                    loanDate.getMonth() === now.getMonth() &&
                    loanDate.getFullYear() === now.getFullYear()
                  );
                }).length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Loans</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLoans.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan ID</TableHead>
                  <TableHead>Borrower</TableHead>
                  <TableHead>ID Number</TableHead>
                  <TableHead>Loan Amount</TableHead>
                  <TableHead>Monthly Payment</TableHead>
                  <TableHead>Term (Days)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approved Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLoans.map((loan) => {
                  const profile = loan.profile;
                  const application = loan.application;
                  const displayName = profile?.full_name || "Unknown User";

                  return (
                    <TableRow
                      key={loan.id}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        <Link
                          href={`/dashboard/applications/${loan.application_id}`}
                          className="block"
                        >
                          #{loan.id}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/applications/${loan.application_id}`}
                          className="block"
                        >
                          {displayName}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        <Link
                          href={`/dashboard/applications/${loan.application_id}`}
                          className="block"
                        >
                          {application?.id_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/applications/${loan.application_id}`}
                          className="block"
                        >
                          R
                          {loan.total_repayment_amount?.toLocaleString() || "0"}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/applications/${loan.application_id}`}
                          className="block"
                        >
                          R{loan.monthly_payment?.toLocaleString() || "0"}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/applications/${loan.application_id}`}
                          className="block"
                        >
                          {loan.loan_term_days || 0} days
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/applications/${loan.application_id}`}
                          className="block"
                        >
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-800"
                          >
                            {loan.status || "Active"}
                          </Badge>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/applications/${loan.application_id}`}
                          className="block"
                        >
                          {loan.approved_date
                            ? new Date(loan.approved_date).toLocaleDateString()
                            : loan.created_at
                              ? new Date(loan.created_at).toLocaleDateString()
                              : "N/A"}
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {fromDate || toDate
                  ? "No loans found in the selected date range."
                  : "No approved loans found. Once applications are approved, they will appear here."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
