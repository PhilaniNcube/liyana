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
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResetPasswordComponent } from "@/components/reset-password-component";
import type { Database } from "@/lib/types";

interface ProfilePageClientProps {
  applications: Database["public"]["Tables"]["applications"]["Row"][] | null;
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

// Helper function to get status icon
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
  userEmail,
  userFullName,
}: ProfilePageClientProps) {
  const router = useRouter();
  const hasApplications = applications && applications.length > 0;

  const handleApplicationClick = (applicationId: number) => {
    router.push(`/profile/${applicationId}`);
  };

  return (
    <div className="space-y-8">
      {/* User Settings Section */}

      {hasApplications ? (
        // Show applications with option to create new
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Applications</h1>
              <p className="text-muted-foreground mt-1">
                Manage and track your loan applications
              </p>
            </div>
            <Button asChild className="flex items-center gap-2">
              <Link href="/apply">
                <Plus className="h-4 w-4" />
                New Application
              </Link>
            </Button>
          </div>

          {/* Responsive grid of applications */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {applications.map((application, index) => (
              <Card
                key={application.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group"
                onClick={() => handleApplicationClick(application.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Application #{application.id}
                    </CardTitle>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={getStatusColor(application.status)}
                    >
                      {getStatusIcon(application.status)}
                      <span className="ml-1 capitalize">
                        {application.status.replace("_", " ")}
                      </span>
                    </Badge>
                    {index === 0 && (
                      <Badge variant="outline" className="text-xs">
                        Latest
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Amount
                      </span>
                      <span className="font-semibold text-lg">
                        R
                        {application.application_amount?.toLocaleString() ||
                          "0"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Term
                      </span>
                      <span className="font-medium">
                        {application.term || "N/A"} days
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Submitted
                      </span>
                      <span className="font-medium text-sm">
                        {new Date(application.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Status-specific message */}
                  <div className="pt-2 border-t">
                    {application.status === "in_review" && (
                      <p className="text-sm text-blue-600">
                        Under review by our team
                      </p>
                    )}
                    {application.status === "approved" && (
                      <p className="text-sm text-green-600">
                        ✓ Application approved
                      </p>
                    )}
                    {application.status === "declined" && (
                      <p className="text-sm text-red-600">
                        Application declined
                      </p>
                    )}
                    {application.status === "pre_qualifier" && (
                      <p className="text-sm text-gray-600">
                        Application in progress
                      </p>
                    )}
                    {application.status === "pending_documents" && (
                      <p className="text-sm text-yellow-600">
                        Documents required
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : (
        // Show welcome message for new users
        <section className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-6 py-12">
            <div className="max-w-md mx-auto">
              <h1 className="text-3xl font-bold mb-4">Welcome to Liyana</h1>
              <p className="text-muted-foreground">
                You haven't submitted any loan applications yet. Get started by
                applying for a payday cash loan. The process is quick and easy.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="flex items-center gap-2 mx-auto"
            >
              <Link href="/apply">
                <Plus className="h-4 w-4" />
                Apply for a Loan
              </Link>
            </Button>
          </div>
          {/* User Settings Section for new users */}
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
                <ResetPasswordComponent
                  userEmail={userEmail}
                  className="ml-auto"
                />
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
        </section>
      )}
    </div>
  );
}
