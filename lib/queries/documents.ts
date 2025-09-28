import { createClient } from "@/lib/server";
import { z } from "zod";
import type { Database } from "@/lib/types";
import { getCurrentUser } from "./user";

// Document types enum
export const DOCUMENT_TYPES = {
  ID: "id",
  BANK_STATEMENT: "bank_statement",
  PAYSLIP: "payslip",
  PROOF_OF_RESIDENCE: "proof_of_residence",
} as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[keyof typeof DOCUMENT_TYPES];

export interface DocumentUploadState {
  errors?: {
    [key: string]: string[];
  };
  success?: boolean;
  documentId?: string;
  document?: Database["public"]["Tables"]["documents"]["Row"];
}

type Document = Database["public"]["Tables"]["documents"]["Row"];
type DocumentInsert = Database["public"]["Tables"]["documents"]["Insert"];

// Document query schemas
export const getDocumentByIdSchema = z.object({
  id: z.number(),
});

export const getDocumentsByApplicationSchema = z.object({
  applicationId: z.number(),
});

export const getDocumentsByUserSchema = z.object({
  userId: z.string().uuid(),
});

export const getDocumentsByTypeSchema = z.object({
  documentType: z.enum([
    "id",
    "bank_statement",
    "payslip",
    "proof_of_residence",
  ]),
});

// Query functions
export async function getDocumentById(id: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch document: ${error.message}`);
  }

  return data;
}

/**
 * Fetch all documents related to an application INCLUDING any profile level documents
 * that belong to the same user (profile_documents table).
 *
 * This keeps the original behaviour (returning application documents) but now
 * augments the result set with profile documents so consuming UIs can show a
 * comprehensive list of what has been provided. A `source` discriminator is
 * added to each returned item ("application" | "profile") so existing code can
 * filter if necessary. For backward compatibility, application documents keep
 * their original shape; profile documents are normalised to a similar shape.
 */
export async function getDocumentsByApplication(applicationId: number) {
  const supabase = await createClient();

  // 1. Get the application to obtain the user_id / profile_id
  const { data: applicationRow, error: appError } = await supabase
    .from("applications")
    .select("id, user_id")
    .eq("id", applicationId)
    .single();

  if (appError || !applicationRow) {
    throw new Error(
      `Failed to resolve application for documents: ${appError?.message || "not found"}`
    );
  }

  const userId = applicationRow.user_id;

  // 2. Fetch application-specific documents (original behaviour)
  const { data: appDocs, error: appDocsError } = await supabase
    .from("documents")
    .select(
      `
      *,
      application:applications(id, status, user_id)
    `
    )
    .eq("application_id", applicationId)
    .order("uploaded_at", { ascending: false });

  if (appDocsError) {
    throw new Error(
      `Failed to fetch documents for application: ${appDocsError.message}`
    );
  }

  // 3. Fetch profile documents for the same user
  const { data: profileDocs, error: profileDocsError } = await supabase
    .from("profile_documents")
    .select(
      `id, created_at, document_type, path, profile_id, profiles(full_name)`
    )
    .eq("profile_id", userId)
    .order("created_at", { ascending: false });

  if (profileDocsError) {
    throw new Error(
      `Failed to fetch profile documents: ${profileDocsError.message}`
    );
  }

  // 4. Normalise profile documents into a shape similar to application documents
  const normalisedProfileDocs = (profileDocs || []).map((pd) => ({
    id: pd.id,
    application_id: applicationId, // associate for UI grouping (no actual DB relation)
    user_id: userId,
    document_type: pd.document_type,
    file_path: pd.path,
    uploaded_at: pd.created_at,
    // Keep original application join field absent; add profile meta
    profile: { id: pd.profile_id, full_name: (pd as any).profiles?.full_name },
    source: "profile" as const,
  }));

  // 5. Tag application docs with source discriminator
  const taggedAppDocs = (appDocs || []).map((d: any) => ({
    ...d,
    source: "application" as const,
  }));

  // 6. Combine and sort by uploaded_at/created_at desc
  const combined = [...taggedAppDocs, ...normalisedProfileDocs].sort((a, b) => {
    const aDate = new Date(a.uploaded_at || a.created_at || 0).getTime();
    const bDate = new Date(b.uploaded_at || b.created_at || 0).getTime();
    return bDate - aDate;
  });

  return combined;
}

export async function getDocumentsByUser(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select(
      `
      *,
      application:applications(id, status)
    `
    )
    .eq("user_id", userId)
    .order("uploaded_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch documents for user: ${error.message}`);
  }

  return data;
}

