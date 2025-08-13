"use client";

import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { useState } from "react";

interface DownloadCreditAgreementButtonProps {
  loanId: number;
}

export function DownloadCreditAgreementButton({
  loanId,
}: DownloadCreditAgreementButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadCreditAgreement = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/loans/${loanId}/credit-agreement`);

      if (!response.ok) {
        throw new Error("Failed to download credit agreement");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `credit-agreement-loan-${loanId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading credit agreement:", error);
      alert("Failed to download credit agreement. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownloadCreditAgreement}
      disabled={isDownloading}
      variant="outline"
      size="sm"
    >
      {isDownloading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Downloading...
        </>
      ) : (
        <>
          <FileText className="h-4 w-4 mr-2" />
          Download Credit Agreement
        </>
      )}
    </Button>
  );
}
