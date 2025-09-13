import { useState } from "react";
import { DeceasedStatusInformation } from "@/lib/schemas";

interface UseDeceasedStatusCheckReturn {
  checkDeceasedStatus: (idNumber: string) => Promise<DeceasedStatusInformation[] | null>;
  isLoading: boolean;
  error: string | null;
}

export function useDeceasedStatusCheck(): UseDeceasedStatusCheckReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkDeceasedStatus = async (idNumber: string): Promise<DeceasedStatusInformation[] | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/kyc/deceased-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id_number: idNumber }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific WhoYou error codes
        if (response.status === 400 && errorData.details) {
          try {
            const details = typeof errorData.details === 'string' 
              ? JSON.parse(errorData.details) 
              : errorData.details;
            
            if (details.code === 10084) {
              throw new Error("Deceased status check service is temporarily unavailable. Please contact support for assistance.");
            }
          } catch (parseError) {
            // If parsing fails, use the original error
          }
        }
        
        throw new Error(errorData.error || "Failed to check deceased status");
      }

      const result = await response.json();
      return result.data?.detail?.deceasedStatusInformation || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Deceased status check error:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    checkDeceasedStatus,
    isLoading,
    error,
  };
}
