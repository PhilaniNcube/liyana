import JSZip from "jszip";
import { toast } from "sonner";

export const getFileMimeType = (fileName: string) => {
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

export const formatDateForAPI = (dateString: string | null) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toISOString().split("T")[0].replace(/-/g, "");
};

interface Application {
  id_number_decrypted: string;
  profile?: {
    full_name?: string;
  } | null;
  gender?: string | null;
  date_of_birth?: string | null;
  home_address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  phone_number?: string | null;
  employer_contact_number?: string | null;
}

export const handleFraudCheck = async (
  application: Application,
  setIsRunningFraudCheck: (loading: boolean) => void,
  setFraudCheckResults: (results: any) => void
) => {
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
      dateOfBirth: formatDateForAPI(application.date_of_birth || null),
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
      throw new Error("Failed to Run Credit Check");
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
                zipError instanceof Error ? zipError.message : String(zipError),
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
    toast.success("Credit Check completed successfully");
  } catch (error) {
    console.error("Credit Check error:", error);
    toast.error("Failed to Run Credit Check");
  } finally {
    setIsRunningFraudCheck(false);
  }
};
