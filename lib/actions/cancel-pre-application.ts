"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/server";

export async function cancelPreApplication(preApplicationId: number) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated and has admin/editor role
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    // Check if user has admin or editor role
    const { data: userProfile, error: userProfileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userProfileError || !userProfile) {
      return {
        success: false,
        error: "User profile not found",
      };
    }

    if (userProfile.role !== "admin" && userProfile.role !== "editor") {
      return {
        success: false,
        error: "Access denied. Admin or editor privileges required.",
      };
    }

    // Update the pre-application status to cancelled
    const { error: updateError } = await supabase
      .from("pre_applications")
      .update({ status: "cancelled" })
      .eq("id", preApplicationId);

    if (updateError) {
      return {
        success: false,
        error: `Failed to cancel pre-application: ${updateError.message}`,
      };
    }

    // Revalidate the page to show updated data
    revalidatePath("/dashboard/applications/incomplete");

    return {
      success: true,
      message: "Pre-application cancelled successfully",
    };
  } catch (error) {
    console.error("Error cancelling pre-application:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
