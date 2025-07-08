"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  User,
  Building,
  CreditCard,
  Phone,
  Mail,
  Shield,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import JSZip from "jszip";

interface Application {
  id: number;
  user_id: string;
  id_number: string;
  id_number_decrypted: string;
  created_at: string;
  updated_at: string;
  status: string;
  date_of_birth: string | null;
  gender: string | null;
  gender_other: string | null;
  marital_status: string | null;
  nationality: string | null;
  language: string | null;
  dependants: number | null;
  home_address: string | null;
  city: string | null;
  postal_code: string | null;
  phone_number: string | null;
  next_of_kin_name: string | null;
  next_of_kin_phone_number: string | null;
  next_of_kin_email: string | null;
  employment_type: string | null;
  monthly_income: number | null;
  job_title: string | null;
  work_experience: string | null;
  employer_name: string | null;
  employer_address: string | null;
  employer_contact_number: string | null;
  employment_end_date: string | null;
  application_amount: number | null;
  term: number;
  loan_purpose: string | null;
  loan_purpose_reason: string | null;
  bank_name: string | null;
  bank_account_type: string | null;
  bank_account_holder: string | null;
  branch_code: string | null;
  bank_account_number: string | null;
  affordability: any;
  decline_reason: any;
  profile?: {
    full_name: string;
  } | null;
}

interface ApplicationDetailClientProps {
  application: Application;
}

