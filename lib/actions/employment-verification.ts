"use server";

import { revalidatePath } from "next/cache";
import {
  EmploymentVerificationApiResponse,
  DecryptedApplication,
} from "@/lib/schemas";

export async function verifyEmployment(
  application: DecryptedApplication
): Promise<{
  success: boolean;
  data?: EmploymentVerificationApiResponse;
  error?: string;
}> {
  try {
    // Use the internal API URL for server-side requests
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/kyc/employment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ application }),
    });

    if (!response.ok) {
      console.error("Failed to verify employment:", response.statusText);
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      return {
        success: false,
        error:
          errorData.error ||
          `HTTP ${response.status}: Failed to verify employment`,
      };
    }

    const result: EmploymentVerificationApiResponse = await response.json();

    // Revalidate the page to refresh any cached data
    revalidatePath("/dashboard");

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Employment verification error:", error);
    return {
      success: false,
      error: "An unexpected error occurred during employment verification",
    };
  }
}
