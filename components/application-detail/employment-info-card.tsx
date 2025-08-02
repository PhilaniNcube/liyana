import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Building, Shield, Loader2 } from "lucide-react";
import { useState } from "react";
import { verifyEmployment } from "@/lib/actions/employment-verification";
import { toast } from "sonner";
import {
  DecryptedApplication,
  EmploymentVerificationApiResponse,
} from "@/lib/schemas";

interface EmploymentInfoCardProps {
  application: DecryptedApplication;
}

export function EmploymentInfoCard({ application }: EmploymentInfoCardProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationData, setVerificationData] =
    useState<EmploymentVerificationApiResponse | null>(null);

  const handleVerifyEmployment = async () => {
    setIsVerifying(true);
    try {
      const result = await verifyEmployment(application);

      if (result.success && result.data) {
        toast.success("Employment verification completed successfully");
        setVerificationData(result.data);
      } else {
        toast.error(result.error || "Employment verification failed");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsVerifying(false);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Employment Information
          </CardTitle>
          <Button
            onClick={handleVerifyEmployment}
            disabled={isVerifying}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {isVerifying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            {isVerifying ? "Verifying..." : "Verify Employment"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Employment Type
            </p>
            <p className="text-sm">{application.employment_type || "N/A"}</p>
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
            <p className="text-sm">{application.work_experience || "N/A"}</p>
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

        {/* Employment Verification Results */}
        {verificationData && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-green-600 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Employment Verification Results
              </h4>
              {verificationData.data.detail.employerInformation.map(
                (employer, index) => (
                  <div
                    key={employer.id}
                    className="bg-green-50 p-3 rounded-md border border-green-200"
                  >
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-medium">Employer:</span>{" "}
                        {employer.employerName}
                      </div>
                      <div>
                        <span className="font-medium">Occupation:</span>{" "}
                        {employer.occupation}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>{" "}
                        {employer.latestStatus}
                      </div>
                      <div>
                        <span className="font-medium">Score:</span>{" "}
                        {employer.score}%
                      </div>
                      <div>
                        <span className="font-medium">Sector:</span>{" "}
                        {employer.sector}
                      </div>
                      <div>
                        <span className="font-medium">Source:</span>{" "}
                        {employer.kycSource}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
