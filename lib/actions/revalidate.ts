"use server";

import { revalidatePath } from "next/cache";

export async function revalidateDocuments() {
  try {
    // Revalidate the demo documents page
    revalidatePath("/demo/documents");

    // Revalidate any profile pages that might show documents
    revalidatePath("/profile", "layout");

    return { success: true };
  } catch (error) {
    console.error("Revalidation error:", error);
    return { success: false, error: "Failed to refresh data" };
  }
}

export async function revalidateUserData() {
  try {
    // Revalidate user-specific pages
    revalidatePath("/profile", "layout");
    revalidatePath("/apply");

    // Revalidate the main layout to update navigation
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("User data revalidation error:", error);
    return { success: false, error: "Failed to refresh user data" };
  }
}

export async function revalidateLayout() {
  try {
    // Revalidate the root layout
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("Layout revalidation error:", error);
    return { success: false, error: "Failed to refresh layout" };
  }
}
