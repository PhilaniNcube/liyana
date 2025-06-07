import { createClient } from "@/lib/server";
import { z } from "zod";
import type { Database } from "@/lib/types";

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

export async function getDocumentsByApplication(applicationId: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select(
      `
      *,
      application:applications(id, status, user_id)
    `
    )
    .eq("application_id", applicationId)
    .order("uploaded_at", { ascending: false });

  if (error) {
    throw new Error(
      `Failed to fetch documents for application: ${error.message}`
    );
  }

  return data;
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
