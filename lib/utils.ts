import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// API Check utilities
export {
  getApiCheckStatusIcon,
  getApiCheckStatusColor,
} from "./utils/api-checks";

// ZIP handling utilities
export {
  extractPdfFromZip,
  getZipContents,
  isBase64Zip,
  handleZipExtraction,
} from "./utils/zip-extractor";

// BraveLender utilities
export { handleBraveLenderSubmit } from "./utils/bravelender";
