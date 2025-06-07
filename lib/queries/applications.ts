import { createClient } from "@/lib/server";
import { z } from "zod";
import type { Database } from "@/lib/types";

type ApplicationUpdate = Database["public"]["Tables"]["applications"]["Update"];

// Application query schemas
export const getApplicationByIdSchema = z.object({
  id: z.number(),
});

export const getApplicationsByUserSchema = z.object({
  userId: z.string().uuid(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

export const getApplicationsByStatusSchema = z.object({
  status: z.enum([
    "pre_qualifier",
    "pending_documents",
    "in_review",
    "approved",
    "declined",
  ]),
  limit: z.number().min(1).max(100).optional(),
});

export const createApplicationSchema = z.object({
  user_id: z.string().uuid(),
  id_number: z.string().min(1),
  term: z.number().min(1),
  application_amount: z.number().positive().optional(),
  date_of_birth: z.string().optional(),
  status: z.enum([
    "pre_qualifier",
    "pending_documents",
    "in_review",
    "approved",
    "declined",
  ]),
});

// Query functions
export async function getApplicationById(id: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("applications")
    .select(
      `
      *,
      profile:profiles(id, full_name, role)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch application: ${error.message}`);
  }

  return data;
}

export async function getApplicationsByUser(
  userId: string,
  options: { limit?: number; offset?: number } = {}
) {
  const supabase = await createClient();

  let query = supabase
    .from("applications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

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
    throw new Error(`Failed to fetch applications: ${error.message}`);
  }

  return data;
}

export async function getApplicationsByStatus(
  status: Database["public"]["Enums"]["application_status"],
  options: { limit?: number } = {}
) {
  const supabase = await createClient();

  let query = supabase
    .from("applications")
    .select(
      `
      *,
      profile:profiles(id, full_name, role)
    `
    )
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch applications by status: ${error.message}`);
  }

  return data;
}

export async function getAllApplications(
  options: { limit?: number; offset?: number } = {}
) {
  const supabase = await createClient();

  let query = supabase
    .from("applications")
    .select(
      `
      *,
      profile:profiles(id, full_name, role)
    `
    )
    .order("created_at", { ascending: false });

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
    throw new Error(`Failed to fetch applications: ${error.message}`);
  }

  return data;
}

export async function getApplicationsWithDocuments(applicationId: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("applications")
    .select(
      `
      *,
      profile:profiles(id, full_name, role),
      documents(*)
    `
    )
    .eq("id", applicationId)
    .single();

  if (error) {
    throw new Error(
      `Failed to fetch application with documents: ${error.message}`
    );
  }

  return data;
}

export async function getApplicationsWithApiChecks(applicationId: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("applications")
    .select(
      `
      *,
      profile:profiles(id, full_name, role),
      api_checks(*)
    `
    )
    .eq("id", applicationId)
    .single();

  if (error) {
    throw new Error(
      `Failed to fetch application with API checks: ${error.message}`
    );
  }

  return data;
}

export async function updateApplicationStatus(
  applicationId: number,
  status: Database["public"]["Enums"]["application_status"],
  declineReason?: any
) {
  const supabase = await createClient();

  const updates: ApplicationUpdate = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (declineReason) {
    updates.decline_reason = declineReason;
  }

  const { data, error } = await supabase
    .from("applications")
    .update(updates)
    .eq("id", applicationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update application status: ${error.message}`);
  }

  return data;
}

export async function getApplicationStats() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("applications")
    .select("status, application_amount");

  if (error) {
    throw new Error(`Failed to fetch application stats: ${error.message}`);
  }

  // Calculate statistics
  const stats = data.reduce(
    (acc, application) => {
      acc.total += 1;
      acc.totalAmount += application.application_amount || 0;

      switch (application.status) {
        case "pre_qualifier":
          acc.preQualifier += 1;
          break;
        case "pending_documents":
          acc.pendingDocuments += 1;
          break;
        case "in_review":
          acc.inReview += 1;
          break;
        case "approved":
          acc.approved += 1;
          acc.approvedAmount += application.application_amount || 0;
          break;
        case "declined":
          acc.declined += 1;
          break;
      }

      return acc;
    },
    {
      total: 0,
      totalAmount: 0,
      preQualifier: 0,
      pendingDocuments: 0,
      inReview: 0,
      approved: 0,
      declined: 0,
      approvedAmount: 0,
    }
  );

  return stats;
}
