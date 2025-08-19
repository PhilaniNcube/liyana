"use server";

import { updateApplicationStatus } from "@/lib/queries/applications";
import { revalidatePath } from "next/cache";

/**
 * Decline an application by ID. Optionally include a decline reason string.
 * Returns { success: boolean, error?: string }
 */
export async function declineApplicationAction(
  applicationId: number,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateApplicationStatus(applicationId, "declined", reason || undefined);

    // Revalidate the application detail page and list
    revalidatePath("/dashboard/applications");
    revalidatePath(`/dashboard/applications/${applicationId}`);

    return { success: true };
  } catch (error: any) {
    console.error("declineApplicationAction error", error);
    return { success: false, error: error.message || "Failed to decline application" };
  }
}
