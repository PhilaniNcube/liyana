import { toast } from "sonner";

interface Application {
  id: number;
  status: string;
}

/**
 * Handle submission of application to BraveLender
 * @param application - The application object
 * @param setIsSubmittingToBraveLender - State setter for loading state
 * @param onSuccess - Optional callback for successful submission
 * @param onError - Optional callback for failed submission
 */
export const handleBraveLenderSubmit = async (
  application: Application,
  setIsSubmittingToBraveLender: (loading: boolean) => void,
  onSuccess?: () => void,
  onError?: (error: string) => void
) => {
  setIsSubmittingToBraveLender(true);

  try {
    const response = await fetch("/api/bravelender/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ applicationId: application.id }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to submit to BraveLender");
    }

    toast.success("Application successfully submitted to BraveLender!");

    // Call success callback or default action
    if (onSuccess) {
      onSuccess();
    } else {
      window.location.reload();
    }
  } catch (error) {
    console.error("Error submitting to BraveLender:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to submit to BraveLender";

    toast.error(errorMessage);

    // Call error callback if provided
    if (onError) {
      onError(errorMessage);
    }
  } finally {
    setIsSubmittingToBraveLender(false);
  }
};
