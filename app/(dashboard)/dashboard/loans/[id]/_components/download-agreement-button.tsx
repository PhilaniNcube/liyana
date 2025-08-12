"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

interface DownloadAgreementButtonProps {
  loanId: number;
}

export function DownloadAgreementButton({
  loanId,
}: DownloadAgreementButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPreAgreement = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/loans/${loanId}/agreement`);

      if (!response.ok) {
        throw new Error("Failed to download pre-agreement");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pre-agreement-loan-${loanId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading pre-agreement:", error);
      alert("Failed to download pre-agreement. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownloadPreAgreement}
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
          <Download className="h-4 w-4 mr-2" />
          Download Pre-Agreement
        </>
      )}
    </Button>
  );
}
