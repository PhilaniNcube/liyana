"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  User,
  Building,
  CreditCard,
  Phone,
  Mail,
  Shield,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

interface Application {
  id: number;
  user_id: string;
  id_number: string;
  id_number_decrypted: string;
  created_at: string;
  updated_at: string;
  status: string;
  date_of_birth: string | null;
  gender: string | null;
  gender_other: string | null;
  marital_status: string | null;
  nationality: string | null;
  language: string | null;
  dependants: number | null;
  home_address: string | null;
  city: string | null;
  postal_code: string | null;
  phone_number: string | null;
  next_of_kin_name: string | null;
  next_of_kin_phone_number: string | null;
  next_of_kin_email: string | null;
  employment_type: string | null;
  monthly_income: number | null;
  job_title: string | null;
  work_experience: string | null;
  employer_name: string | null;
  employer_address: string | null;
  employer_contact_number: string | null;
  employment_end_date: string | null;
  application_amount: number | null;
  term: number;
  loan_purpose: string | null;
  loan_purpose_reason: string | null;
  bank_name: string | null;
  bank_account_type: string | null;
  bank_account_holder: string | null;
  branch_code: string | null;
  bank_account_number: string | null;
  affordability: any;
  decline_reason: any;
  profile?: {
    full_name: string;
  } | null;
}

interface ApplicationDetailClientProps {
  application: Application;
}

