// Shared types for client and server components

// Document types
export const DOCUMENT_TYPES = {
  ID: "id",
  BANK_STATEMENT: "bank_statement",
  PAYSLIP: "payslip",
  PROOF_OF_RESIDENCE: "proof_of_residence",
} as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[keyof typeof DOCUMENT_TYPES];

// Document upload state interface
export interface DocumentUploadState {
  errors?: {
    [key: string]: string[];
  };
  success?: boolean;
  documentId?: string;
  document?: import("./types").Database["public"]["Tables"]["documents"]["Row"];
}

// Current user interface (without server-side implementation)
export interface CurrentUser {
  id: string;
  full_name: string;
  email: string | undefined;
  role: import("./types").Database["public"]["Enums"]["user_role"];
  created_at: string;
}