import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Building } from "lucide-react";

interface Application {
  employment_type: string | null;
  monthly_income: number | null;
  job_title: string | null;
  work_experience: string | null;
  employer_name: string | null;
  employer_address: string | null;
  employer_contact_number: string | null;
  employment_end_date: string | null;
}

interface EmploymentInfoCardProps {
  application: Application;
}

export function EmploymentInfoCard({ application }: EmploymentInfoCardProps) {
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
      </CardContent>
    </Card>
  );
}
