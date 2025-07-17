import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

interface FraudCheckResultsProps {
  fraudCheckResults: any;
}

export function FraudCheckResults({
  fraudCheckResults,
}: FraudCheckResultsProps) {
  // Don't render if there are no results
  if (!fraudCheckResults) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Fraud Check Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fraudCheckResults.pTransactionCompleted !== undefined && (
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Transaction Status:</span>
            <Badge
              className={
                fraudCheckResults.pTransactionCompleted
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }
            >
              {fraudCheckResults.pTransactionCompleted ? "Completed" : "Failed"}
            </Badge>
          </div>
        )}

        {fraudCheckResults.pRetData && (
          <div>
            <h4 className="font-semibold mb-2">Fraud Check Report:</h4>
            <div className="space-y-3">
              {typeof fraudCheckResults.pRetData === "object" &&
              fraudCheckResults.pRetData.type ? (
                // Handle structured ZIP/error data
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-sm font-medium">Data Type:</span>
                    <Badge
                      className={
                        fraudCheckResults.pRetData.type === "ZIP_EXTRACTED"
                          ? "bg-green-100 text-green-800"
                          : fraudCheckResults.pRetData.type === "ZIP_FILE"
                            ? "bg-blue-100 text-blue-800"
                            : fraudCheckResults.pRetData.type === "ERROR_CODE"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {fraudCheckResults.pRetData.type}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-700 mb-3">
                    {fraudCheckResults.pRetData.message}
                  </p>

                  {fraudCheckResults.pRetData.byteLength && (
                    <p className="text-xs text-gray-600 mb-2">
                      Data Length: {fraudCheckResults.pRetData.byteLength} bytes
                    </p>
                  )}

                  {fraudCheckResults.pRetData.type === "ZIP_EXTRACTED" && (
                    <div className="mt-3 space-y-4">
                      <div className="p-3 bg-green-50 rounded">
                        <p className="text-sm text-green-800 font-medium mb-2">
                          ✅ ZIP File Successfully Extracted
                        </p>
                        <p className="text-xs text-green-700">
                          Found {fraudCheckResults.pRetData.fileCount} file(s)
                          in the ZIP archive.
                        </p>
                      </div>

                      {fraudCheckResults.pRetData.extractedFiles?.map(
                        (file: any, index: number) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-medium text-gray-900">
                                {file.name}
                              </h5>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline">
                                  {file.type?.toUpperCase() || "TEXT"}
                                </Badge>
                                <Badge variant="outline">
                                  {file.size
                                    ? `${file.size} ${file.type === "pdf" ? "bytes" : "chars"}`
                                    : "Error"}
                                </Badge>
                              </div>
                            </div>

                            {file.error ? (
                              <div className="p-3 bg-red-50 rounded">
                                <p className="text-sm text-red-800">
                                  Error extracting file:
                                </p>
                                <p className="text-xs text-red-700">
                                  {file.error}
                                </p>
                              </div>
                            ) : file.type === "pdf" ? (
                              <div className="space-y-3">
                                <div className="p-3 bg-blue-50 rounded">
                                  <p className="text-sm text-blue-800 font-medium mb-2">
                                    📄 PDF Document
                                  </p>
                                  <p className="text-xs text-blue-700 mb-3">
                                    This PDF contains the detailed fraud check
                                    report.
                                  </p>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        const pdfBlob = new Blob(
                                          [
                                            new Uint8Array(
                                              atob(file.content)
                                                .split("")
                                                .map((char) =>
                                                  char.charCodeAt(0)
                                                )
                                            ),
                                          ],
                                          { type: "application/pdf" }
                                        );
                                        const pdfUrl =
                                          URL.createObjectURL(pdfBlob);
                                        window.open(pdfUrl, "_blank");
                                      }}
                                    >
                                      View PDF
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const pdfBlob = new Blob(
                                          [
                                            new Uint8Array(
                                              atob(file.content)
                                                .split("")
                                                .map((char) =>
                                                  char.charCodeAt(0)
                                                )
                                            ),
                                          ],
                                          { type: "application/pdf" }
                                        );
                                        const pdfUrl =
                                          URL.createObjectURL(pdfBlob);
                                        const link =
                                          document.createElement("a");
                                        link.href = pdfUrl;
                                        link.download = file.name;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                        URL.revokeObjectURL(pdfUrl);
                                      }}
                                    >
                                      Download PDF
                                    </Button>
                                  </div>
                                </div>

                                {/* Embedded PDF Viewer */}
                                <div className="bg-gray-100 rounded p-4">
                                  <p className="text-sm font-medium text-gray-700 mb-2">
                                    PDF Preview:
                                  </p>
                                  <div className="bg-white rounded border">
                                    <embed
                                      src={`data:application/pdf;base64,${file.content}`}
                                      type="application/pdf"
                                      width="100%"
                                      height="600px"
                                      className="rounded"
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="p-3 bg-gray-50 rounded">
                                  <p className="text-sm text-gray-700">
                                    Non-PDF document found. Only PDF documents
                                    are displayed in this view.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {fraudCheckResults.pRetData.type === "ZIP_FILE" && (
                    <div className="mt-3 p-3 bg-blue-50 rounded">
                      <p className="text-sm text-blue-800 font-medium mb-2">
                        ⚠️ ZIP File Detected - Manual Extraction Required
                      </p>
                      <p className="text-xs text-blue-700">
                        This file contains XML data in ZIP format. You may need
                        to download and extract it manually to view the full
                        fraud check report.
                      </p>
                    </div>
                  )}

                  {fraudCheckResults.pRetData.error && (
                    <div className="mt-3 p-3 bg-red-50 rounded">
                      <p className="text-sm text-red-800 font-medium">Error:</p>
                      <p className="text-xs text-red-700">
                        {fraudCheckResults.pRetData.error}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                // Handle regular string data
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap overflow-x-auto">
                    {typeof fraudCheckResults.pRetData === "string"
                      ? fraudCheckResults.pRetData
                      : JSON.stringify(fraudCheckResults.pRetData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
