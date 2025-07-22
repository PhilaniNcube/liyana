import { getUserProfile } from "@/lib/queries/user";
import { getApplicationsByUser } from "@/lib/queries/applications";
import { getApiChecksByIdNumber } from "@/lib/queries/api-checks";
import { notFound } from "next/navigation";
import { decryptValue } from "@/lib/encryption";
import { ProfilePageClient } from "./client";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;

  try {
    // Fetch user profile
    const profile = await getUserProfile(id);

    if (!profile) {
      notFound();
    }

    // Fetch user applications
    const applications = await getApplicationsByUser(id);

    // Decrypt ID number and fetch API checks if available
    let apiChecks: any[] = [];
    let decryptedIdNumber: string | null = null;

    if (profile.id_number) {
      try {
        decryptedIdNumber = decryptValue(profile.id_number);
        apiChecks = await getApiChecksByIdNumber(decryptedIdNumber);
      } catch (error) {
        console.error(
          "Failed to decrypt ID number or fetch API checks:",
          error
        );
        // Continue without API checks if decryption fails
      }
    }

    // Decrypt the profile ID number for display
    const profileWithDecryptedId = {
      ...profile,
      decrypted_id_number: decryptedIdNumber,
    };

    return (
      <ProfilePageClient
        profile={profileWithDecryptedId}
        applications={applications}
        apiChecks={apiChecks}
      />
    );
  } catch (error) {
    console.error("Error fetching profile data:", error);
    notFound();
  }
}
