"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cancelPreApplication } from "@/lib/actions/cancel-pre-application";
import { toast } from "sonner";

interface CancelPreApplicationButtonProps {
  preApplicationId: number;
  userName: string;
}

export function CancelPreApplicationButton({
  preApplicationId,
  userName,
}: CancelPreApplicationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      const result = await cancelPreApplication(preApplicationId);

      if (result.success) {
        toast.success(
          result.message || "Pre-application cancelled successfully"
        );
      } else {
        toast.error(result.error || "Failed to cancel pre-application");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error cancelling pre-application:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
          Cancel
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Pre-Application</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel the pre-application for{" "}
            <strong>{userName}</strong>? This action cannot be undone. The user
            will no longer appear in the incomplete applications list.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            className="bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              "Yes, Cancel"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
