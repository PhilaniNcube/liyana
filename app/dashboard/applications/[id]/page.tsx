import { getApplicationByIdWithProfile } from "@/lib/queries/applications";
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
    const decryptedApplication = {
      ...application,
      id_number_decrypted: decryptValue(application.id_number),
    };

    return <ApplicationDetailClient application={decryptedApplication} />;
  } catch (error) {
    console.error("Error fetching application:", error);
    notFound();
  }
}