export async function getDocumentsByType(
  documentType: Database["public"]["Enums"]["document_type"]
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select(
      `
      *,
      application:applications(id, status, user_id),
      profile:profiles(id, full_name)
    `
    )
    .eq("document_type", documentType)
    .order("uploaded_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch documents by type: ${error.message}`);
  }

  return data;
}

export async function getDocumentsByApplicationAndType(
  applicationId: number,
  documentType: Database["public"]["Enums"]["document_type"]
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("application_id", applicationId)
    .eq("document_type", documentType)
    .order("uploaded_at", { ascending: false });

  if (error) {
    throw new Error(
      `Failed to fetch documents by application and type: ${error.message}`
    );
  }

  return data;
}

export async function getAllDocuments(
  options: { limit?: number; offset?: number } = {}
) {
  const supabase = await createClient();

  let query = supabase
    .from("documents")
    .select(
      `
      *,
      application:applications(id, status, user_id),
      profile:profiles(id, full_name)
    `
    )
    .order("uploaded_at", { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(
      options.offset,
      options.offset + (options.limit || 10) - 1
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch documents: ${error.message}`);
  }

  return data;
}

export async function getRequiredDocumentsForApplication(
  applicationId: number
) {
  const supabase = await createClient();

  // Get all documents for the application
  const { data: documents, error } = await supabase
    .from("documents")
    .select("document_type")
    .eq("application_id", applicationId);

  if (error) {
    throw new Error(
      `Failed to fetch documents for application: ${error.message}`
    );
  }

  // Define required document types
  const requiredDocuments: Database["public"]["Enums"]["document_type"][] = [
    "id",
    "bank_statement",
    "payslip",
    "proof_of_residence",
  ];

  const submittedTypes = documents.map((doc) => doc.document_type);
  const missingDocuments = requiredDocuments.filter(
    (type) => !submittedTypes.includes(type)
  );

  return {
    required: requiredDocuments,
    submitted: submittedTypes,
    missing: missingDocuments,
    isComplete: missingDocuments.length === 0,
  };
}

// Function to get uploaded documents for an application (with user authentication)
export async function getApplicationDocuments(applicationId: string) {
  const supabase = await createClient();

  try {
const user = await getCurrentUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("application_id", parseInt(applicationId))
      .eq("user_id", user.id)
      .order("uploaded_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error fetching documents:", error);
    return null;
  }
}

export async function getDocumentStats() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select("document_type, application_id");

  if (error) {
    throw new Error(`Failed to fetch document stats: ${error.message}`);
  }

  // Calculate statistics
  const stats = data.reduce(
    (acc, document) => {
      acc.total += 1;

      switch (document.document_type) {
        case "id":
          acc.idDocuments += 1;
          break;
        case "bank_statement":
          acc.bankStatements += 1;
          break;
        case "payslip":
          acc.payslips += 1;
          break;
        case "proof_of_residence":
          acc.proofOfResidence += 1;
          break;
      }

      // Count unique applications
      if (!acc.uniqueApplications.has(document.application_id)) {
        acc.uniqueApplications.add(document.application_id);
      }

      return acc;
    },
    {
      total: 0,
      idDocuments: 0,
      bankStatements: 0,
      payslips: 0,
      proofOfResidence: 0,
      uniqueApplications: new Set<number>(),
    }
  );

  return {
    ...stats,
    uniqueApplicationsCount: stats.uniqueApplications.size,
  };
}
