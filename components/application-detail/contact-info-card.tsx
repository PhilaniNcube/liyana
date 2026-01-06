import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Phone } from "lucide-react";
import { EditableRow } from "./editable-row";
import { updateApplicationDetails } from "@/lib/actions/applications";

interface Application {
  id: number;
  user_id: string;
  phone_number: string | null;
  next_of_kin_name: string | null;
  next_of_kin_phone_number: string | null;
  next_of_kin_email: string | null;
}

interface ContactInfoCardProps {
  application: Application;
}

export function ContactInfoCard({ application }: ContactInfoCardProps) {
  const bindAction = (fieldName: string) => {
    return updateApplicationDetails.bind(
      null,
      application.id,
      application.user_id,
      fieldName
    );
  };

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
          <EditableRow
            label="Phone Number"
            value={application.phone_number || "N/A"}
            fieldName="phone_number"
            inputType="tel"
            action={bindAction("phone_number")}
          />
        </div>
        <Separator />
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Next of Kin
          </p>
          <div className="grid grid-cols-1 gap-2">
            <div>
              <EditableRow
                label="Name"
                value={application.next_of_kin_name || "N/A"}
                fieldName="next_of_kin_name"
                action={bindAction("next_of_kin_name")}
              />
            </div>
            <div>
              <EditableRow
                label="Phone"
                value={application.next_of_kin_phone_number || "N/A"}
                fieldName="next_of_kin_phone_number"
                inputType="tel"
                action={bindAction("next_of_kin_phone_number")}
              />
            </div>
            <div>
              <EditableRow
                label="Email"
                value={application.next_of_kin_email || "N/A"}
                fieldName="next_of_kin_email"
                inputType="email"
                action={bindAction("next_of_kin_email")}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
