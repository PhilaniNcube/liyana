"use client";

import { createClient } from "@/lib/client";
import { v4 as uuidv4 } from "uuid";
import {
  DOCUMENT_TYPES,
  DocumentUploadState,
  type DocumentType,
} from "../queries";

// Helper function to generate random file names
function generateRandomFileName(originalName: string): string {
  const extension = originalName.split(".").pop() || "";
  const randomId = uuidv4();
  return `${randomId}.${extension}`;
}

// Allowed file types for all documents
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
];

// Helper function to validate file type
function validateFileType(file: File): boolean {
  return ALLOWED_FILE_TYPES.includes(file.type);
}

// Helper function to validate file size (max 5MB)
function validateFileSize(file: File): boolean {
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  return file.size <= maxSize;
}

export async function uploadDocument(
  file: File,
  documentType: DocumentType,
  applicationId: string
): Promise<DocumentUploadState> {
  // Validate inputs
  if (!file || file.size === 0) {
    return {
      errors: {
        file: ["Please select a file to upload"],
      },
    };
  }

  if (!documentType) {
    return {
      errors: {
        documentType: ["Document type is required"],
      },
    };
  }

  if (!applicationId) {
    return {
      errors: {
        applicationId: ["Application ID is required"],
      },
    };
  }

  // Validate file type
  if (!validateFileType(file)) {
    return {
      errors: {
        file: [
          "Invalid file type. Please upload PDF, JPEG, JPG, or PNG files only",
        ],
      },
    };
  }

  // Validate file size
  if (!validateFileSize(file)) {
    return {
      errors: {
        file: ["File size must be less than 5MB"],
      },
    };
  }

  const supabase = createClient();

  try {
    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        errors: {
          _form: ["You must be logged in to upload documents"],
        },
      };
    }

    // Verify the application belongs to the current user
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id, user_id")
      .eq("id", parseInt(applicationId))
      .eq("user_id", user.id)
      .single();

    if (appError || !application) {
      return {
        errors: {
          _form: ["Application not found or access denied"],
        },
      };
    }

    // Generate random file name
    const randomFileName = generateRandomFileName(file.name);
    const filePath = `documents/${user.id}/${applicationId}/${documentType}/${randomFileName}`;

    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return {
        errors: {
          _form: ["Failed to upload file. Please try again."],
        },
      };
    }

    // Save document metadata to database
    const { data: documentData, error: docError } = await supabase
      .from("documents")
      .insert({
        application_id: parseInt(applicationId),
        user_id: user.id,
        document_type: documentType,
        storage_path: uploadData.path,
        uploaded_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (docError) {
      console.error("Database error:", docError);
      // Try to clean up uploaded file
      await supabase.storage.from("documents").remove([uploadData.path]);
      return {
        errors: {
          _form: ["Failed to save document information. Please try again."],
        },
      };
    }

    return {
      success: true,
      documentId: documentData.id.toString(),
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      errors: {
        _form: [
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while uploading the document",
        ],
      },
    };
  }
}

// Client-side function to delete a document
export async function deleteDocument(
  documentId: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get document info
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("storage_path, user_id")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (docError || !document) {
      return { success: false, error: "Document not found" };
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("documents")
      .remove([document.storage_path]);

    if (storageError) {
      console.error("Storage deletion error:", storageError);
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId)
      .eq("user_id", user.id);

    if (deleteError) {
      return { success: false, error: "Failed to delete document" };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
