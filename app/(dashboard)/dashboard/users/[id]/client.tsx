"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryState } from "nuqs";
import {
  User,
  Mail,
  Phone,
  FileText,
  CreditCard,
  Shield,
  ArrowLeft,
  CheckCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ProfileDocumentUpload } from "@/components/profile-document-upload";
import { ProfileDocumentsDisplay } from "@/components/profile-documents-display";
import { CreateApplicationDialog } from "@/components/create-application-dialog";
import { EmailUserComponent } from "@/components/email-user-component";
import SmsApplication from "@/components/sms-application";
import { toast } from "sonner";
import type { Database } from "@/lib/types";
import { EmailHistory } from "@/components/email-history-new";
import { UserEmailHistory } from "../_components/user-email-history";
import { EmailRecord } from "@/lib/queries/emails";

type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  decrypted_id_number: string | null;
};

type Application = Database["public"]["Tables"]["applications"]["Row"];
type ProfileDocument = Database["public"]["Tables"]["profile_documents"]["Row"];

interface ProfilePageClientProps {
  profile: Profile;
  applications: Application[];
  apiChecks: any[];
  emails: EmailRecord[];
}

export function ProfilePageClient({
  profile,
  applications,
  apiChecks,
  emails,
}: ProfilePageClientProps) {
  const [profileDocuments, setProfileDocuments] = useState<ProfileDocument[]>(
    []
  );

  // URL state for tab management
  const [activeTab, setActiveTab] = useQueryState("tab", {
    defaultValue: "profile",
    clearOnDefault: true,
  });

  const handleProfileDocumentUploadSuccess = (newDocument: ProfileDocument) => {
    setProfileDocuments((prev) => [...prev, newDocument]);
    toast.success("Document uploaded successfully");
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
      case "submitted_to_lender":
        return "bg-purple-100 text-purple-800";
      case "submission_failed":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getApiCheckStatusColor = (status: string) => {
    switch (status) {
      case "passed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "editor":
        return "bg-blue-100 text-blue-800";
      case "customer":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getApiCheckIcon = (checkType: string) => {
    switch (checkType) {
      case "fraud_check":
      case "credit_bureau":
        return <CreditCard className="h-4 w-4" />;
      case "email_verification":
        return <Mail className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  // Calculate summary statistics
  const totalApplications = applications.length;
  const approvedApplications = applications.filter(
    (app) => app.status === "approved"
  ).length;
  const declinedApplications = applications.filter(
    (app) => app.status === "declined"
  ).length;
  const pendingApplications = applications.filter((app) =>
    ["in_review", "pending_documents", "pre_qualifier"].includes(app.status)
  ).length;

  const totalApiChecks = apiChecks.length;
  const passedChecks = apiChecks.filter(
    (check) => check.status === "passed"
  ).length;
  const failedChecks = apiChecks.filter(
    (check) => check.status === "failed"
  ).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{profile.full_name}</h1>
            <p className="text-muted-foreground">
              User Profile • Registered{" "}
              {formatDistanceToNow(new Date(profile.created_at), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
        <Badge className={getRoleColor(profile.role)}>
          {profile.role.toUpperCase()}
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Applications
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              {approvedApplications} approved, {declinedApplications} declined
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {approvedApplications}
            </div>
            <p className="text-xs text-muted-foreground">
              Successful applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingApplications}
            </div>
            <p className="text-xs text-muted-foreground">Under review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Checks</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalApiChecks}
            </div>
            <p className="text-xs text-muted-foreground">
              {passedChecks} passed, {failedChecks} failed
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="mt-4 w-full"
      >
        <TabsList className="w-full">
          <TabsTrigger value="profile">Profile Info</TabsTrigger>
          <TabsTrigger value="applications">
            Loan Applications ({totalApplications})
          </TabsTrigger>
          <TabsTrigger value="api-checks">
            API Checks ({totalApiChecks})
          </TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="email">Email Client</TabsTrigger>

          <TabsTrigger value="sms">SMS Client</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Full Name
                    </p>
                    <p className="text-sm font-semibold">{profile.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Email
                    </p>
                    <p className="text-sm">{profile.email || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Phone Number
                    </p>
                    <p className="text-sm">
                      {profile.phone_number || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      ID Number
                    </p>
                    <p className="text-sm">
                      {profile.decrypted_id_number || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Role
                    </p>
                    <Badge className={getRoleColor(profile.role)}>
                      {profile.role}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Registered
                    </p>
                    <p className="text-sm">{formatDate(profile.created_at)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Applications History
              </CardTitle>
              <CardDescription>
                All loan applications submitted by this user
              </CardDescription>
              <div className="mt-4">
                <CreateApplicationDialog
                  profile={profile as any}
                  previousApplication={
                    applications.length > 0
                      ? [...applications].sort(
                          (a, b) =>
                            new Date(b.created_at).getTime() -
                            new Date(a.created_at).getTime()
                        )[0]
                      : null
                  }
                  applicationsCount={applications.length}
                />
              </div>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground">
                    No Applications
                  </h3>
                  <p className="text-muted-foreground">
                    This user hasn't submitted any applications yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div
                      key={application.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <Link
                            href={`/dashboard/applications/${application.id}`}
                            className="text-sm font-medium text-blue-600 hover:underline"
                          >
                            Application #{application.id}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(application.created_at),
                              { addSuffix: true }
                            )}
                          </p>
                        </div>
                        <Badge className={getStatusColor(application.status)}>
                          {application.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                      {application.application_amount && (
                        <p className="text-sm">
                          <span className="font-medium">Amount:</span> R
                          {application.application_amount.toLocaleString()}
                        </p>
                      )}
                      {application.loan_purpose && (
                        <p className="text-sm capitalize">
                          <span className="font-medium ">Purpose:</span>{" "}
                          {/* Replace any underscores with spaces */}
                          {application.loan_purpose.replace("_", " ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-checks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                API Checks History
              </CardTitle>
              <CardDescription>
                All verification and credit checks performed for this user's ID
                number
              </CardDescription>
            </CardHeader>
            <CardContent>
              {apiChecks.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground">
                    No API Checks
                  </h3>
                  <p className="text-muted-foreground">
                    No verification checks have been performed for this user
                    yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {apiChecks.map((check) => (
                    <div
                      key={check.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getApiCheckIcon(check.check_type)}
                          <div>
                            <p className="text-sm font-medium">
                              {check.check_type.replace("_", " ").toUpperCase()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {check.vendor} •{" "}
                              {formatDistanceToNow(new Date(check.checked_at), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                        <Badge className={getApiCheckStatusColor(check.status)}>
                          {check.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfileDocumentUpload
                profileId={profile.id}
                onUploadSuccess={handleProfileDocumentUploadSuccess}
              />
              <ProfileDocumentsDisplay
                profileId={profile.id}
                documents={profileDocuments}
                onRefresh={() => {
                  setProfileDocuments([]);
                }}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="email">
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Client
                </CardTitle>
                <CardDescription>
                  Send emails to {profile.full_name} (
                  {profile.email || "No email provided"})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile.email ? (
                  <EmailUserComponent
                    profileId={profile.id}
                    defaultSubject={`Message for ${profile.full_name}`}
                    recipientName={profile.full_name}
                    recipientEmail={profile.email}
                  />
                ) : (
                  <div className="text-center py-8">
                    <Mail className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground">
                      No Email Address
                    </h3>
                    <p className="text-muted-foreground">
                      This user hasn't provided an email address yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            <UserEmailHistory userId={profile.id} initialEmails={emails} />
          </div>
        </TabsContent>

        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                SMS Client
              </CardTitle>
              <CardDescription>
                Send SMS messages to {profile.full_name} (
                {profile.phone_number || "No phone number provided"})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile.phone_number ? (
                <SmsApplication
                  applicationId={0} // Using 0 as default since this is for general user communication
                  profileId={profile.id}
                  phoneNumber={profile.phone_number}
                  applicantName={profile.full_name}
                />
              ) : (
                <div className="text-center py-8">
                  <Phone className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground">
                    No Phone Number
                  </h3>
                  <p className="text-muted-foreground">
                    This user hasn't provided a phone number yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
