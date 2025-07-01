import { getApplicationDocuments } from "@/lib/queries/documents";
import { getApplicationById } from "@/lib/queries/applications";
import { DocumentUploadForm } from "@/components/document-upload-form";
import { AffordabilityView } from "@/components/affordability-view";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  User,
  Briefcase,
  Calculator,
  FileText,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/server";
import { cn } from "@/lib/utils";

interface ApplicationPageProps {
  params: Promise<{ loan_id: string }>;
}

// Helper function to format currency consistently
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-ZA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Step configuration matching the apply page
const STEPS = [
  {
    id: 1,
    title: "Personal Information",
    description: "Your personal details",
    icon: User,
  },
  {
    id: 2,
    title: "Employment Details",
    description: "Your work and income information",
    icon: Briefcase,
  },
  {
    id: 3,
    title: "Loan & Banking",
    description: "Loan details and banking information",
    icon: Calculator,
  },
  {
    id: 4,
    title: "Documents",
    description: "Required documents",
    icon: FileText,
  },
];

// Step Indicator Component
function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const IconComponent = step.icon;

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2",
                    {
                      "bg-primary border-primary text-primary-foreground":
                        isActive || isCompleted,
                      "bg-background border-muted-foreground text-muted-foreground":
                        !isActive && !isCompleted,
                    }
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <IconComponent className="w-5 h-5" />
                  )}
                </div>
                <div className="text-center mt-2">
                  <p
                    className={cn("text-sm font-medium", {
                      "text-primary": isActive || isCompleted,
                      "text-muted-foreground": !isActive && !isCompleted,
                    })}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-4",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function ApplicationPage({
  params,
}: ApplicationPageProps) {
  const { loan_id } = await params;

  // Check authentication
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  // Get application data
  let application;
  try {
    application = await getApplicationById(parseInt(loan_id));
  } catch (error) {
    console.error("Error fetching application:", error);
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold">Application not found</h1>
        <p className="text-muted-foreground">
          The application you're looking for doesn't exist or you don't have
          permission to view it.
        </p>
        <Button asChild className="mt-4">
          <Link href="/profile">Back to Profile</Link>
        </Button>
      </div>
    );
  }

  // Check if user owns this application
  if (application.user_id !== user.id) {
    redirect("/profile");
  }

  // Get documents
  const documents = await getApplicationDocuments(loan_id);

  // Determine current step based on application status and document completeness
  let currentStep = 4; // Default to documents step
  if (application.status === "pre_qualifier") {
    currentStep = 3; // Still in loan & banking step
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          {/* Navigation Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="outline" size="sm">
                <Link href="/profile">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Profile
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-semibold">
                  Application #{application.id}
                </h1>
                <p className="text-muted-foreground">
                  View your loan application details
                </p>
              </div>
            </div>
            <Badge
              variant="secondary"
              className={cn({
                "bg-green-100 text-green-800 border-green-200":
                  application.status === "approved",
                "bg-red-100 text-red-800 border-red-200":
                  application.status === "declined",
                "bg-blue-100 text-blue-800 border-blue-200":
                  application.status === "in_review",
                "bg-yellow-100 text-yellow-800 border-yellow-200":
                  application.status === "pending_documents",
                "bg-gray-100 text-gray-800 border-gray-200":
                  application.status === "pre_qualifier",
              })}
            >
              {application.status
                .replace("_", " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </Badge>
          </div>

          {/* Step Indicator */}
          <StepIndicator currentStep={currentStep} />

          {/* Application Steps */}
          <div className="space-y-6">
            {/* Step 1: Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Personal Information</CardTitle>
                <CardDescription>Your personal details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Date of Birth
                    </label>
                    <p className="mt-1 font-medium">
                      {application.date_of_birth
                        ? new Date(
                            application.date_of_birth
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Gender
                    </label>
                    <p className="mt-1 font-medium capitalize">
                      {application.gender?.replace("_", " ") || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Language
                    </label>
                    <p className="mt-1 font-medium capitalize">
                      {application.language || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Dependants
                    </label>
                    <p className="mt-1 font-medium">
                      {application.dependants ?? "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Marital Status
                    </label>
                    <p className="mt-1 font-medium capitalize">
                      {application.marital_status?.replace("_", " ") || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Nationality
                    </label>
                    <p className="mt-1 font-medium capitalize">
                      {application.nationality?.replace("_", " ") || "N/A"}
                    </p>
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="text-sm font-medium text-muted-foreground">
                      Address
                    </label>
                    <p className="mt-1 font-medium">
                      {application.home_address || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      City
                    </label>
                    <p className="mt-1 font-medium">
                      {application.city || "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Employment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Employment Details</CardTitle>
                <CardDescription>
                  Your work and income information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Employment Status
                    </label>
                    <p className="mt-1 font-medium capitalize">
                      {application.employment_type?.replace("_", " ") || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Employer
                    </label>
                    <p className="mt-1 font-medium">
                      {application.employer_name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Job Title
                    </label>
                    <p className="mt-1 font-medium">
                      {application.job_title || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Monthly Income
                    </label>
                    <p className="mt-1 font-medium">
                      {application.monthly_income
                        ? `R${formatCurrency(application.monthly_income)}`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Work Experience
                    </label>
                    <p className="mt-1 font-medium">
                      {application.work_experience || "N/A"}
                    </p>
                  </div>
                  {application.employment_end_date && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Employment End Date
                      </label>
                      <p className="mt-1 font-medium">
                        {new Date(
                          application.employment_end_date
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {application.employer_address && (
                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="text-sm font-medium text-muted-foreground">
                        Employer Address
                      </label>
                      <p className="mt-1 font-medium">
                        {application.employer_address}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Loan & Banking */}
            <Card>
              <CardHeader>
                <CardTitle>Step 3: Loan & Banking Details</CardTitle>
                <CardDescription>
                  Loan details and banking information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Loan Details */}
                  <div>
                    <h4 className="font-semibold mb-4">Loan Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Loan Amount
                        </label>
                        <p className="mt-1 font-medium text-lg">
                          R
                          {application.application_amount
                            ? formatCurrency(application.application_amount)
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Loan Purpose
                        </label>
                        <p className="mt-1 font-medium capitalize">
                          {application.loan_purpose?.replace("_", " ") || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Repayment Period
                        </label>
                        <p className="mt-1 font-medium">
                          {application.term
                            ? `${application.term} days`
                            : "N/A"}
                        </p>
                      </div>
                      {application.loan_purpose_reason && (
                        <div className="md:col-span-2 lg:col-span-3">
                          <label className="text-sm font-medium text-muted-foreground">
                            Loan Purpose Reason
                          </label>
                          <p className="mt-1 font-medium">
                            {application.loan_purpose_reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Banking Information */}
                  <div>
                    <h4 className="font-semibold mb-4">Banking Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Bank Name
                        </label>
                        <p className="mt-1 font-medium capitalize">
                          {application.bank_name?.replace("_", " ") || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Account Holder
                        </label>
                        <p className="mt-1 font-medium">
                          {application.bank_account_holder || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Account Type
                        </label>
                        <p className="mt-1 font-medium capitalize">
                          {application.bank_account_type?.replace("_", " ") ||
                            "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Account Number
                        </label>
                        <p className="mt-1 font-medium">
                          {application.bank_account_number || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Branch Code
                        </label>
                        <p className="mt-1 font-medium">
                          {application.branch_code || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Affordability Data */}
                  <AffordabilityView
                    affordabilityData={application.affordability as any}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Step 4: Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Step 4: Required Documents</CardTitle>
                <CardDescription>
                  Upload and manage your required documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentUploadForm
                  applicationId={loan_id}
                  documents={documents || []}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
