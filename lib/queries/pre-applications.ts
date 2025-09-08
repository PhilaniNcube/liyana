import { createClient } from "@/lib/client";
import { Database } from "@/lib/types";
import { encryptValue, decryptValue } from "@/lib/encryption";
import { PreApplication, PreApplicationWithDetails } from "../schemas";





export async function getPreApplicationByUser(userId: string): Promise<PreApplication | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pre_applications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    throw new Error(`Failed to fetch pre-application: ${error.message}`);
  }

  return data;
}

export async function getPreApplicationsWithDetails(
  options: {
    status?: Database["public"]["Enums"]["pre_application_status"];
    limit?: number;
    offset?: number;
    fromDate?: string;
    toDate?: string;
  } = {}
): Promise<PreApplicationWithDetails[]> {
  const supabase = await createClient();

  let query = supabase
    .from("pre_applications")
    .select(`
      *,
      profile:profile_id(id, full_name, email, phone_number, role, created_at),
      credit_check:credit_check_id(id, check_type, status, response_payload, checked_at, vendor),
      application:application_id(id, status, created_at, application_amount, term)
    `)
    .order("created_at", { ascending: false });

  if (options.status) {
    query = query.eq("status", options.status);
  }

  if (options.fromDate) {
    query = query.gte("created_at", options.fromDate);
  }

  if (options.toDate) {
    query = query.lte("created_at", options.toDate);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch pre-applications: ${error.message}`);
  }

  // Decrypt ID numbers for admin users
  return (data || []).map((preApp) => ({
    ...preApp,
    id_number: (() => {
      try {
        return decryptValue(preApp.id_number);
      } catch {
        return preApp.id_number; // Return as-is if decryption fails
      }
    })(),
  })) as PreApplicationWithDetails[];
}

export async function getAbandonedPreApplications(
  daysSinceCreated: number = 7,
  limit: number = 50
): Promise<PreApplicationWithDetails[]> {
  const supabase = await createClient();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysSinceCreated);

  const { data, error } = await supabase
    .from("pre_applications")
    .select(`
      *,
      profile:profile_id(id, full_name, email, phone_number, role, created_at),
      credit_check:credit_check_id(id, check_type, status, response_payload, checked_at, vendor)
    `)
    .eq("status", "credit_passed")
    .lt("created_at", cutoffDate.toISOString())
    .is("application_id", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch abandoned pre-applications: ${error.message}`);
  }

  // Decrypt ID numbers for admin users
  return (data || []).map((preApp) => ({
    ...preApp,
    id_number: (() => {
      try {
        return decryptValue(preApp.id_number);
      } catch {
        return preApp.id_number; // Return as-is if decryption fails
      }
    })(),
  })) as PreApplicationWithDetails[];
}

export async function getCreditPassedPreApplications(
  page: number = 1,
  per_page: number = 50,
  start_date: string,
  end_date: string
): Promise<PreApplicationWithDetails[]> {
  const supabase = await createClient();

  const offset = (page - 1) * per_page;

  const { data, error } = await supabase
    .from("pre_applications")
    .select(`
      *,
      profile:profile_id(id, full_name, email, phone_number, role, created_at),
      credit_check:credit_check_id(id, check_type, status, response_payload, checked_at, vendor),
      application:application_id(id, status, created_at, application_amount, term)
    `)
    .eq("status", 'credit_passed')
    .order("created_at", { ascending: false })
    .range(offset, offset + per_page - 1);

  if (error) {
    throw new Error(`Failed to fetch credit passed pre-applications: ${error.message}`);
    
  }

  // Decrypt ID numbers and transform data to match expected format
  return data.map((item) => ({
    ...item,
    id_number: decryptValue(item.id_number),
  })) as PreApplicationWithDetails[];
}

export async function markPreApplicationAsAbandoned(preApplicationId: number): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("pre_applications")
    .update({ status: "abandoned" })
    .eq("id", preApplicationId);

  if (error) {
    throw new Error(`Failed to mark pre-application as abandoned: ${error.message}`);
  }
}

export async function getPreApplicationStats(
  fromDate?: string,
  toDate?: string
): Promise<{
  total: number;
  credit_passed: number;
  application_started: number;
  application_completed: number;
  abandoned: number;
  conversion_rate: number;
}> {
  const supabase = await createClient();

  let query = supabase
    .from("pre_applications")
    .select("status");

  if (fromDate) {
    query = query.gte("created_at", fromDate);
  }

  if (toDate) {
    query = query.lte("created_at", toDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch pre-application stats: ${error.message}`);
  }

  const stats = {
    total: data?.length || 0,
    credit_passed: 0,
    application_started: 0,
    application_completed: 0,
    abandoned: 0,
    conversion_rate: 0,
  };

  data?.forEach((preApp) => {
    switch (preApp.status) {
      case "credit_passed":
        stats.credit_passed++;
        break;
      case "application_started":
        stats.application_started++;
        break;
      case "application_completed":
        stats.application_completed++;
        break;
      case "abandoned":
        stats.abandoned++;
        break;
    }
  });

  // Calculate conversion rate (application_completed / total)
  if (stats.total > 0) {
    stats.conversion_rate = (stats.application_completed / stats.total) * 100;
  }

  return stats;
}
