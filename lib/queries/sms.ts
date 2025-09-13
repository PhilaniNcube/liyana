import { createClient } from "@/lib/server";
import type { Database } from "@/lib/types";

type SmsLog = Database["public"]["Tables"]["sms_logs"]["Row"];

export interface SmsLogRecord {
  id: number;
  message: string;
  phone_number: string;
  created_at: string;
  profile_id: string;
}

export async function getSmsHistoryByProfileId(profileId: string): Promise<SmsLogRecord[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("sms_logs")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch SMS history:", error);
    throw new Error(`Failed to fetch SMS history: ${error.message}`);
  }

  return data || [];
}

export async function getSmsHistoryByApplicationId(applicationId: number): Promise<SmsLogRecord[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("sms_logs")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch SMS history for application:", error);
    throw new Error(`Failed to fetch SMS history for application: ${error.message}`);
  }

  return data || [];
}

export async function getSmsHistoryByPolicyId(policyId: number): Promise<SmsLogRecord[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("sms_logs")
    .select("*")
    .eq("policy_id", policyId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch SMS history for policy:", error);
    throw new Error(`Failed to fetch SMS history for policy: ${error.message}`);
  }

  return data || [];
}

export async function getAllSmsHistory(): Promise<SmsLogRecord[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("sms_logs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch all SMS history:", error);
    throw new Error(`Failed to fetch all SMS history: ${error.message}`);
  }

  return data || [];
}