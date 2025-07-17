import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User } from "lucide-react";

interface Application {
  id_number_decrypted: string;
  email?: string | null;
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
  profile?: {
    full_name: string;
    email?: string | null;
  } | null;
}

interface PersonalInfoCardProps {
  application: Application;
}

export function PersonalInfoCard({ application }: PersonalInfoCardProps) {
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
              Email Address
            </p>
            <p className="text-sm">
              {application.profile?.email || application.email || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Date of Birth
            </p>
            <p className="text-sm">{formatDate(application.date_of_birth)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Gender</p>
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
  );
}
