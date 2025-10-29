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
    // setIsDownloading(true);
    const response = await fetch(`/dashboard/loans/${loanId}/credit-agreement`);

    if (!response.ok) {
      // Handle error
      console.error("Failed to download credit agreement");
      setIsDownloading(false);
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement("a");
    link.href = url;
    link.download = `credit-agreement-loan-${loanId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
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
