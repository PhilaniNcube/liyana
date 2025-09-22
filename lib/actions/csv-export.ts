"use server";

import type { PolicyWithHolder } from "@/lib/queries/policies";

export interface ExportDataParams {
  data: any[];
  filename: string;
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return "";

  // Get all keys from the first object (since we're now passing flat, processed data)
  const headers = Object.keys(data[0]);

  // Function to escape CSV values
  const escapeCSVValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Create data rows
  const rows = data.map(item => 
    headers.map(header => escapeCSVValue(item[header]))
  );

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');

  return csvContent;
}

export async function exportDataToCSV(params: ExportDataParams): Promise<{
  success: boolean;
  data?: string;
  error?: string;
  filename?: string;
}> {
  try {
    if (!params.data || params.data.length === 0) {
      return {
        success: false,
        error: "No data provided for export",
      };
    }

    // Convert to CSV
    const csvContent = convertToCSV(params.data);

    return {
      success: true,
      data: csvContent,
      filename: params.filename,
    };
  } catch (error) {
    console.error("Export error:", error);
    return {
      success: false,
      error: "An unexpected error occurred during export",
    };
  }
}