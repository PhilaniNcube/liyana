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
import { getApprovedApplications } from "@/lib/queries/applications";
import { decryptValue } from "@/lib/encryption";
import Link from "next/link";
import { DollarSign, Users, Calendar, TrendingUp } from "lucide-react";

export default async function LoansPage() {
  const approvedLoans = await getApprovedApplications({ limit: 50 });

  // Calculate loan statistics
  const totalLoanAmount = approvedLoans.reduce(
    (sum, loan) => sum + (loan.application_amount || 0),
    0
  );
  const averageLoanAmount =
    approvedLoans.length > 0 ? totalLoanAmount / approvedLoans.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Loans</h1>
        <p className="text-muted-foreground">
          Manage approved loans and track loan portfolio
        </p>
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
            <div className="text-2xl font-bold">{approvedLoans.length}</div>
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
                approvedLoans.filter((loan) => {
                  const loanDate = new Date(loan.updated_at || loan.created_at);
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
          {approvedLoans.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan ID</TableHead>
                  <TableHead>Borrower</TableHead>
                  <TableHead>ID Number</TableHead>
                  <TableHead>Loan Amount</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approved Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedLoans.map((loan) => {
                  const profile = loan.profile;
                  const displayName = profile?.full_name || "Unknown User";

                  return (
                    <TableRow
                      key={loan.id}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        <Link
                          href={`/dashboard/applications/${loan.id}`}
                          className="block"
                        >
                          #{loan.id}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/applications/${loan.id}`}
                          className="block"
                        >
                          {displayName}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        <Link
                          href={`/dashboard/applications/${loan.id}`}
                          className="block"
                        >
                          {decryptValue(loan.id_number)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/applications/${loan.id}`}
                          className="block"
                        >
                          R{loan.application_amount?.toLocaleString() || "0"}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/applications/${loan.id}`}
                          className="block"
                        >
                          {loan.term || 0} months
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/applications/${loan.id}`}
                          className="block"
                        >
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-800"
                          >
                            Approved
                          </Badge>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/applications/${loan.id}`}
                          className="block"
                        >
                          {new Date(
                            loan.updated_at || loan.created_at
                          ).toLocaleDateString()}
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
                No approved loans found. Once applications are approved, they
                will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
