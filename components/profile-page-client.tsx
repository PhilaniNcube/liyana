"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  FileText,
  Plus,
  ArrowRight,
  Settings,
  Shield,
  CreditCard,
  CoinsIcon,
  PlusIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResetPasswordComponent } from "@/components/reset-password-component";
import type { Database } from "@/lib/types";

interface ProfilePageClientProps {
  applications: Database["public"]["Tables"]["applications"]["Row"][] | null;
  loans: Database["public"]["Tables"]["approved_loans"]["Row"][] | null;
  policies: any[] | null; // Using any for now as the type is complex with joins
  userEmail?: string;
  userFullName?: string;
}

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800 border-green-200";
    case "declined":
      return "bg-red-100 text-red-800 border-red-200";
    case "in_review":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "pending_documents":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "pre_qualifier":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

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

// Helper function to get policy status color
const getPolicyStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200";
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    case "expired":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};
const getStatusIcon = (status: string) => {
  switch (status) {
    case "approved":
      return <CheckCircle className="h-4 w-4" />;
    case "in_review":
      return <Clock className="h-4 w-4" />;
    case "declined":
    case "pending_documents":
      return <FileText className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

export function ProfilePageClient({
  applications,
  loans,
  policies,
  userEmail,
  userFullName,
}: ProfilePageClientProps) {
  const router = useRouter();
  const hasApplications = applications && applications.length > 0;
  const hasLoans = loans && loans.length > 0;
  const hasPolicies = policies && policies.length > 0;
  const hasAnyData = hasApplications || hasLoans || hasPolicies;

  console.log({ applications, loans, policies });

  const handleApplicationClick = (applicationId: number) => {
    router.push(`/profile/${applicationId}`);
  };

  return (
    <div className="space-y-8">
      {hasAnyData ? (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                View and manage your applications, loans, and policies
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild className="bg-black text-white">
                <Link href="/insurance/funeral">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Funeral Cover
                </Link>
              </Button>
              <Button asChild>
                <Link href="/apply">
                  <Plus className="h-4 w-4 mr-2" />
                  New Loan Application
                </Link>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="applications" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="loans" className="flex items-center gap-2">
                <div className="font-mono"> R</div>
                Loans ({loans?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="policies" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Funeral Cover ({policies?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="loans" className="mt-6">
              {hasLoans ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {loans.map((loan, index) => (
                    <Card
                      key={loan.id}
                      className="hover:shadow-lg transition-all duration-200"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            Loan #{loan.id}
                          </CardTitle>
                          <Badge
                            variant="secondary"
                            className={getLoanStatusColor(loan.status)}
                          >
                            <div className="font-mono text-3xl"> R</div>
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
                              R
                              {loan.approved_loan_amount?.toLocaleString() ||
                                "0"}
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
                            <span className="font-medium">
                              {loan.interest_rate}%
                            </span>
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="font-mono text-3xl">R</div>
                    <h3 className="text-lg font-semibold mb-2">
                      No Active Loans
                    </h3>
                    <p className="text-muted-foreground text-center mb-4">
                      You don't have any approved loans at the moment.
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
            </TabsContent>

            <TabsContent value="policies" className="mt-6">
              {hasPolicies ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {policies.map((policy, index) => (
                    <Link
                      href={`/profile/policies/${policy.id}`}
                      key={policy.id}
                    >
                      <Card
                        key={policy.id}
                        className="hover:shadow-lg transition-all duration-200"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              Policy #{policy.id}
                            </CardTitle>
                          </div>
                          {policy.product_type && (
                            <div className="text-sm text-muted-foreground capitalize">
                              {policy.product_type.replace("_", " ")}
                            </div>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">
                                Coverage Amount
                              </span>
                              <span className="font-semibold text-lg">
                                R
                                {policy.coverage_amount?.toLocaleString() ||
                                  "0"}
                              </span>
                            </div>
                            {policy.premium_amount && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                  Premium
                                </span>
                                <span className="font-medium">
                                  R
                                  {policy.premium_amount?.toLocaleString() ||
                                    "0"}
                                </span>
                              </div>
                            )}

                            {policy.start_date && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                  Start Date
                                </span>
                                <span className="font-medium text-sm">
                                  {new Date(
                                    policy.start_date
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                            {policy.end_date && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                  End Date
                                </span>
                                <span className="font-medium text-sm">
                                  {new Date(
                                    policy.end_date
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No Insurance Policies
                    </h3>
                    <p className="text-muted-foreground text-center mb-4">
                      You don't have any insurance policies yet.
                    </p>
                    <Button asChild className="bg-black text-white">
                      <Link href="/insurance/funeral">
                        <Plus className="h-4 w-4 mr-2" />
                        New Funeral Cover
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </section>
      ) : (
        // Show welcome message for new users
        <section className="space-y-8">
          <div className="text-center space-y-6 py-12">
            <div className="max-w-md mx-auto">
              <h1 className="text-3xl font-bold mb-4">Welcome to Liyana</h1>
              <p className="text-muted-foreground">
                You haven't submitted any loan applications yet. Get started by
                applying for a payday cash loan. The process is quick and easy.
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button asChild size="lg" className="flex items-center gap-2">
                <Link href="/apply">
                  <Plus className="h-4 w-4" />
                  Apply for a Loan
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="flex items-center gap-2 bg-black text-white"
              >
                <Link href="/insurance/funeral">
                  <Plus className="h-4 w-4" />
                  New Funeral Cover
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Account Settings Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your account preferences and security settings
              </CardDescription>
            </div>
            <ResetPasswordComponent userEmail={userEmail} className="ml-auto" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Full Name</p>
              <p className="text-sm text-muted-foreground">
                {userFullName || "Not provided"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Email Address</p>
              <p className="text-sm text-muted-foreground">
                {userEmail || "Not provided"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Password</p>
              <p className="text-sm text-muted-foreground">••••••••••••</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
