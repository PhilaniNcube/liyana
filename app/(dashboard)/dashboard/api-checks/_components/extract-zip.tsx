"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getApiCheckStatusColor,
  handleZipExtraction,
  isBase64Zip,
} from "@/lib/utils";
import { ApiCheck } from "@/lib/schemas";
import { Download, Loader2 } from "lucide-react";
import React, { useState } from "react";

const ExtractZip = ({ check }: { check: ApiCheck }) => {
  const [extractingZip, setExtractingZip] = useState<number | null>(null);

  return (
    <div className="flex items-center space-x-2">
      {/* Extract ZIP button for Credit Checks with ZIP data */}
      {check.check_type === "fraud_check" &&
        check.response_payload?.pRetData &&
        isBase64Zip(check.response_payload.pRetData) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZipExtraction(check, setExtractingZip)}
            disabled={extractingZip === check.id}
            className="flex items-center space-x-1"
          >
            {extractingZip === check.id ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Extracting...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Extract PDF</span>
              </>
            )}
          </Button>
        )}
      <Badge className={getApiCheckStatusColor(check.status)}>
        {check.status.toUpperCase()}
      </Badge>
    </div>
  );
};

export default ExtractZip;
