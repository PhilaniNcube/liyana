"use server";

import { updateApplicationStatus } from "@/lib/queries/applications";
import { revalidatePath } from "next/cache";
import { sendSms } from "./sms";

/**
 * Decline an application by ID. Optionally include a decline reason string.
 * Returns { success: boolean, error?: string }
 */
export async function declineApplicationAction(
  applicationId: number,
  reason?: string,
  phoneNumber?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateApplicationStatus(applicationId, "declined", reason || undefined);

    const message = 'Thank you for your loan application. Unfortunately it has not been approved at this time. We appreciate your interest and you\'re welcome to reapply in future. NCRCP18217';

    if (phoneNumber) {
      await sendSms(phoneNumber, message);
    }

    // Revalidate the application detail page and list
    revalidatePath("/dashboard/applications");
    revalidatePath(`/dashboard/applications/${applicationId}`);

    return { success: true };
  } catch (error: any) {
    console.error("declineApplicationAction error", error);
    return { success: false, error: error.message || "Failed to decline application" };
  }
}
