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
  
  const { data: application, error: appError } = await supabase
    .from("applications")
    .select("user_id")
    .eq("id", applicationId)
    .single();

  if (appError || !application) {
    console.error("Failed to fetch application:", appError);
    throw new Error(`Failed to fetch application: ${appError?.message}`);
  }

  const { data, error } = await supabase
    .from("sms_logs")
    .select("*")
    .eq("profile_id", application.user_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch SMS history for application:", error);
    throw new Error(`Failed to fetch SMS history for application: ${error.message}`);
  }

  return data || [];
}

export async function getSmsHistoryByPolicyId(policyId: number): Promise<SmsLogRecord[]> {
  const supabase = await createClient();
  
  const { data: policy, error: policyError } = await supabase
    .from("policies")
    .select("policy_holder_id")
    .eq("id", policyId)
    .single();

  if (policyError || !policy) {
    console.error("Failed to fetch policy:", policyError);
    throw new Error(`Failed to fetch policy: ${policyError?.message}`);
  }

  const { data, error } = await supabase
    .from("sms_logs")
    .select("*")
    .eq("profile_id", policy.policy_holder_id)
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