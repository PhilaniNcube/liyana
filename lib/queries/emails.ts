import { createClient } from "@/lib/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailRecord {
  id: number;
  resend_id: string;
  profile_id: string;
  application_id: number | null;
  loan_id: number | null;
  policy_id: number | null;
  created_at: string;
}

export interface EmailDetails {
  id: string;
  to: string[];
  from: string;
  subject: string;
  html: string;
  text: string;
  created_at: string;
  last_event: string;
}

export interface EmailWithDetails extends EmailRecord {
  details?: EmailDetails;
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

async function fetchEmailDetailsFromResend(resendId: string): Promise<EmailDetails | null> {
  try {
    const email = await resend.emails.get(resendId);
    
    return {
      id: email.data?.id || resendId,
      to: Array.isArray(email.data?.to) ? email.data.to : email.data?.to ? [email.data.to] : [],
      from: email.data?.from || "",
      subject: email.data?.subject || "",
      html: email.data?.html || "",
      text: email.data?.text || "",
      created_at: email.data?.created_at || "",
      last_event: email.data?.last_event || "sent",
    };
  } catch (error) {
    console.error(`Failed to fetch email details for ${resendId}:`, error);
    return null;
  }
}

export async function getEmailsForApplicationWithDetails(applicationId: number): Promise<EmailWithDetails[]> {
  const emails = await getEmailsForApplication(applicationId);
  
  // Fetch details for each email
  const emailsWithDetails = await Promise.all(
    emails.map(async (email) => {
      const details = await fetchEmailDetailsFromResend(email.resend_id);
      return {
        ...email,
        details: details || undefined,
      };
    })
  );

  return emailsWithDetails;
}

export async function getEmailsForLoanWithDetails(loanId: number): Promise<EmailWithDetails[]> {
  const emails = await getEmailsForLoan(loanId);
  
  // Fetch details for each email
  const emailsWithDetails = await Promise.all(
    emails.map(async (email) => {
      const details = await fetchEmailDetailsFromResend(email.resend_id);
      return {
        ...email,
        details: details || undefined,
      };
    })
  );

  return emailsWithDetails;
}

export async function getEmailsForPolicyWithDetails(policyId: number): Promise<EmailWithDetails[]> {
  const emails = await getEmailsForPolicy(policyId);
  
  // Fetch details for each email
  const emailsWithDetails = await Promise.all(
    emails.map(async (email) => {
      const details = await fetchEmailDetailsFromResend(email.resend_id);
      return {
        ...email,
        details: details || undefined,
      };
    })
  );

  return emailsWithDetails;
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

export async function getAllEmailsForProfileWithDetails(profileId: string): Promise<EmailWithDetails[]> {
  const emails = await getAllEmailsForProfile(profileId);
  
  // Fetch details for each email
  const emailsWithDetails = await Promise.all(
    emails.map(async (email) => {
      const details = await fetchEmailDetailsFromResend(email.resend_id);
      return {
        ...email,
        details: details || undefined,
      };
    })
  );

  return emailsWithDetails;
}




