import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InfoRow } from "./info-row";
import {
  getApplicationByIdWithProfile,
  type ApplicationWithProfile,
} from "@/lib/queries/applications";
import { format as formatDate } from "date-fns";
import { formatCurrency } from "@/lib/utils/format-currency";
import { decryptValue } from "@/lib/encryption";

type Props = {
  applicationId: number;
};

function safe<T>(val: T | null | undefined, fallback: string = "—"): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string" && val.trim() === "") return fallback;
  return String(val);
}

function safeDecryptIdNumber(idNumber: string | null | undefined): string {
  if (!idNumber) return "—";
  try {
    return decryptValue(idNumber);
  } catch {
    return idNumber;
  }
}

export async function BorrowerDetails({ applicationId }: Props) {
  const application: ApplicationWithProfile =
    await getApplicationByIdWithProfile(applicationId);

  const profile = application.profile;

  const fullName = safe(profile?.full_name);
  const email = safe((profile as any)?.email); // profiles table may not have email; keep graceful
  const phone = safe(application.phone_number);
  const idNumber = safeDecryptIdNumber(application.id_number);
  const dob = application.date_of_birth
    ? formatDate(new Date(application.date_of_birth), "PP")
    : "—";
  const gender = safe(application.gender);
  const maritalStatus = safe(application.marital_status);
  const nationality = safe(application.nationality);
  const dependants = application.dependants ?? null;
  const language = safe(application.language);
  const address =
    [application.home_address, application.city, application.postal_code]
      .filter(Boolean)
      .join(", ") || "—";

  const employmentType = safe(application.employment_type);
  const employerName = safe(application.employer_name);
  const jobTitle = safe(application.job_title);
  const monthlyIncome =
    application.monthly_income != null
      ? formatCurrency(application.monthly_income)
      : "—";
  const employerContact = safe(application.employer_contact_number);
  const employerAddress = safe(application.employer_address);
  const workExperience = safe(application.work_experience);
  const employmentEndDate = application.employment_end_date
    ? formatDate(new Date(application.employment_end_date), "PP")
    : "—";

  const nextOfKin = {
    name: safe(application.next_of_kin_name),
    phone: safe(application.next_of_kin_phone_number),
    email: safe(application.next_of_kin_email),
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Borrower Details</CardTitle>
        <CardDescription>
          Personal and employment information from the application and profile.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-3">
            <h3 className="text-base font-medium">Personal</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow label="Full name" value={fullName} />
              <InfoRow label="ID number" value={idNumber} />
              <InfoRow label="Date of birth" value={dob} />
              <InfoRow label="Phone" value={phone} />
              <InfoRow label="Email" value={email} />
              <InfoRow label="Gender" value={gender} />
              <InfoRow label="Marital status" value={maritalStatus} />
              <InfoRow label="Nationality" value={nationality} />
              <InfoRow
                label="Dependants"
                value={dependants !== null ? String(dependants) : "—"}
              />
              <InfoRow label="Language" value={language} />
              <InfoRow label="Address" value={address} />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-medium">Employment</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow label="Employment type" value={employmentType} />
              <InfoRow label="Employer" value={employerName} />
              <InfoRow label="Job title" value={jobTitle} />
              <InfoRow label="Monthly income" value={monthlyIncome} />
              <InfoRow label="Employer contact" value={employerContact} />
              <InfoRow label="Employer address" value={employerAddress} />
              <InfoRow label="Work experience" value={workExperience} />
              <InfoRow label="Employment end date" value={employmentEndDate} />
            </div>
          </section>
        </div>

        <div className="mt-6 space-y-3">
          <h3 className="text-base font-medium">Next of Kin</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <InfoRow label="Name" value={nextOfKin.name} />
            <InfoRow label="Phone" value={nextOfKin.phone} />
            <InfoRow label="Email" value={nextOfKin.email} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
