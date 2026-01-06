"use server";

import { updateApplicationStatus } from "@/lib/queries/applications";
import { revalidatePath } from "next/cache";
import { sendSms } from "./sms";

/**
 * Decline an application by ID. Optionally include a decline reason string.
 * Returns { success: boolean, error?: string }
 */
// ... imports
import { loanApplicationSchema } from "@/lib/schemas";
import { createClient } from "@/lib/server";

export async function declineApplicationAction(
  applicationId: number,
  reason?: string,
  phoneNumber?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateApplicationStatus(applicationId, "declined", reason || undefined);

    const message = 'Thank you for your loan application. Unfortunately it has not been approved at this time. We appreciate your interest and you\'re welcome to reapply in future. NCRCP18217';

    if (phoneNumber) {
      await sendSms(phoneNumber, reason || message);
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

export async function updateApplicationDetails(
  applicationId: number,
  userId: string,
  fieldName: string,
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const value = formData.get(fieldName);

    const supabase = await createClient();

    const southAfricanBanks = [
      { name: "ABSA Bank", code: "632005" },
      { name: "African Bank", code: "430000" },
      { name: "Bidvest Bank", code: "462005" },
      { name: "Capitec Bank", code: "470010" },
      { name: "Discovery Bank", code: "679000" },
      { name: "FNB (First National Bank)", code: "250655" },
      { name: "Investec Bank", code: "580105" },
      { name: "Nedbank", code: "198765" },
      { name: "Standard Bank", code: "051001" },
      { name: "TymeBank", code: "678910" },
      { name: "Ubank", code: "431010" },
      { name: "VBS Mutual Bank", code: "588000" },
    ];

    // Profile fields that reside in the 'profiles' table
    const profileFields = ["full_name", "first_name", "last_name", "email", "phone_number"];
    const isProfileField = profileFields.includes(fieldName);

    if (isProfileField) {
      if (fieldName === 'full_name') {
        const { error } = await supabase.from("profiles").update({ full_name: value?.toString() || "" }).eq("id", userId);
        if (error) throw error;
      } else if (fieldName === 'phone_number') {
        const { error } = await supabase.from("profiles").update({ phone_number: value?.toString() || "" }).eq("id", userId);
        if (error) throw error;
      } else if (fieldName === 'email') {
        const emailValue = value?.toString() || "";
        const { error } = await supabase.from("profiles").update({ email: emailValue }).eq("id", userId);
        if (error) throw error;
        console.log("Updated profile email:", emailValue);
      }
    } else {
      // Application fields
      let typedValue: any = value;

      // Special handling for bank name to also update branch code
      if (fieldName === 'bank_name') {
        const bank = southAfricanBanks.find(b => b.name === value?.toString());
        if (bank) {
          const { error } = await supabase
            .from("applications")
            .update({
              bank_name: bank.name,
              branch_code: bank.code
            })
            .eq("id", applicationId);
          if (error) throw error;

          revalidatePath(`/dashboard/applications/${applicationId}`);
          return { success: true };
        }
      }

      // Handle numeric conversions
      if (['monthly_income', 'dependants', 'application_amount', 'term', 'salary_date', 'payment_date'].includes(fieldName)) {
        typedValue = value ? Number(value) : null;
      }

      const { error } = await supabase.from("applications").update({ [fieldName]: typedValue }).eq("id", applicationId);
      if (error) throw error;
    }

    revalidatePath(`/dashboard/applications/${applicationId}`);
    return { success: true };

  } catch (error: any) {
    console.error("updateApplicationDetails error", error);
    return { success: false, error: error.message || "Failed to update details" };
  }
}

