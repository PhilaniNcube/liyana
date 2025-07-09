import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Phone } from "lucide-react";

interface Application {
  phone_number: string | null;
  next_of_kin_name: string | null;
  next_of_kin_phone_number: string | null;
  next_of_kin_email: string | null;
}

interface ContactInfoCardProps {
  application: Application;
}

export function ContactInfoCard({ application }: ContactInfoCardProps) {
  return (
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
              <p className="text-xs font-medium text-muted-foreground">Name</p>
              <p className="text-sm capitalize">
                {application.next_of_kin_name || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Phone</p>
              <p className="text-sm">
                {application.next_of_kin_phone_number || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Email</p>
              <p className="text-sm">
                {application.next_of_kin_email || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
