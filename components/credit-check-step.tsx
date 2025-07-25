import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

// Define the types for the credit check results to match the API response
interface ScoreReason {
  reasonCode: string;
  reasonDescription: string;
}

interface CreditCheckResults {
  success: boolean;
  message: string;
  score?: number;
  reasons?: ScoreReason[];
}

interface CreditCheckStepProps {
  onCheckComplete: (idNumber: string) => void;
  status: "idle" | "loading" | "success" | "failed";
  results: CreditCheckResults | null; // Use the new type and allow null
  form: UseFormReturn<any>;
}

export function CreditCheckStep({
  onCheckComplete,
  status,
  results,
  form,
}: CreditCheckStepProps) {
  const handleCheck = async () => {
    const isValid = await form.trigger("id_number");
    if (isValid) {
      const idNumber = form.getValues("id_number");
      onCheckComplete(idNumber);
    }
  };

  return (
    <div className="space-y-6">
      {/* Temporary Notice */}
      {/* <Alert variant="default">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Credit Check Temporarily Disabled</AlertTitle>
        <AlertDescription>
          We're currently collecting your ID number for verification purposes.
          The credit check will be performed later in the application process.
        </AlertDescription>
      </Alert> */}

      <FormField
        control={form.control}
        name="id_number" // Match the schema field name
        render={({ field }) => (
          <FormItem>
            <FormLabel>ID Number *</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter your 13-digit ID number"
                maxLength={13}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button
        onClick={handleCheck}
        disabled={status === "loading"}
        className="w-full"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Validating...
          </>
        ) : (
          "Validate ID Number"
        )}
      </Button>

      {/* Display results with reasons */}
      {status === "success" && results && (
        <Alert variant="default">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>ID Number Validated!</AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              <p>{results.message}</p>
              <p className="text-sm text-green-700 font-medium">
                You can now proceed to the next step.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {status === "failed" && results && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Credit Check Unsuccessful</AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              <p>{results.message}</p>
              {results.score && (
                <div className="flex items-center space-x-2">
                  <span>Your credit score is:</span>
                  <span
                    className={`text-2xl font-bold ${
                      results.score >= 600 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {results.score}
                  </span>
                </div>
              )}
              {results.reasons && results.reasons.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold">
                    Factors that influenced your score:
                  </h4>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {results.reasons.map((reason) => (
                      <li key={reason.reasonCode}>
                        {reason.reasonDescription}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {status === "failed" && !results && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Credit Check Error</AlertTitle>
          <AlertDescription>
            An unexpected error occurred. Please verify your ID number and try
            again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
