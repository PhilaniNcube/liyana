import { getApplicationByIdWithProfile } from "@/lib/queries/applications";
import { getApiChecksByIdNumber } from "@/lib/queries/api-checks";
import { getDocumentsByApplication } from "@/lib/queries/documents";
import { notFound } from "next/navigation";
import { decryptValue } from "@/lib/encryption";
import { ApplicationDetailClient } from "./client";

interface ApplicationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplicationDetailPage({
  params,
}: ApplicationDetailPageProps) {
  const { id } = await params;
  const applicationId = parseInt(id);

  if (isNaN(applicationId)) {
    notFound();
  }

  try {
    const application = await getApplicationByIdWithProfile(applicationId);

    if (!application) {
      notFound();
    }

    // Decrypt sensitive data on the server side
    const decryptedIdNumber = decryptValue(application.id_number);

    // Fetch API checks for the decrypted ID number
    const apiChecks = await getApiChecksByIdNumber(decryptedIdNumber);

    // Fetch documents for this application
    const documents = await getDocumentsByApplication(applicationId);

    const decryptedApplication = {
      ...application,
      id_number_decrypted: decryptedIdNumber,
    };

    return (
      <ApplicationDetailClient
        application={decryptedApplication}
        apiChecks={apiChecks}
        documents={documents}
      />
    );
  } catch (error) {
    console.error("Error fetching application:", error);
    notFound();
  }
}
