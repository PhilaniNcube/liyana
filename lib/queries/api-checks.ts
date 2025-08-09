import { createClient } from "@/lib/server";
import { createServiceClient } from "@/lib/service";
import { z } from "zod";
import type { Database } from "@/lib/types";
import { decryptValue } from "../encryption";

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

export const getApiChecksByIdNumberSchema = z.object({
  idNumber: z.string().min(1),
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
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch API check: ${error.message}`);
  }

  return data;
}

export async function getApiChecksByApplication(applicationId: number) {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("api_checks")
    .select("*")
    .eq("application_id", applicationId)
    .order("checked_at", { ascending: false });

  if (error) {
    throw new Error(
      `Failed to fetch API checks for application: ${error.message}`,
    );
  }

  return data;
}

export async function getApiChecksByType(
  checkType: Database["public"]["Enums"]["api_check_type"],
) {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("api_checks")
    .select(
      `
      *,
      application:applications(id, status, user_id, id_number)
    `,
    )
    .eq("check_type", checkType)
    .order("checked_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch API checks by type: ${error.message}`);
  }

  return data;
}

export async function getApiChecksByStatus(
  status: Database["public"]["Enums"]["api_check_status"],
) {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("api_checks")
    .select(
      `
      *,
      application:applications(id, status, user_id, id_number)
    `,
    )
    .eq("status", status)
    .order("checked_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch API checks by status: ${error.message}`);
  }

  return data;
}

export async function getApiChecksByVendor(
  vendor: Database["public"]["Enums"]["api_vendor"],
) {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("api_checks")
    .select(
      `
      *,
      application:applications(id, status, user_id, id_number)
    `,
    )
    .eq("vendor", vendor)
    .order("checked_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch API checks by vendor: ${error.message}`);
  }

  return data;
}

export async function getFailedApiChecks() {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("api_checks")
    .select(
      `
      *,
      application:applications(id, status, user_id, id_number)
    `,
    )
    .eq("status", "failed")
    .order("checked_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch failed API checks: ${error.message}`);
  }

  return data;
}

export async function getPendingApiChecks() {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("api_checks")
    .select(
      `
      *,
      application:applications(id, status, user_id, id_number)
    `,
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
  checkType: Database["public"]["Enums"]["api_check_type"],
) {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("api_checks")
    .select("*")
    .eq("application_id", applicationId)
    .eq("check_type", checkType)
    .order("checked_at", { ascending: false });

  if (error) {
    throw new Error(
      `Failed to fetch API checks by application and type: ${error.message}`,
    );
  }

  return data;
}

export async function getLatestApiCheckForApplication(
  applicationId: number,
  checkType: Database["public"]["Enums"]["api_check_type"],
) {
  const supabase = await createServiceClient();

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

export async function getApiChecksByIdNumber(idNumber: string) {
  const supabase = await createServiceClient();

  // Note: id_number is stored encrypted using a random IV, so encrypting the
  // incoming value won't match deterministically. We must fetch and compare
  // after decrypting on the server side.
  const { data, error } = await supabase
    .from("api_checks")
    .select("*")
    .order("checked_at", { ascending: false });

  if (error) {
    throw new Error(
      `Failed to fetch API checks for ID number: ${error.message}`,
    );
  }

  const normalize = (v: string) => v.replace(/\D/g, "");
  const target = normalize(idNumber);

  // Filter rows by comparing decrypted (or plain) id_number
  const filtered = data.filter((check) => {
    if (!check.id_number) return false;
    const raw = check.id_number as string;
    try {
      const decrypted = raw.length > 13 ? decryptValue(raw) : raw;
      return normalize(decrypted) === target;
    } catch {
      // If decryption fails, fall back to comparing as plain text
      return normalize(raw) === target;
    }
  });

  // For caller convenience, present the decrypted plaintext in results
  filtered.forEach((check) => {
    if (check.id_number && (check.id_number as string).length > 13) {
      try {
        check.id_number = decryptValue(check.id_number as string);
      } catch {
        // leave as-is on failure
      }
    }
  });

  return filtered;
}

export async function getApiCheckStats() {
  const supabase = await createServiceClient();

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
    },
  );

  return {
    ...stats,
    passRate: stats.total > 0 ? (stats.passed / stats.total) * 100 : 0,
    failRate: stats.total > 0 ? (stats.failed / stats.total) * 100 : 0,
  };
}

export async function getApiChecks() {
  const supabase = await createServiceClient();

  const user = await supabase.auth.getUser();

  console.log("Fetched user:", user);

  const { data, error } = await supabase
    .from("api_checks")
    .select("*")
    .order("checked_at", { ascending: false });

  console.log(JSON.stringify(error, null, 2));

  if (error) {
    throw new Error(`Failed to fetch API checks: ${error.message}`);
  }

  // Decrypt ID numbers if they are encrypted
  data.forEach((check) => {
    if (check.id_number && check.id_number.length > 13) {
      check.id_number = decryptValue(check.id_number);
    }
  });

  console.log("Fetched API checks:", data[0]);

  return data;
}
