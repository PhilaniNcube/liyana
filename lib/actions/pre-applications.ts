"use server";

import { createClient } from "@/lib/server";
import { PreApplication, PreApplicationUpdate } from "../schemas";
import { encryptValue } from "../encryption";
import { Database } from "../types";
import { getCurrentUser } from "../queries";

export async function createPreApplication(

  idNumber: string,
  creditCheckId: number,
  creditScore: number
): Promise<PreApplication> {
  const supabase = await createClient();

  const user = await getCurrentUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const encryptedIdNumber = encryptValue(idNumber);

  const { data, error } = await supabase
    .from("pre_applications")
    .insert({
      user_id: user.id,
      profile_id: user.id,
      id_number: encryptedIdNumber,
      credit_check_id: creditCheckId,
      credit_score: creditScore,
      status: "credit_passed",
    //   created_at: new Date().toISOString(),
    //   updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create pre-application: ${error.message}`);
  }

  return data;
}

export async function updatePreApplicationStatus(
  preApplicationId: number,
  status: Database["public"]["Enums"]["pre_application_status"],
  applicationId?: number
): Promise<PreApplication> {
  const supabase = await createClient();

  const updateData: PreApplicationUpdate = {
    status,
    ...(applicationId && { application_id: applicationId }),
  };

  const { data, error } = await supabase
    .from("pre_applications")
    .update(updateData)
    .eq("id", preApplicationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update pre-application: ${error.message}`);
  }

  return data;
}

export async function handleCreditCheckSuccess(
  idNumber: string,
  creditCheckId: number,
  creditScore: number
) {
  try {
    // Create a pre-application record when credit check passes
    const preApplication = await createPreApplication(
      idNumber,
      creditCheckId,
      creditScore
    );

    return {
      success: true,
      preApplicationId: preApplication.id,
    };
  } catch (error) {
    console.error("Error creating pre-application:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function handleApplicationStarted(preApplicationId: number) {
  try {
    await updatePreApplicationStatus(preApplicationId, "application_started");
    return { success: true };
  } catch (error) {
    console.error("Error updating pre-application status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function handleApplicationCompleted(
  preApplicationId: number,
  applicationId: number
) {
  try {
    await updatePreApplicationStatus(
      preApplicationId,
      "application_completed",
      applicationId
    );
    return { success: true };
  } catch (error) {
    console.error("Error updating pre-application status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function findExistingPreApplication(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pre_applications")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["credit_passed", "application_started"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    throw new Error(`Failed to find existing pre-application: ${error.message}`);
  }

  return data;
}
