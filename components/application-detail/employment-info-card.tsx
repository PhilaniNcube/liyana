"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Building, Shield, Loader2 } from "lucide-react";
import { useState } from "react";
import { verifyEmployment } from "@/lib/actions/employment-verification";
import { toast } from "sonner";
import {
  EmploymentVerificationApiResponse,
  DecryptedApplication,
} from "@/lib/schemas";
import { updateApplicationDetails } from "@/lib/actions/applications";
import { EditableRow } from "./editable-row";

interface EmploymentInfoCardProps {
  application: DecryptedApplication;
}

const employmentTypeOptions = [
  { label: "Employed", value: "employed" },
  { label: "Self Employed", value: "self_employed" },
  { label: "Contract", value: "contract" },
  { label: "Unemployed", value: "unemployed" },
  { label: "Retired", value: "retired" },
];

export function EmploymentInfoCard({ application }: EmploymentInfoCardProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationData, setVerificationData] =
    useState<EmploymentVerificationApiResponse | null>(null);

  const bindAction = (fieldName: string) => {
    return updateApplicationDetails.bind(
      null,
      application.id,
      application.user_id,
      fieldName
    );
  };

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
        <div className="flex items-center justify-between bg-yellow-200 p-3 rounded-lg">
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
            <EditableRow
              label="Employment Type"
              value={application.employment_type}
              fieldName="employment_type"
              inputType="select"
              options={employmentTypeOptions}
              action={bindAction("employment_type")}
            />
          </div>
          <div>
            <EditableRow
              label="Monthly Income"
              value={application.monthly_income}
              displayValue={formatCurrency(application.monthly_income)}
              fieldName="monthly_income"
              inputType="number"
              action={bindAction("monthly_income")}
            />
          </div>
          <div>
            <EditableRow
              label="Job Title"
              value={application.job_title}
              fieldName="job_title"
              action={bindAction("job_title")}
            />
          </div>
          <div>
            <EditableRow
              label="Work Experience"
              value={application.work_experience}
              fieldName="work_experience"
              action={bindAction("work_experience")}
            />
          </div>
        </div>
        <Separator />
        <div>
          <EditableRow
            label="Employer Name"
            value={application.employer_name}
            fieldName="employer_name"
            action={bindAction("employer_name")}
          />
        </div>
        <div>
          <EditableRow
            label="Employer Address"
            value={application.employer_address}
            fieldName="employer_address"
            action={bindAction("employer_address")}
          />
        </div>
        <div>
          <EditableRow
            label="Employer Contact"
            value={application.employer_contact_number}
            fieldName="employer_contact_number"
            inputType="tel"
            action={bindAction("employer_contact_number")}
          />
        </div>
        {application.employment_end_date && (
          <div>
            <EditableRow
              label="Employment End Date"
              value={application.employment_end_date}
              displayValue={formatDate(application.employment_end_date)}
              fieldName="employment_end_date"
              inputType="date"
              action={bindAction("employment_end_date")}
            />
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
                        <span className="font-medium capitalize">
                          Employer:
                        </span>{" "}
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
