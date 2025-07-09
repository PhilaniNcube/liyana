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
                                {/* Check if content looks like XML */}
                                {file.content &&
                                file.content.trim().startsWith("<") ? (
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">
                                      XML Content:
                                    </p>
                                    <div className="bg-gray-50 rounded p-3 max-h-96 overflow-auto">
                                      <pre className="text-xs whitespace-pre-wrap">
                                        {file.content}
                                      </pre>
                                    </div>
                                  </div>
                                ) : file.type === "json" ||
                                  (file.content &&
                                    file.content.trim().startsWith("{")) ? (
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">
                                      JSON Content:
                                    </p>
                                    <div className="bg-gray-50 rounded p-3 max-h-96 overflow-auto">
                                      <pre className="text-xs whitespace-pre-wrap">
                                        {(() => {
                                          try {
                                            return JSON.stringify(
                                              JSON.parse(file.content),
                                              null,
                                              2
                                            );
                                          } catch (e) {
                                            return file.content;
                                          }
                                        })()}
                                      </pre>
                                    </div>
                                  </div>
                                ) : (
                                  (() => {
                                    // Try to parse as JSON for better formatting
                                    try {
                                      const jsonData = JSON.parse(file.content);

                                      // Check if it's a credit check report
                                      if (jsonData.CC_RESULTS) {
                                        return (
                                          <div className="space-y-4">
                                            <p className="text-sm font-medium text-gray-700 mb-2">
                                              Credit Check Report:
                                            </p>
                                            {/* ...format credit check report... */}
                                            <div className="space-y-6">
                                              {/* Personal Information */}
                                              {jsonData.CC_RESULTS
                                                .EnqCC_DMATCHES &&
                                                jsonData.CC_RESULTS
                                                  .EnqCC_DMATCHES.length >
                                                  0 && (
                                                  <div className="bg-white border rounded-lg p-4">
                                                    <h3 className="font-semibold text-lg mb-3 text-blue-600">
                                                      Personal Information
                                                    </h3>
                                                    {jsonData.CC_RESULTS.EnqCC_DMATCHES.map(
                                                      (
                                                        match: any,
                                                        idx: number
                                                      ) => (
                                                        <div
                                                          key={idx}
                                                          className="grid grid-cols-2 gap-4 text-sm"
                                                        >
                                                          <div>
                                                            <span className="font-medium">
                                                              Full Name:
                                                            </span>
                                                            <p>
                                                              {match.NAME}{" "}
                                                              {match.SURNAME}
                                                            </p>
                                                          </div>
                                                          <div>
                                                            <span className="font-medium">
                                                              ID Number:
                                                            </span>
                                                            <p>
                                                              {match.ID_NUMBER}
                                                            </p>
                                                          </div>
                                                          <div>
                                                            <span className="font-medium">
                                                              Status:
                                                            </span>
                                                            <Badge
                                                              className={
                                                                match.STATUS ===
                                                                "Verified"
                                                                  ? "bg-green-100 text-green-800"
                                                                  : "bg-yellow-100 text-yellow-800"
                                                              }
                                                            >
                                                              {match.STATUS}
                                                            </Badge>
                                                          </div>
                                                          <div>
                                                            <span className="font-medium">
                                                              Country:
                                                            </span>
                                                            <p>
                                                              {
                                                                match.COUNTRY_CODE
                                                              }
                                                            </p>
                                                          </div>
                                                        </div>
                                                      )
                                                    )}
                                                  </div>
                                                )}

                                              {/* Risk Assessment */}
                                              {jsonData.CC_RESULTS
                                                .EnqCC_CompuSCORE &&
                                                jsonData.CC_RESULTS
                                                  .EnqCC_CompuSCORE.length >
                                                  0 && (
                                                  <div className="bg-white border rounded-lg p-4">
                                                    <h3 className="font-semibold text-lg mb-3 text-red-600">
                                                      Risk Assessment
                                                    </h3>
                                                    {jsonData.CC_RESULTS.EnqCC_CompuSCORE.map(
                                                      (
                                                        score: any,
                                                        idx: number
                                                      ) => (
                                                        <div
                                                          key={idx}
                                                          className="space-y-3"
                                                        >
                                                          <div className="flex items-center space-x-4">
                                                            <div>
                                                              <span className="font-medium">
                                                                Risk Level:
                                                              </span>
                                                              <Badge className="ml-2 bg-red-100 text-red-800">
                                                                {
                                                                  score.RISK_TYPE
                                                                }
                                                              </Badge>
                                                            </div>
                                                            <div>
                                                              <span className="font-medium">
                                                                Score:
                                                              </span>
                                                              <span className="ml-2 text-lg font-bold">
                                                                {score.SCORE}
                                                              </span>
                                                            </div>
                                                          </div>
                                                          <div>
                                                            <span className="font-medium">
                                                              Decline Reasons:
                                                            </span>
                                                            <div className="mt-2 space-y-1 text-sm">
                                                              {score.DECLINE_R_1 && (
                                                                <p className="text-red-700">
                                                                  •{" "}
                                                                  {
                                                                    score.DECLINE_R_1
                                                                  }
                                                                </p>
                                                              )}
                                                              {score.DECLINE_R_2 && (
                                                                <p className="text-red-700">
                                                                  •{" "}
                                                                  {
                                                                    score.DECLINE_R_2
                                                                  }
                                                                </p>
                                                              )}
                                                              {score.DECLINE_R_3 && (
                                                                <p className="text-red-700">
                                                                  •{" "}
                                                                  {
                                                                    score.DECLINE_R_3
                                                                  }
                                                                </p>
                                                              )}
                                                              {score.DECLINE_R_4 && (
                                                                <p className="text-red-700">
                                                                  •{" "}
                                                                  {
                                                                    score.DECLINE_R_4
                                                                  }
                                                                </p>
                                                              )}
                                                              {score.DECLINE_R_5 && (
                                                                <p className="text-red-700">
                                                                  •{" "}
                                                                  {
                                                                    score.DECLINE_R_5
                                                                  }
                                                                </p>
                                                              )}
                                                            </div>
                                                          </div>
                                                        </div>
                                                      )
                                                    )}
                                                  </div>
                                                )}

                                              {/* Summary Statistics */}
                                              {jsonData.CC_RESULTS
                                                .NLR_SUMMARY && (
                                                <div className="bg-white border rounded-lg p-4">
                                                  <h3 className="font-semibold text-lg mb-3 text-green-600">
                                                    Account Summary
                                                  </h3>
                                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div className="text-center p-3 bg-blue-50 rounded">
                                                      <div className="text-2xl font-bold text-blue-600">
                                                        {
                                                          jsonData.CC_RESULTS
                                                            .NLR_SUMMARY.Summary
                                                            .NLR_ActiveAccounts
                                                        }
                                                      </div>
                                                      <div className="text-xs text-gray-600">
                                                        NLR Active Accounts
                                                      </div>
                                                    </div>
                                                    <div className="text-center p-3 bg-green-50 rounded">
                                                      <div className="text-2xl font-bold text-green-600">
                                                        {
                                                          jsonData.CC_RESULTS
                                                            .NLR_SUMMARY.Summary
                                                            .CCA_ActiveAccounts
                                                        }
                                                      </div>
                                                      <div className="text-xs text-gray-600">
                                                        CCA Active Accounts
                                                      </div>
                                                    </div>
                                                    <div className="text-center p-3 bg-yellow-50 rounded">
                                                      <div className="text-2xl font-bold text-yellow-600">
                                                        R
                                                        {jsonData.CC_RESULTS.NLR_SUMMARY.Summary.NLR_BalanceExposure?.toLocaleString()}
                                                      </div>
                                                      <div className="text-xs text-gray-600">
                                                        NLR Balance Exposure
                                                      </div>
                                                    </div>
                                                    <div className="text-center p-3 bg-orange-50 rounded">
                                                      <div className="text-2xl font-bold text-orange-600">
                                                        R
                                                        {jsonData.CC_RESULTS.NLR_SUMMARY.Summary.CCA_BalanceExposure?.toLocaleString()}
                                                      </div>
                                                      <div className="text-xs text-gray-600">
                                                        CCA Balance Exposure
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              )}

                                              {/* Recent Addresses */}
                                              {jsonData.CC_RESULTS
                                                .EnqCC_ADDRESS &&
                                                jsonData.CC_RESULTS
                                                  .EnqCC_ADDRESS.length > 0 && (
                                                  <div className="bg-white border rounded-lg p-4">
                                                    <h3 className="font-semibold text-lg mb-3 text-purple-600">
                                                      Recent Addresses
                                                    </h3>
                                                    <div className="space-y-3">
                                                      {jsonData.CC_RESULTS.EnqCC_ADDRESS.slice(
                                                        0,
                                                        3
                                                      ).map(
                                                        (
                                                          addr: any,
                                                          idx: number
                                                        ) => (
                                                          <div
                                                            key={idx}
                                                            className="p-3 bg-gray-50 rounded"
                                                          >
                                                            <div className="flex items-center space-x-2 mb-2">
                                                              <Badge
                                                                className={
                                                                  addr.ADDRESS_TYPE ===
                                                                  "R"
                                                                    ? "bg-blue-100 text-blue-800"
                                                                    : "bg-green-100 text-green-800"
                                                                }
                                                              >
                                                                {addr.ADDRESS_TYPE ===
                                                                "R"
                                                                  ? "Residential"
                                                                  : "Postal"}
                                                              </Badge>
                                                              <span className="text-xs text-gray-600">
                                                                Added:
                                                                {
                                                                  addr.ADDRESS_ADDED_DATE
                                                                }
                                                              </span>
                                                            </div>
                                                            <p className="text-sm">
                                                              {addr.LINE_1}
                                                              {addr.LINE_2 &&
                                                                `, ${addr.LINE_2}`}
                                                              {addr.LINE_3 &&
                                                                `, ${addr.LINE_3}`}
                                                              {addr.LINE_4 &&
                                                                `, ${addr.LINE_4}`}
                                                              {addr.POSTAL_CODE &&
                                                                ` ${addr.POSTAL_CODE}`}
                                                            </p>
                                                          </div>
                                                        )
                                                      )}
                                                    </div>
                                                  </div>
                                                )}

                                              {/* Employment History */}
                                              {jsonData.CC_RESULTS
                                                .EnqCC_EMPLOYER &&
                                                jsonData.CC_RESULTS
                                                  .EnqCC_EMPLOYER.length >
                                                  0 && (
                                                  <div className="bg-white border rounded-lg p-4">
                                                    <h3 className="font-semibold text-lg mb-3 text-indigo-600">
                                                      Employment History
                                                    </h3>
                                                    <div className="space-y-3">
                                                      {jsonData.CC_RESULTS.EnqCC_EMPLOYER.slice(
                                                        0,
                                                        3
                                                      ).map(
                                                        (
                                                          emp: any,
                                                          idx: number
                                                        ) => (
                                                          <div
                                                            key={idx}
                                                            className="p-3 bg-gray-50 rounded"
                                                          >
                                                            <div className="flex justify-between items-start mb-2">
                                                              <h4 className="font-medium">
                                                                {emp.EMP_NAME}
                                                              </h4>
                                                              <span className="text-xs text-gray-600">
                                                                {emp.EMP_DATE}
                                                              </span>
                                                            </div>
                                                            {emp.OCCUPATION &&
                                                              emp.OCCUPATION.trim() && (
                                                                <p className="text-sm text-gray-700">
                                                                  Position:{" "}
                                                                  {
                                                                    emp.OCCUPATION
                                                                  }
                                                                </p>
                                                              )}
                                                          </div>
                                                        )
                                                      )}
                                                    </div>
                                                  </div>
                                                )}

                                              {/* Active Accounts */}
                                              {jsonData.CC_RESULTS
                                                .EnqCC_CPA_ACCOUNTS &&
                                                jsonData.CC_RESULTS
                                                  .EnqCC_CPA_ACCOUNTS.length >
                                                  0 && (
                                                  <div className="bg-white border rounded-lg p-4">
                                                    <h3 className="font-semibold text-lg mb-3 text-orange-600">
                                                      Active CPA Accounts
                                                    </h3>
                                                    <div className="space-y-3">
                                                      {jsonData.CC_RESULTS.EnqCC_CPA_ACCOUNTS.filter(
                                                        (acc: any) =>
                                                          acc.STATUS_CODE_DESC ===
                                                          "OPEN/CURRENT"
                                                      )
                                                        .slice(0, 5)
                                                        .map(
                                                          (
                                                            acc: any,
                                                            idx: number
                                                          ) => (
                                                            <div
                                                              key={idx}
                                                              className="p-3 bg-gray-50 rounded"
                                                            >
                                                              <div className="flex justify-between items-start mb-2">
                                                                <h4 className="font-medium">
                                                                  {
                                                                    acc.SUBSCRIBER_NAME
                                                                  }
                                                                </h4>
                                                                <Badge
                                                                  className={
                                                                    parseFloat(
                                                                      acc.OVERDUE_AMOUNT
                                                                    ) > 0
                                                                      ? "bg-red-100 text-red-800"
                                                                      : "bg-green-100 text-green-800"
                                                                  }
                                                                >
                                                                  {
                                                                    acc.STATUS_CODE_DESC
                                                                  }
                                                                </Badge>
                                                              </div>
                                                              <div className="grid grid-cols-2 gap-2 text-sm">
                                                                <div>
                                                                  <span className="text-gray-600">
                                                                    Current
                                                                    Balance:
                                                                  </span>
                                                                  <p className="font-medium">
                                                                    R
                                                                    {parseFloat(
                                                                      acc.CURRENT_BAL
                                                                    ).toLocaleString()}
                                                                  </p>
                                                                </div>
                                                                <div>
                                                                  <span className="text-gray-600">
                                                                    Overdue:
                                                                  </span>
                                                                  <p
                                                                    className={`font-medium ${parseFloat(acc.OVERDUE_AMOUNT) > 0 ? "text-red-600" : "text-green-600"}`}
                                                                  >
                                                                    R
                                                                    {parseFloat(
                                                                      acc.OVERDUE_AMOUNT
                                                                    ).toLocaleString()}
                                                                  </p>
                                                                </div>
                                                                <div>
                                                                  <span className="text-gray-600">
                                                                    Account
                                                                    Type:
                                                                  </span>
                                                                  <p className="font-medium">
                                                                    {
                                                                      acc.ACCOUNT_TYPE
                                                                    }
                                                                  </p>
                                                                </div>
                                                                <div>
                                                                  <span className="text-gray-600">
                                                                    Payment
                                                                    History:
                                                                  </span>
                                                                  <p className="font-medium">
                                                                    {
                                                                      acc.PAYMENT_HISTORY_24
                                                                    }
                                                                  </p>
                                                                </div>
                                                              </div>
                                                            </div>
                                                          )
                                                        )}
                                                    </div>
                                                  </div>
                                                )}

                                              {/* Recent Enquiries */}
                                              {jsonData.CC_RESULTS
                                                .EnqCC_PREVENQ &&
                                                jsonData.CC_RESULTS
                                                  .EnqCC_PREVENQ.length > 0 && (
                                                  <div className="bg-white border rounded-lg p-4">
                                                    <h3 className="font-semibold text-lg mb-3 text-gray-600">
                                                      Recent Credit Enquiries
                                                    </h3>
                                                    <div className="space-y-2">
                                                      {jsonData.CC_RESULTS.EnqCC_PREVENQ.slice(
                                                        0,
                                                        5
                                                      ).map(
                                                        (
                                                          enq: any,
                                                          idx: number
                                                        ) => (
                                                          <div
                                                            key={idx}
                                                            className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm"
                                                          >
                                                            <span>
                                                              {
                                                                enq.SUBSCRIBER_NAME
                                                              }
                                                            </span>
                                                            <span className="text-gray-600">
                                                              {enq.ENQUIRY_DATE}
                                                            </span>
                                                          </div>
                                                        )
                                                      )}
                                                    </div>
                                                  </div>
                                                )}

                                              {/* Raw Data Toggle */}
                                              <details className="bg-white border rounded-lg p-4">
                                                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                                                  View Raw JSON Data
                                                </summary>
                                                <pre className="text-xs bg-gray-50 p-3 rounded mt-3 max-h-96 overflow-auto">
                                                  {JSON.stringify(
                                                    jsonData,
                                                    null,
                                                    2
                                                  )}
                                                </pre>
                                              </details>
                                            </div>
                                          </div>
                                        );
                                      }

                                      // For other JSON data, show formatted JSON
                                      return (
                                        <div>
                                          <p className="text-sm font-medium text-gray-700 mb-2">
                                            JSON Content:
                                          </p>
                                          <div className="bg-gray-50 rounded p-3 max-h-96 overflow-auto">
                                            <pre className="text-xs whitespace-pre-wrap">
                                              {JSON.stringify(
                                                jsonData,
                                                null,
                                                2
                                              )}
                                            </pre>
                                          </div>
                                        </div>
                                      );
                                    } catch (parseError) {
                                      // If not valid JSON, show as plain text
                                      return (
                                        <div>
                                          <p className="text-sm font-medium text-gray-700 mb-2">
                                            File Content:
                                          </p>
                                          <div className="bg-gray-50 rounded p-3 max-h-96 overflow-auto">
                                            <pre className="text-xs whitespace-pre-wrap">
                                              {file.content}
                                            </pre>
                                          </div>
                                        </div>
                                      );
                                    }
                                  })()
                                )}
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

                  {fraudCheckResults.pRetData.firstBytes && (
                    <details className="mt-3">
                      <summary className="text-xs cursor-pointer text-gray-600 hover:text-gray-800">
                        View First Bytes (Debug Info)
                      </summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                        {fraudCheckResults.pRetData.firstBytes
                          .map(
                            (byte: number, i: number) =>
                              `${i}: 0x${byte.toString(16).padStart(2, "0")} (${byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : "?"})`
                          )
                          .join("\n")}
                      </pre>
                    </details>
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

        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            View Full Raw Response
          </summary>
          <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto mt-2">
            {JSON.stringify(fraudCheckResults, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}
