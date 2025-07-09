import JSZip from "jszip";

/**
 * Extract and download a PDF file from a base64-encoded ZIP file
 * @param base64ZipData - The base64-encoded ZIP file data
 * @param filename - Optional filename for the downloaded PDF (default: extracted-document.pdf)
 * @returns Promise<boolean> - True if successful, false if failed
 */
export async function extractPdfFromZip(
  base64ZipData: string,
  filename: string = "fraud-check-document.pdf"
): Promise<boolean> {
  try {
    // Remove data URL prefix if present (e.g., "data:application/zip;base64,")
    const cleanBase64 = base64ZipData.replace(/^data:[^;]+;base64,/, "");

    // Convert base64 to binary
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Load the ZIP file
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(bytes);

    // Find PDF files in the ZIP
    const pdfFiles = Object.keys(zipContent.files).filter(
      (filename) =>
        filename.toLowerCase().endsWith(".pdf") &&
        !zipContent.files[filename].dir
    );

    if (pdfFiles.length === 0) {
      console.error("No PDF files found in the ZIP archive");
      return false;
    }

    // Extract the first PDF file
    const pdfFile = zipContent.files[pdfFiles[0]];
    const pdfBlob = await pdfFile.async("blob");

    // Create download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("Error extracting PDF from ZIP:", error);
    return false;
  }
}

/**
 * Get information about files in a base64-encoded ZIP
 * @param base64ZipData - The base64-encoded ZIP file data
 * @returns Promise<string[]> - Array of filenames in the ZIP
 */
export async function getZipContents(base64ZipData: string): Promise<string[]> {
  try {
    // Remove data URL prefix if present
    const cleanBase64 = base64ZipData.replace(/^data:[^;]+;base64,/, "");

    // Convert base64 to binary
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Load the ZIP file
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(bytes);

    // Return list of files (excluding directories)
    return Object.keys(zipContent.files).filter(
      (filename) => !zipContent.files[filename].dir
    );
  } catch (error) {
    console.error("Error reading ZIP contents:", error);
    return [];
  }
}

/**
 * Check if a string is a valid base64-encoded ZIP file
 * @param data - The data to check
 * @returns boolean - True if it appears to be a base64-encoded ZIP
 */
export function isBase64Zip(data: string): boolean {
  try {
    // Remove data URL prefix if present
    const cleanBase64 = data.replace(/^data:[^;]+;base64,/, "");

    // Check if it's valid base64
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
      return false;
    }

    // Try to decode and check for ZIP signature
    const binaryString = atob(cleanBase64);

    // ZIP files start with "PK" (0x504B)
    return (
      binaryString.charCodeAt(0) === 0x50 && binaryString.charCodeAt(1) === 0x4b
    );
  } catch (error) {
    return false;
  }
}
