"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle,
  Clock,
  CreditCard,
  Plus,
  ArrowRight,
  DollarSign,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/lib/types";

interface MyLoansClientProps {
  loans: Database["public"]["Tables"]["approved_loans"]["Row"][];
  userId: string;
}

// Helper function to get loan status color
const getLoanStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200";
    case "paid":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "overdue":
      return "bg-red-100 text-red-800 border-red-200";
    case "defaulted":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getLoanStatusIcon = (status: string) => {
  switch (status) {
    case "active":
      return <CheckCircle className="h-4 w-4" />;
    case "paid":
      return <CheckCircle className="h-4 w-4" />;
    case "overdue":
      return <Clock className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

export function MyLoansClient({ loans, userId }: MyLoansClientProps) {
  const hasLoans = loans && loans.length > 0;
  const activeLoans = loans?.filter((loan) => loan.status === "active") || [];
  const paidLoans = loans?.filter((loan) => loan.status === "paid") || [];
  const overdueLoans = loans?.filter((loan) => loan.status === "overdue") || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Loans</h1>
          <p className="text-muted-foreground mt-1">
            Manage your loan applications and track payments
          </p>
        </div>
        <Button asChild>
          <Link href="/apply">
            <Plus className="h-4 w-4 mr-2" />
            Apply for New Loan
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loans?.length || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeLoans.length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Loans</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {paidLoans.length}
            </div>
            <p className="text-xs text-muted-foreground">Successfully repaid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Loans</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overdueLoans.length}
            </div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Loans List */}
      {hasLoans ? (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Loan History</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loans.map((loan) => (
              <Card
                key={loan.id}
                className="hover:shadow-lg transition-all duration-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Loan #{loan.id}</CardTitle>
                    <Badge
                      variant="secondary"
                      className={getLoanStatusColor(loan.status)}
                    >
                      {getLoanStatusIcon(loan.status)}
                      {loan.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Loan Amount
                      </span>
                      <span className="font-semibold text-lg">
                        R{loan.approved_loan_amount?.toLocaleString() || "0"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Monthly Payment
                      </span>
                      <span className="font-medium">
                        R{loan.monthly_payment?.toLocaleString() || "0"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Term
                      </span>
                      <span className="font-medium">
                        {loan.loan_term_days} days
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Interest Rate
                      </span>
                      <span className="font-medium">{loan.interest_rate}%</span>
                    </div>
                    {loan.next_payment_date && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Next Payment
                        </span>
                        <span className="font-medium text-sm">
                          {new Date(
                            loan.next_payment_date
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  <Button asChild className="w-full" variant="outline">
                    <Link href={`/profile/${loan.id}`}>
                      View Details
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Loans Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              You haven't applied for any loans yet. Start your loan application
              today.
            </p>
            <Button asChild>
              <Link href="/apply">
                <Plus className="h-4 w-4 mr-2" />
                Apply for a Loan
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
