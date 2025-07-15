import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { v4 as uuidv4 } from "uuid";

// Document types
const DOCUMENT_TYPES = {
  ID: "id",
  BANK_STATEMENT: "bank_statement",
  PAYSLIP: "payslip",
  PROOF_OF_RESIDENCE: "proof_of_residence",
} as const;

type DocumentType = (typeof DOCUMENT_TYPES)[keyof typeof DOCUMENT_TYPES];

// Allowed file types
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
];

// Helper function to generate random file names
function generateRandomFileName(originalName: string): string {
  const extension = originalName.split(".").pop();
  const randomName = uuidv4();
  return `${randomName}.${extension}`;
}

// Helper function to validate file type
function validateFileType(file: File): boolean {
  return ALLOWED_FILE_TYPES.includes(file.type);
}

// Helper function to validate file size based on document type
function validateFileSize(file: File, documentType: DocumentType): boolean {
  const maxSizes = {
    [DOCUMENT_TYPES.ID]: 10 * 1024 * 1024, // 10MB
    [DOCUMENT_TYPES.BANK_STATEMENT]: 15 * 1024 * 1024, // 15MB
    [DOCUMENT_TYPES.PAYSLIP]: 10 * 1024 * 1024, // 10MB
    [DOCUMENT_TYPES.PROOF_OF_RESIDENCE]: 10 * 1024 * 1024, // 10MB
  };

  const maxSize = maxSizes[documentType] || 10 * 1024 * 1024; // Default 10MB
  return file.size <= maxSize;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin or editor
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Only admin and editor roles can upload documents
    if (profile.role !== "admin" && profile.role !== "editor") {
      return NextResponse.json(
        { error: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const documentType = formData.get("documentType") as DocumentType;
    const applicationId = formData.get("applicationId") as string;

    // Validate inputs
    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "Please select a file to upload" },
        { status: 400 }
      );
    }

    if (
      !documentType ||
      !Object.values(DOCUMENT_TYPES).includes(documentType)
    ) {
      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 }
      );
    }

    if (!applicationId) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!validateFileType(file)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Please upload PDF, JPEG, JPG, or PNG files only",
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (!validateFileSize(file, documentType)) {
      const maxSizes = {
        [DOCUMENT_TYPES.ID]: "10MB",
        [DOCUMENT_TYPES.BANK_STATEMENT]: "15MB",
        [DOCUMENT_TYPES.PAYSLIP]: "10MB",
        [DOCUMENT_TYPES.PROOF_OF_RESIDENCE]: "10MB",
      };
      const maxSize = maxSizes[documentType] || "10MB";
      return NextResponse.json(
        { error: `File size must be less than ${maxSize}` },
        { status: 400 }
      );
    }

    // Verify the application exists
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id, user_id")
      .eq("id", parseInt(applicationId))
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Generate random file name
    const randomFileName = generateRandomFileName(file.name);
    const filePath = `documents/${application.user_id}/${applicationId}/${documentType}/${randomFileName}`;

    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file. Please try again." },
        { status: 500 }
      );
    }

    // Save document metadata to database
    const { data: documentData, error: docError } = await supabase
      .from("documents")
      .insert({
        application_id: parseInt(applicationId),
        user_id: application.user_id, // Use the application owner's user_id
        document_type: documentType,
        storage_path: uploadData.path,
        uploaded_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (docError) {
      console.error("Database error:", docError);
      // Try to clean up uploaded file
      await supabase.storage.from("documents").remove([uploadData.path]);
      return NextResponse.json(
        { error: "Failed to save document information. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Document uploaded successfully",
      document: documentData,
    });
  } catch (error) {
    console.error("Admin document upload error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while uploading the document",
      },
      { status: 500 }
    );
  }
}
