import { createClient } from "@/lib/server";

export interface EmailRecord {
  id: number;
  resend_id: string;
  profile_id: string;
  application_id: number | null;
  loan_id: number | null;
  policy_id: number | null;
  created_at: string;
}

export async function getEmailsForApplication(applicationId: number): Promise<EmailRecord[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("resend_emails")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch application emails:", error);
    return [];
  }

  return data || [];
}

export async function getEmailsForLoan(loanId: number): Promise<EmailRecord[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("resend_emails")
    .select("*")
    .eq("loan_id", loanId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch loan emails:", error);
    return [];
  }

  return data || [];
}

export async function getEmailsForPolicy(policyId: number): Promise<EmailRecord[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("resend_emails")
    .select("*")
    .eq("policy_id", policyId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch policy emails:", error);
    return [];
  }

  return data || [];
}

export async function getAllEmailsForProfile(profileId: string): Promise<EmailRecord[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("resend_emails")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch profile emails:", error);
    return [];
  }

  return data || [];
}