export function ApplicationDetailClient({
  application,
}: ApplicationDetailClientProps) {
  const [isRunningFraudCheck, setIsRunningFraudCheck] = useState(false);
  const [fraudCheckResults, setFraudCheckResults] = useState<any>(null);

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  };

  const formatAffordabilityIncomeStatement = (affordability: any) => {
    if (!affordability) return null;

    // Handle the structured format (income/deductions/expenses arrays)
    if (
      affordability.income ||
      affordability.deductions ||
      affordability.expenses
    ) {
      const totalIncome =
        affordability.income?.reduce(
          (sum: number, item: any) => sum + (item.amount || 0),
          0
        ) || 0;
      const totalDeductions =
        affordability.deductions?.reduce(
          (sum: number, item: any) => sum + (item.amount || 0),
          0
        ) || 0;
      const totalExpenses =
        affordability.expenses?.reduce(
          (sum: number, item: any) => sum + (item.amount || 0),
          0
        ) || 0;
      const netIncome = totalIncome - totalDeductions;
      const disposableIncome = netIncome - totalExpenses;

      return {
        structured: true,
        income: affordability.income || [],
        deductions: affordability.deductions || [],
        expenses: affordability.expenses || [],
        totalIncome,
        totalDeductions,
        totalExpenses,
        netIncome,
        disposableIncome,
      };
    }

    // Fallback for any other format - treat as raw data
    return {
      structured: false,
      rawData: affordability,
    };
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "declined":
        return "bg-red-100 text-red-800";
      case "in_review":
        return "bg-yellow-100 text-yellow-800";
      case "pending_documents":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDateForAPI = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0].replace(/-/g, "");
  };

  const handleFraudCheck = async () => {
    setIsRunningFraudCheck(true);
    try {
      const requestBody = {
        idNumber: application.id_number_decrypted,
        forename: application.profile?.full_name?.split(" ")[0] || "",
        surname:
          application.profile?.full_name?.split(" ").slice(1).join(" ") || "",
        gender:
          application.gender === "male"
            ? "M"
            : application.gender === "female"
              ? "F"
              : "",
        dateOfBirth: formatDateForAPI(application.date_of_birth),
        address1: application.home_address?.split(",")[0] || "",
        address2: application.home_address?.split(",")[1] || "",
        address3: application.home_address?.split(",")[2] || "",
        address4: application.city || "",
        postalCode: application.postal_code || "",
        homeTelCode: application.phone_number?.startsWith("0")
          ? application.phone_number.substring(1, 3)
          : "",
        homeTelNo: application.phone_number?.startsWith("0")
          ? application.phone_number.substring(3)
          : application.phone_number || "",
        workTelNo: application.employer_contact_number || "",
        cellTelNo: application.phone_number || "",
        workTelCode: application.employer_contact_number?.startsWith("0")
          ? application.employer_contact_number.substring(1, 3)
          : "",
      };

      const response = await fetch("/api/kyc/fraud-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to run fraud check");
      }

      const data = await response.json();
      setFraudCheckResults(data);
      toast.success("Fraud check completed successfully");
    } catch (error) {
      console.error("Fraud check error:", error);
      toast.error("Failed to run fraud check");
    } finally {
      setIsRunningFraudCheck(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/applications">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              Application #{application.id}
            </h1>
            <p className="text-muted-foreground">
              {application.profile?.full_name && (
                <span className="font-medium">
                  {application.profile.full_name} •{" "}
                </span>
              )}
              Created on {formatDate(application.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleFraudCheck}
            disabled={isRunningFraudCheck}
            variant="outline"
            size="sm"
          >
            {isRunningFraudCheck ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Fraud Check...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Run Fraud Check
              </>
            )}
          </Button>
          <Badge className={getStatusColor(application.status)}>
            {application.status.replace("_", " ").toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Fraud Check Results */}
      {fraudCheckResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Fraud Check Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-50 p-4 rounded overflow-x-auto">
              {JSON.stringify(fraudCheckResults, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {application.profile && (
              <>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    Applicant Name
                  </p>
                  <p className="text-lg font-semibold text-blue-800">
                    {application.profile.full_name || "Name not provided"}
                  </p>
                </div>
                <Separator />
              </>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  ID Number
                </p>
                <p className="text-sm">
                  {application.id_number_decrypted || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Date of Birth
                </p>
                <p className="text-sm">
                  {formatDate(application.date_of_birth)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Gender
                </p>
                <p className="text-sm">
                  {application.gender || application.gender_other || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Marital Status
                </p>
                <p className="text-sm">{application.marital_status || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Nationality
                </p>
                <p className="text-sm">{application.nationality || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Language
                </p>
                <p className="text-sm">{application.language || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Dependants
                </p>
                <p className="text-sm">{application.dependants || "N/A"}</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Home Address
              </p>
              <p className="text-sm">{application.home_address || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">City</p>
              <p className="text-sm">{application.city || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Postal Code
              </p>
              <p className="text-sm">{application.postal_code || "N/A"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="h-5 w-5 mr-2" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Phone Number
              </p>
              <p className="text-sm">{application.phone_number || "N/A"}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Next of Kin
              </p>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Name
                  </p>
                  <p className="text-sm capitalize">
                    {application.next_of_kin_name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Phone
                  </p>
                  <p className="text-sm">
                    {application.next_of_kin_phone_number || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Email
                  </p>
                  <p className="text-sm">
                    {application.next_of_kin_email || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Employment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Employment Type
                </p>
                <p className="text-sm">
                  {application.employment_type || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Monthly Income
                </p>
                <p className="text-sm">
                  {formatCurrency(application.monthly_income)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Job Title
                </p>
                <p className="text-sm">{application.job_title || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Work Experience
                </p>
                <p className="text-sm">
                  {application.work_experience || "N/A"}
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Employer Name
              </p>
              <p className="text-sm">{application.employer_name || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Employer Address
              </p>
              <p className="text-sm">{application.employer_address || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Employer Contact
              </p>
              <p className="text-sm">
                {application.employer_contact_number || "N/A"}
              </p>
            </div>
            {application.employment_end_date && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Employment End Date
                </p>
                <p className="text-sm">
                  {formatDate(application.employment_end_date)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loan & Banking Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Loan & Banking Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Loan Amount
                </p>
                <p className="text-sm font-semibold">
                  {formatCurrency(application.application_amount)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Loan Term
                </p>
                <p className="text-sm">{application.term} days</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Loan Purpose
              </p>
              <p className="text-sm">{application.loan_purpose || "N/A"}</p>
            </div>
            {application.loan_purpose_reason && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Loan Purpose Reason
                </p>
                <p className="text-sm">{application.loan_purpose_reason}</p>
              </div>
            )}
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Bank Name
                </p>
                <p className="text-sm">{application.bank_name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Account Type
                </p>
                <p className="text-sm">
                  {application.bank_account_type || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Account Holder
                </p>
                <p className="text-sm">
                  {application.bank_account_holder || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Branch Code
                </p>
                <p className="text-sm">{application.branch_code || "N/A"}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Account Number
              </p>
              <p className="text-sm">
                {application.bank_account_number || "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      {(application.affordability || application.decline_reason) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {application.affordability && (
              <div>
                <h4 className="font-semibold mb-4">Affordability Assessment</h4>
                {(() => {
                  const incomeStatement = formatAffordabilityIncomeStatement(
                    application.affordability
                  );
                  if (!incomeStatement) {
                    return (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">
                          No affordability data available for this application.
                        </p>
                      </div>
                    );
                  }

                  // Render structured format (like in profile page)
                  if (incomeStatement.structured) {
                    return (
                      <Card className="bg-muted/50">
                        <CardHeader>
                          <CardTitle className="text-lg">
                            Financial Summary
                          </CardTitle>
                          <CardDescription>
                            Monthly income sources, deductions, and expenses as
                            provided
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Income Section */}
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h5 className="font-semibold text-green-600">
                                Income Sources
                              </h5>
                            </div>
                            <div className="space-y-3">
                              {incomeStatement.income &&
                              incomeStatement.income.length > 0 ? (
                                incomeStatement.income
                                  .filter(
                                    (item: any) =>
                                      item.amount > 0 || item.type.trim() !== ""
                                  )
                                  .map((item: any, index: number) => (
                                    <div
                                      key={index}
                                      className="flex justify-between items-center py-2 border-b border-muted"
                                    >
                                      <span className="text-sm">
                                        {item.type || "Unnamed Income"}
                                      </span>
                                      <span className="font-medium text-green-600">
                                        {formatCurrency(item.amount || 0)
                                          ?.replace("ZAR", "")
                                          .trim()}
                                      </span>
                                    </div>
                                  ))
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  No income sources recorded
                                </p>
                              )}
                              <div className="flex justify-between border-t pt-3 mt-3">
                                <span className="font-semibold">
                                  Total Income:
                                </span>
                                <span className="font-semibold text-green-600">
                                  {formatCurrency(incomeStatement.totalIncome)
                                    ?.replace("ZAR", "")
                                    .trim()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Deductions Section */}
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h5 className="font-semibold text-orange-600">
                                Deductions
                              </h5>
                            </div>
                            <div className="space-y-3">
                              {incomeStatement.deductions &&
                              incomeStatement.deductions.length > 0 ? (
                                incomeStatement.deductions
                                  .filter(
                                    (item: any) =>
                                      item.amount > 0 || item.type.trim() !== ""
                                  )
                                  .map((item: any, index: number) => (
                                    <div
                                      key={index}
                                      className="flex justify-between items-center py-2 border-b border-muted"
                                    >
                                      <span className="text-sm">
                                        {item.type || "Unnamed Deduction"}
                                      </span>
                                      <span className="font-medium text-orange-600">
                                        {formatCurrency(item.amount || 0)
                                          ?.replace("ZAR", "")
                                          .trim()}
                                      </span>
                                    </div>
                                  ))
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  No deductions recorded
                                </p>
                              )}
                              <div className="flex justify-between border-t pt-3 mt-3">
                                <span className="font-semibold">
                                  Total Deductions:
                                </span>
                                <span className="font-semibold text-orange-600">
                                  {formatCurrency(
                                    incomeStatement.totalDeductions
                                  )
                                    ?.replace("ZAR", "")
                                    .trim()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Expenses Section */}
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h5 className="font-semibold text-red-600">
                                Monthly Expenses
                              </h5>
                            </div>
                            <div className="space-y-3">
                              {incomeStatement.expenses &&
                              incomeStatement.expenses.length > 0 ? (
                                incomeStatement.expenses
                                  .filter(
                                    (item: any) =>
                                      item.amount > 0 || item.type.trim() !== ""
                                  )
                                  .map((item: any, index: number) => (
                                    <div
                                      key={index}
                                      className="flex justify-between items-center py-2 border-b border-muted"
                                    >
                                      <span className="text-sm">
                                        {item.type || "Unnamed Expense"}
                                      </span>
                                      <span className="font-medium text-red-600">
                                        {formatCurrency(item.amount || 0)
                                          ?.replace("ZAR", "")
                                          .trim()}
                                      </span>
                                    </div>
                                  ))
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  No expenses recorded
                                </p>
                              )}
                              <div className="flex justify-between border-t pt-3 mt-3">
                                <span className="font-semibold">
                                  Total Expenses:
                                </span>
                                <span className="font-semibold text-red-600">
                                  {formatCurrency(incomeStatement.totalExpenses)
                                    ?.replace("ZAR", "")
                                    .trim()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Summary */}
                          <div className="bg-background rounded-lg p-4 space-y-2 border">
                            <h5 className="font-semibold text-lg mb-3">
                              Financial Summary
                            </h5>
                            <div className="flex justify-between">
                              <span>Total Income:</span>
                              <span className="font-semibold text-green-600">
                                {formatCurrency(incomeStatement.totalIncome)
                                  ?.replace("ZAR", "")
                                  .trim()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Deductions:</span>
                              <span className="font-semibold text-orange-600">
                                {formatCurrency(incomeStatement.totalDeductions)
                                  ?.replace("ZAR", "")
                                  .trim()}
                              </span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                              <span>Net Income:</span>
                              <span className="font-semibold">
                                {formatCurrency(incomeStatement.netIncome || 0)
                                  ?.replace("ZAR", "")
                                  .trim()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Expenses:</span>
                              <span className="font-semibold text-red-600">
                                {formatCurrency(incomeStatement.totalExpenses)
                                  ?.replace("ZAR", "")
                                  .trim()}
                              </span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                              <span className="font-semibold">
                                Disposable Income:
                              </span>
                              <span
                                className={`font-bold text-lg ${
                                  (incomeStatement.disposableIncome || 0) >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {formatCurrency(
                                  incomeStatement.disposableIncome || 0
                                )
                                  ?.replace("ZAR", "")
                                  .trim()}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  // Render flat format (fallback)
                  return (
                    <div className="space-y-4">
                      {/* Raw Data */}
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-semibold text-muted-foreground mb-2">
                          Raw Affordability Data
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          This affordability data is in an unexpected format.
                        </p>
                        <details className="text-sm">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            View Raw Data
                          </summary>
                          <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto mt-2">
                            {JSON.stringify(application.affordability, null, 2)}
                          </pre>
                        </details>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            {application.decline_reason && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Decline Reason
                </p>
                <pre className="text-sm bg-red-50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(application.decline_reason, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Application Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Created</span>
              <span className="text-sm text-muted-foreground">
                {formatDate(application.created_at)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Last Updated</span>
              <span className="text-sm text-muted-foreground">
                {formatDate(application.updated_at)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