export function ApplicationDetailClient({
  application,
}: ApplicationDetailClientProps) {
  const [isRunningFraudCheck, setIsRunningFraudCheck] = useState(false);
  const [fraudCheckResults, setFraudCheckResults] = useState<any>(null);

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  };

  const formatAffordabilityIncomeStatement = (affordability: any) => {
    if (!affordability) return null;

    // Handle the structured format (income/deductions/expenses arrays)
    if (
      affordability.income ||
      affordability.deductions ||
      affordability.expenses
    ) {
      const totalIncome =
        affordability.income?.reduce(
          (sum: number, item: any) => sum + (item.amount || 0),
          0
        ) || 0;
      const totalDeductions =
        affordability.deductions?.reduce(
          (sum: number, item: any) => sum + (item.amount || 0),
          0
        ) || 0;
      const totalExpenses =
        affordability.expenses?.reduce(
          (sum: number, item: any) => sum + (item.amount || 0),
          0
        ) || 0;
      const netIncome = totalIncome - totalDeductions;
      const disposableIncome = netIncome - totalExpenses;

      return {
        structured: true,
        income: affordability.income || [],
        deductions: affordability.deductions || [],
        expenses: affordability.expenses || [],
        totalIncome,
        totalDeductions,
        totalExpenses,
        netIncome,
        disposableIncome,
      };
    }

    // Fallback for any other format - treat as raw data
    return {
      structured: false,
      rawData: affordability,
    };
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "declined":
        return "bg-red-100 text-red-800";
      case "in_review":
        return "bg-yellow-100 text-yellow-800";
      case "pending_documents":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDateForAPI = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0].replace(/-/g, "");
  };

  const getFileMimeType = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return "application/pdf";
      case "json":
        return "application/json";
      case "xml":
        return "application/xml";
      case "txt":
        return "text/plain";
      default:
        return "text/plain";
    }
  };

  const handleFraudCheck = async () => {
    setIsRunningFraudCheck(true);
    try {
      const requestBody = {
        idNumber: application.id_number_decrypted,
        forename: application.profile?.full_name?.split(" ")[0] || "",
        surname:
          application.profile?.full_name?.split(" ").slice(1).join(" ") || "",
        gender:
          application.gender === "male"
            ? "M"
            : application.gender === "female"
              ? "F"
              : "",
        dateOfBirth: formatDateForAPI(application.date_of_birth),
        address1: application.home_address?.split(",")[0] || "",
        address2: application.home_address?.split(",")[1] || "",
        address3: application.home_address?.split(",")[2] || "",
        address4: application.city || "",
        postalCode: application.postal_code || "",
        homeTelCode: application.phone_number?.startsWith("0")
          ? application.phone_number.substring(1, 3)
          : "",
        homeTelNo: application.phone_number?.startsWith("0")
          ? application.phone_number.substring(3)
          : application.phone_number || "",
        workTelNo: application.employer_contact_number || "",
        cellTelNo: application.phone_number || "",
        workTelCode: application.employer_contact_number?.startsWith("0")
          ? application.employer_contact_number.substring(1, 3)
          : "",
      };

      const response = await fetch("/api/kyc/fraud-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to run fraud check");
      }

      const data = await response.json();

      // Decode the Base64 string if it exists
      if (data.pRetData && typeof data.pRetData === "string") {
        try {
          // Step 1: Decode Base64 to binary data
          const binaryString = atob(data.pRetData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          console.log("Decoded bytes length:", bytes.length);
          console.log("First few bytes:", Array.from(bytes.slice(0, 10)));

          // Step 2: Verify it's a valid ZIP file by checking first 2 bytes are "PK"
          if (bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b) {
            console.log("Valid ZIP file detected (PK signature found)");

            // Step 3: Extract ZIP contents using JSZip
            try {
              const zip = new JSZip();
              const zipContents = await zip.loadAsync(bytes);

              console.log("ZIP loaded successfully");
              console.log("Files in ZIP:", Object.keys(zipContents.files));

              const extractedFiles: any[] = [];

              // Extract all files from the ZIP
              for (const fileName of Object.keys(zipContents.files)) {
                const file = zipContents.files[fileName];
                if (!file.dir) {
                  // Skip directories
                  try {
                    const fileExtension = fileName
                      .split(".")
                      .pop()
                      ?.toLowerCase();

                    // Handle different file types
                    if (fileExtension === "pdf") {
                      // Extract PDF as binary data
                      const content = await file.async("base64");
                      const binarySize = content.length * 0.75; // Approximate binary size
                      console.log(
                        `Extracted PDF file: ${fileName}, size: ${binarySize} bytes`
                      );

                      extractedFiles.push({
                        name: fileName,
                        content: content,
                        size: Math.round(binarySize),
                        type: "pdf",
                        mimeType: "application/pdf",
                      });
                    } else {
                      // Extract other files as text
                      const content = await file.async("string");
                      console.log(
                        `Extracted file: ${fileName}, size: ${content.length}`
                      );

                      extractedFiles.push({
                        name: fileName,
                        content: content,
                        size: content.length,
                        type: fileExtension || "text",
                        mimeType: getFileMimeType(fileName),
                      });
                    }
                  } catch (fileError) {
                    console.error(
                      `Error extracting file ${fileName}:`,
                      fileError
                    );
                    extractedFiles.push({
                      name: fileName,
                      error:
                        fileError instanceof Error
                          ? fileError.message
                          : String(fileError),
                      size: 0,
                      type: "error",
                    });
                  }
                }
              }

              data.pRetData = {
                type: "ZIP_EXTRACTED",
                message: `ZIP file successfully extracted. Found ${extractedFiles.length} file(s).`,
                byteLength: bytes.length,
                extractedFiles: extractedFiles,
                fileCount: extractedFiles.length,
              };

              console.log("ZIP extraction completed successfully");
            } catch (zipError) {
              console.error("Error processing ZIP file:", zipError);
              data.pRetData = {
                type: "ZIP_ERROR",
                message: "Valid ZIP file detected but extraction failed",
                error:
                  zipError instanceof Error
                    ? zipError.message
                    : String(zipError),
                byteLength: bytes.length,
              };
            }
          } else if (bytes.length < 5) {
            console.log("Error code detected (less than 5 bytes)");
            data.pRetData = {
              type: "ERROR_CODE",
              message: "Error code returned (less than 5 bytes)",
              byteLength: bytes.length,
              errorBytes: Array.from(bytes),
            };
          } else {
            console.log("Unknown format - not a valid ZIP file");
            data.pRetData = {
              type: "UNKNOWN_FORMAT",
              message: "Data is not a valid ZIP file (missing PK signature)",
              byteLength: bytes.length,
              firstBytes: Array.from(bytes.slice(0, 20)),
            };
          }
        } catch (decodeError) {
          console.error("Error decoding Base64 pRetData:", decodeError);
          data.pRetData = {
            type: "DECODE_ERROR",
            message: "Failed to decode Base64 data",
            error:
              decodeError instanceof Error
                ? decodeError.message
                : String(decodeError),
          };
        }
      }

      setFraudCheckResults(data);
      toast.success("Fraud check completed successfully");
    } catch (error) {
      console.error("Fraud check error:", error);
      toast.error("Failed to run fraud check");
    } finally {
      setIsRunningFraudCheck(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/applications">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              Application #{application.id}
            </h1>
            <p className="text-muted-foreground">
              {application.profile?.full_name && (
                <span className="font-medium">
                  {application.profile.full_name} •{" "}
                </span>
              )}
              Created on {formatDate(application.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleFraudCheck}
            disabled={isRunningFraudCheck}
            variant="outline"
            size="sm"
          >
            {isRunningFraudCheck ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Fraud Check...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Run Fraud Check
              </>
            )}
          </Button>
          <Badge className={getStatusColor(application.status)}>
            {application.status.replace("_", " ").toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Fraud Check Results */}
      {fraudCheckResults && (
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
                  {fraudCheckResults.pTransactionCompleted
                    ? "Completed"
                    : "Failed"}
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
                                : fraudCheckResults.pRetData.type ===
                                    "ERROR_CODE"
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
                          Data Length: {fraudCheckResults.pRetData.byteLength}{" "}
                          bytes
                        </p>
                      )}

                      {fraudCheckResults.pRetData.type === "ZIP_EXTRACTED" && (
                        <div className="mt-3 space-y-4">
                          <div className="p-3 bg-green-50 rounded">
                            <p className="text-sm text-green-800 font-medium mb-2">
                              ✅ ZIP File Successfully Extracted
                            </p>
                            <p className="text-xs text-green-700">
                              Found {fraudCheckResults.pRetData.fileCount}{" "}
                              file(s) in the ZIP archive.
                            </p>
                          </div>

                          {fraudCheckResults.pRetData.extractedFiles?.map(
                            (file: any, index: number) => (
                              <div
                                key={index}
                                className="border rounded-lg p-4"
                              >
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
                                        This PDF contains the detailed fraud
                                        check report.
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
                                          const jsonData = JSON.parse(
                                            file.content
                                          );

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
                                                                  {
                                                                    match.SURNAME
                                                                  }
                                                                </p>
                                                              </div>
                                                              <div>
                                                                <span className="font-medium">
                                                                  ID Number:
                                                                </span>
                                                                <p>
                                                                  {
                                                                    match.ID_NUMBER
                                                                  }
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
                                                                    {
                                                                      score.SCORE
                                                                    }
                                                                  </span>
                                                                </div>
                                                              </div>
                                                              <div>
                                                                <span className="font-medium">
                                                                  Decline
                                                                  Reasons:
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
                                                              jsonData
                                                                .CC_RESULTS
                                                                .NLR_SUMMARY
                                                                .Summary
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
                                                              jsonData
                                                                .CC_RESULTS
                                                                .NLR_SUMMARY
                                                                .Summary
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
                                                      .EnqCC_ADDRESS.length >
                                                      0 && (
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
                                                                    Added:{" "}
                                                                    {
                                                                      addr.ADDR_DATE_CREATED
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
                                                                    {
                                                                      emp.EMP_NAME
                                                                    }
                                                                  </h4>
                                                                  <span className="text-xs text-gray-600">
                                                                    {
                                                                      emp.EMP_DATE
                                                                    }
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
                                                      .EnqCC_CPA_ACCOUNTS
                                                      .length > 0 && (
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
                                                                      <p>
                                                                        {
                                                                          acc.ACCOUNT_TYPE_DESC
                                                                        }
                                                                      </p>
                                                                    </div>
                                                                    <div>
                                                                      <span className="text-gray-600">
                                                                        Opened:
                                                                      </span>
                                                                      <p>
                                                                        {
                                                                          acc.OPEN_DATE
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
                                                      .EnqCC_PREVENQ.length >
                                                      0 && (
                                                      <div className="bg-white border rounded-lg p-4">
                                                        <h3 className="font-semibold text-lg mb-3 text-gray-600">
                                                          Recent Credit
                                                          Enquiries
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
                                                                <div>
                                                                  <span className="font-medium">
                                                                    {
                                                                      enq.BRANCH_NAME
                                                                    }
                                                                  </span>
                                                                  <span className="text-gray-600 ml-2">
                                                                    (
                                                                    {
                                                                      enq.CONTACT_PERSON
                                                                    }
                                                                    )
                                                                  </span>
                                                                </div>
                                                                <span className="text-gray-600">
                                                                  {
                                                                    enq.ENQUIRY_DATE
                                                                  }
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
                            This file contains XML data in ZIP format. You may
                            need to download and extract it manually to view the
                            full fraud check report.
                          </p>
                        </div>
                      )}

                      {fraudCheckResults.pRetData.error && (
                        <div className="mt-3 p-3 bg-red-50 rounded">
                          <p className="text-sm text-red-800 font-medium">
                            Error:
                          </p>
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
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {application.profile && (
              <>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    Applicant Name
                  </p>
                  <p className="text-lg font-semibold text-blue-800">
                    {application.profile.full_name || "Name not provided"}
                  </p>
                </div>
                <Separator />
              </>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  ID Number
                </p>
                <p className="text-sm">
                  {application.id_number_decrypted || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Date of Birth
                </p>
                <p className="text-sm">
                  {formatDate(application.date_of_birth)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Gender
                </p>
                <p className="text-sm">
                  {application.gender || application.gender_other || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Marital Status
                </p>
                <p className="text-sm">{application.marital_status || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Nationality
                </p>
                <p className="text-sm">{application.nationality || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Language
                </p>
                <p className="text-sm">{application.language || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Dependants
                </p>
                <p className="text-sm">{application.dependants || "N/A"}</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Home Address
              </p>
              <p className="text-sm">{application.home_address || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">City</p>
              <p className="text-sm">{application.city || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Postal Code
              </p>
              <p className="text-sm">{application.postal_code || "N/A"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="h-5 w-5 mr-2" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Phone Number
              </p>
              <p className="text-sm">{application.phone_number || "N/A"}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Next of Kin
              </p>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Name
                  </p>
                  <p className="text-sm capitalize">
                    {application.next_of_kin_name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Phone
                  </p>
                  <p className="text-sm">
                    {application.next_of_kin_phone_number || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Email
                  </p>
                  <p className="text-sm">
                    {application.next_of_kin_email || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Employment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Employment Type
                </p>
                <p className="text-sm">
                  {application.employment_type || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Monthly Income
                </p>
                <p className="text-sm">
                  {formatCurrency(application.monthly_income)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Job Title
                </p>
                <p className="text-sm">{application.job_title || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Work Experience
                </p>
                <p className="text-sm">
                  {application.work_experience || "N/A"}
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Employer Name
              </p>
              <p className="text-sm">{application.employer_name || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Employer Address
              </p>
              <p className="text-sm">{application.employer_address || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Employer Contact
              </p>
              <p className="text-sm">
                {application.employer_contact_number || "N/A"}
              </p>
            </div>
            {application.employment_end_date && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Employment End Date
                </p>
                <p className="text-sm">
                  {formatDate(application.employment_end_date)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loan & Banking Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Loan & Banking Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Loan Amount
                </p>
                <p className="text-sm font-semibold">
                  {formatCurrency(application.application_amount)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Loan Term
                </p>
                <p className="text-sm">{application.term} days</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Loan Purpose
              </p>
              <p className="text-sm">{application.loan_purpose || "N/A"}</p>
            </div>
            {application.loan_purpose_reason && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Loan Purpose Reason
                </p>
                <p className="text-sm">{application.loan_purpose_reason}</p>
              </div>
            )}
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Bank Name
                </p>
                <p className="text-sm">{application.bank_name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Account Type
                </p>
                <p className="text-sm">
                  {application.bank_account_type || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Account Holder
                </p>
                <p className="text-sm">
                  {application.bank_account_holder || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Branch Code
                </p>
                <p className="text-sm">{application.branch_code || "N/A"}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Account Number
              </p>
              <p className="text-sm">
                {application.bank_account_number || "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      {(application.affordability || application.decline_reason) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {application.affordability && (
              <div>
                <h4 className="font-semibold mb-4">Affordability Assessment</h4>
                {(() => {
                  const incomeStatement = formatAffordabilityIncomeStatement(
                    application.affordability
                  );
                  if (!incomeStatement) {
                    return (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">
                          No affordability data available for this application.
                        </p>
                      </div>
                    );
                  }

                  // Render structured format (like in profile page)
                  if (incomeStatement.structured) {
                    return (
                      <Card className="bg-muted/50">
                        <CardHeader>
                          <CardTitle className="text-lg">
                            Financial Summary
                          </CardTitle>
                          <CardDescription>
                            Monthly income sources, deductions, and expenses as
                            provided
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Income Section */}
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h5 className="font-semibold text-green-600">
                                Income Sources
                              </h5>
                            </div>
                            <div className="space-y-3">
                              {incomeStatement.income &&
                              incomeStatement.income.length > 0 ? (
                                incomeStatement.income
                                  .filter(
                                    (item: any) =>
                                      item.amount > 0 || item.type.trim() !== ""
                                  )
                                  .map((item: any, index: number) => (
                                    <div
                                      key={index}
                                      className="flex justify-between items-center py-2 border-b border-muted"
                                    >
                                      <span className="text-sm">
                                        {item.type || "Unnamed Income"}
                                      </span>
                                      <span className="font-medium text-green-600">
                                        {formatCurrency(item.amount || 0)
                                          ?.replace("ZAR", "")
                                          .trim()}
                                      </span>
                                    </div>
                                  ))
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  No income sources recorded
                                </p>
                              )}
                              <div className="flex justify-between border-t pt-3 mt-3">
                                <span className="font-semibold">
                                  Total Income:
                                </span>
                                <span className="font-semibold text-green-600">
                                  {formatCurrency(incomeStatement.totalIncome)
                                    ?.replace("ZAR", "")
                                    .trim()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Deductions Section */}
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h5 className="font-semibold text-orange-600">
                                Deductions
                              </h5>
                            </div>
                            <div className="space-y-3">
                              {incomeStatement.deductions &&
                              incomeStatement.deductions.length > 0 ? (
                                incomeStatement.deductions
                                  .filter(
                                    (item: any) =>
                                      item.amount > 0 || item.type.trim() !== ""
                                  )
                                  .map((item: any, index: number) => (
                                    <div
                                      key={index}
                                      className="flex justify-between items-center py-2 border-b border-muted"
                                    >
                                      <span className="text-sm">
                                        {item.type || "Unnamed Deduction"}
                                      </span>
                                      <span className="font-medium text-orange-600">
                                        {formatCurrency(item.amount || 0)
                                          ?.replace("ZAR", "")
                                          .trim()}
                                      </span>
                                    </div>
                                  ))
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  No deductions recorded
                                </p>
                              )}
                              <div className="flex justify-between border-t pt-3 mt-3">
                                <span className="font-semibold">
                                  Total Deductions:
                                </span>
                                <span className="font-semibold text-orange-600">
                                  {formatCurrency(
                                    incomeStatement.totalDeductions
                                  )
                                    ?.replace("ZAR", "")
                                    .trim()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Expenses Section */}
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h5 className="font-semibold text-red-600">
                                Monthly Expenses
                              </h5>
                            </div>
                            <div className="space-y-3">
                              {incomeStatement.expenses &&
                              incomeStatement.expenses.length > 0 ? (
                                incomeStatement.expenses
                                  .filter(
                                    (item: any) =>
                                      item.amount > 0 || item.type.trim() !== ""
                                  )
                                  .map((item: any, index: number) => (
                                    <div
                                      key={index}
                                      className="flex justify-between items-center py-2 border-b border-muted"
                                    >
                                      <span className="text-sm">
                                        {item.type || "Unnamed Expense"}
                                      </span>
                                      <span className="font-medium text-red-600">
                                        {formatCurrency(item.amount || 0)
                                          ?.replace("ZAR", "")
                                          .trim()}
                                      </span>
                                    </div>
                                  ))
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  No expenses recorded
                                </p>
                              )}
                              <div className="flex justify-between border-t pt-3 mt-3">
                                <span className="font-semibold">
                                  Total Expenses:
                                </span>
                                <span className="font-semibold text-red-600">
                                  {formatCurrency(incomeStatement.totalExpenses)
                                    ?.replace("ZAR", "")
                                    .trim()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Summary */}
                          <div className="bg-background rounded-lg p-4 space-y-2 border">
                            <h5 className="font-semibold text-lg mb-3">
                              Financial Summary
                            </h5>
                            <div className="flex justify-between">
                              <span>Total Income:</span>
                              <span className="font-semibold text-green-600">
                                {formatCurrency(incomeStatement.totalIncome)
                                  ?.replace("ZAR", "")
                                  .trim()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Deductions:</span>
                              <span className="font-semibold text-orange-600">
                                {formatCurrency(incomeStatement.totalDeductions)
                                  ?.replace("ZAR", "")
                                  .trim()}
                              </span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                              <span>Net Income:</span>
                              <span className="font-semibold">
                                {formatCurrency(incomeStatement.netIncome || 0)
                                  ?.replace("ZAR", "")
                                  .trim()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Expenses:</span>
                              <span className="font-semibold text-red-600">
                                {formatCurrency(incomeStatement.totalExpenses)
                                  ?.replace("ZAR", "")
                                  .trim()}
                              </span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                              <span className="font-semibold">
                                Disposable Income:
                              </span>
                              <span
                                className={`font-bold text-lg ${
                                  (incomeStatement.disposableIncome || 0) >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {formatCurrency(
                                  incomeStatement.disposableIncome || 0
                                )
                                  ?.replace("ZAR", "")
                                  .trim()}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  // Render flat format (fallback)
                  return (
                    <div className="space-y-4">
                      {/* Raw Data */}
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-semibold text-muted-foreground mb-2">
                          Raw Affordability Data
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          This affordability data is in an unexpected format.
                        </p>
                        <details className="text-sm">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            View Raw Data
                          </summary>
                          <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto mt-2">
                            {JSON.stringify(application.affordability, null, 2)}
                          </pre>
                        </details>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            {application.decline_reason && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Decline Reason
                </p>
                <pre className="text-sm bg-red-50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(application.decline_reason, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Application Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Created</span>
              <span className="text-sm text-muted-foreground">
                {formatDate(application.created_at)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Last Updated</span>
              <span className="text-sm text-muted-foreground">
                {formatDate(application.updated_at)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
