import { createClient } from "@/lib/server";
import { z } from "zod";

// API Check query schemas
export const getApiCheckByIdSchema = z.object({
  id: z.number(),
});

export const getApiChecksByApplicationSchema = z.object({
  applicationId: z.number(),
});

export const getApiChecksByTypeSchema = z.object({
  checkType: z.enum([
    "credit_bureau",
    "fraud_check",
    "bank_verification",
    "dha_otv_facial",
  ]),
});

export const getApiChecksByStatusSchema = z.object({
  status: z.enum(["passed", "failed", "pending"]),
});

export const getApiChecksByVendorSchema = z.object({
  vendor: z.enum(["Experian", "WhoYou", "ThisIsMe"]),
});

// Query functions
export async function getApiCheckById(id: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("api_checks")
    .select(
      `
      *,
      application:applications(id, status, user_id, id_number)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch API check: ${error.message}`);
  }

  return data;
}

export async function getApiChecksByApplication(applicationId: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("api_checks")
    .select("*")
    .eq("application_id", applicationId)
    .order("checked_at", { ascending: false });

  if (error) {
    throw new Error(
      `Failed to fetch API checks for application: ${error.message}`
    );
  }

  return data;
}

export async function getApiChecksByType(
  checkType: Database["public"]["Enums"]["api_check_type"]
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("api_checks")
    .select(
      `
      *,
      application:applications(id, status, user_id, id_number)
    `
    )
    .eq("check_type", checkType)
    .order("checked_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch API checks by type: ${error.message}`);
  }

  return data;
}

export async function getApiChecksByStatus(
  status: Database["public"]["Enums"]["api_check_status"]
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("api_checks")
    .select(
      `
      *,
      application:applications(id, status, user_id, id_number)
    `
    )
    .eq("status", status)
    .order("checked_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch API checks by status: ${error.message}`);
  }

  return data;
}

export async function getApiChecksByVendor(
  vendor: Database["public"]["Enums"]["api_vendor"]
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("api_checks")
    .select(
      `
      *,
      application:applications(id, status, user_id, id_number)
    `
    )
    .eq("vendor", vendor)
    .order("checked_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch API checks by vendor: ${error.message}`);
  }

  return data;
}

export async function getFailedApiChecks() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("api_checks")
    .select(
      `
      *,
      application:applications(id, status, user_id, id_number)
    `
    )
    .eq("status", "failed")
    .order("checked_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch failed API checks: ${error.message}`);
  }

  return data;
}

export async function getPendingApiChecks() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("api_checks")
    .select(
      `
      *,
      application:applications(id, status, user_id, id_number)
    `
    )
    .eq("status", "pending")
    .order("checked_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch pending API checks: ${error.message}`);
  }

  return data;
}

export async function getApiChecksByApplicationAndType(
  applicationId: number,
  checkType: Database["public"]["Enums"]["api_check_type"]
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("api_checks")
    .select("*")
    .eq("application_id", applicationId)
    .eq("check_type", checkType)
    .order("checked_at", { ascending: false });

  if (error) {
    throw new Error(
      `Failed to fetch API checks by application and type: ${error.message}`
    );
  }

  return data;
}

export async function getLatestApiCheckForApplication(
  applicationId: number,
  checkType: Database["public"]["Enums"]["api_check_type"]
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("api_checks")
    .select("*")
    .eq("application_id", applicationId)
    .eq("check_type", checkType)
    .order("checked_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    throw new Error(`Failed to fetch latest API check: ${error.message}`);
  }

  return data;
}

export async function getApiCheckStats() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("api_checks")
    .select("status, check_type, vendor");

  if (error) {
    throw new Error(`Failed to fetch API check stats: ${error.message}`);
  }

  // Calculate statistics
  const stats = data.reduce(
    (acc, check) => {
      acc.total += 1;

      // Status stats
      switch (check.status) {
        case "passed":
          acc.passed += 1;
          break;
        case "failed":
          acc.failed += 1;
          break;
        case "pending":
          acc.pending += 1;
          break;
      }

      // Check type stats
      switch (check.check_type) {
        case "credit_bureau":
          acc.creditBureau += 1;
          break;
        case "fraud_check":
          acc.fraudCheck += 1;
          break;
        case "bank_verification":
          acc.bankVerification += 1;
          break;
        case "dha_otv_facial":
          acc.dhaOtvFacial += 1;
          break;
      }

      // Vendor stats
      switch (check.vendor) {
        case "Experian":
          acc.experian += 1;
          break;
        case "WhoYou":
          acc.whoYou += 1;
          break;
        case "ThisIsMe":
          acc.thisIsMe += 1;
          break;
      }

      return acc;
    },
    {
      total: 0,
      passed: 0,
      failed: 0,
      pending: 0,
      creditBureau: 0,
      fraudCheck: 0,
      bankVerification: 0,
      dhaOtvFacial: 0,
      experian: 0,
      whoYou: 0,
      thisIsMe: 0,
    }
  );

  return {
    ...stats,
    passRate: stats.total > 0 ? (stats.passed / stats.total) * 100 : 0,
    failRate: stats.total > 0 ? (stats.failed / stats.total) * 100 : 0,
  };
}
