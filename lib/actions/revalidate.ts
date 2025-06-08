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
