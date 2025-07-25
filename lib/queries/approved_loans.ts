import { createClient } from "@/lib/server";
import { z } from "zod";
import type { Database } from "@/lib/types";
import { decryptValue } from "@/lib/encryption";

type ApprovedLoan = Database["public"]["Tables"]["approved_loans"]["Row"];
type Application = Database["public"]["Tables"]["applications"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Enhanced approved loan type with application and profile data
export type ApprovedLoanWithDetails = ApprovedLoan & {
  application: Application | null;
  profile: Profile | null;
};

// Helper function to decrypt application data
function decryptApplication(
  application: Application | null
): Application | null {
  if (!application) return null;

  return {
    ...application,
    id_number: application.id_number
      ? decryptValue(application.id_number)
      : application.id_number,
  };
}

// Query schemas
export const getApprovedLoanByIdSchema = z.object({
  id: z.number(),
});

export const getApprovedLoansByUserSchema = z.object({
  userId: z.string().uuid(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

export const getApprovedLoansByStatusSchema = z.object({
  status: z.string(),
  limit: z.number().min(1).max(100).optional(),
});

// Query functions

export async function getApprovedApplications(
  options: {
    limit?: number;
    offset?: number;
    fromDate?: string;
    toDate?: string;
  } = {}
): Promise<ApprovedLoanWithDetails[]> {
  const supabase = await createClient();

  let query = supabase
    .from("approved_loans")
    .select("*")
    .order("created_at", { ascending: false });

  // Apply date filters
  if (options.fromDate) {
    query = query.gte("approved_date", options.fromDate);
  }

  if (options.toDate) {
    // Add one day to include the entire end date
    const endDate = new Date(options.toDate);
    endDate.setDate(endDate.getDate() + 1);
    query = query.lt("approved_date", endDate.toISOString().split("T")[0]);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(
      options.offset,
      options.offset + (options.limit || 10) - 1
    );
  }

  const { data: loans, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch approved applications: ${error.message}`);
  }

  // If we have loans, fetch application and profile details separately
  if (loans && loans.length > 0) {
    // Fetch applications
    const applicationIds = [
      ...new Set(loans.map((loan) => loan.application_id)),
    ];
    const { data: applications, error: applicationsError } = await supabase
      .from("applications")
      .select("*")
      .in("id", applicationIds);

    if (applicationsError) {
      console.warn(
        "Failed to fetch application details:",
        applicationsError.message
      );
    }

    // Fetch profiles
    const profileIds = [
      ...new Set(
        loans
          .map((loan) => loan.profile_id)
          .filter((id): id is string => id !== null)
      ),
    ];
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", profileIds);

    if (profilesError) {
      console.warn("Failed to fetch profile details:", profilesError.message);
    }

    // Create maps for quick lookup
    const applicationMap = new Map(
      applications?.map((app) => [app.id, app]) || []
    );
    const profileMap = new Map(
      profiles?.map((profile) => [profile.id, profile]) || []
    );

    // Enhance loans with application and profile data (with decrypted applications)
    const enhancedLoans = loans.map((loan) => ({
      ...loan,
      application: decryptApplication(
        applicationMap.get(loan.application_id) || null
      ),
      profile: profileMap.get(loan.profile_id || "") || null,
    }));

    return enhancedLoans;
  }

  return [];
}

export async function getApprovedLoansByUser(
  userId: string,
  options: { limit?: number; offset?: number } = {}
) {
  const supabase = await createClient();

  let query = supabase
    .from("approved_loans")
    .select("*")
    .eq("profile_id", userId)
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
    throw new Error(`Failed to fetch approved loans by user: ${error.message}`);
  }

  return data;
}

export async function getApprovedLoansByStatus(
  status: string,
  options: { limit?: number } = {}
) {
  const supabase = await createClient();

  let query = supabase
    .from("approved_loans")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(
      `Failed to fetch approved loans by status: ${error.message}`
    );
  }

  return data;
}

export async function getApprovedLoansStats() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("approved_loans")
    .select("status, total_repayment_amount, monthly_payment");

  if (error) {
    throw new Error(`Failed to fetch approved loans stats: ${error.message}`);
  }

  // Calculate statistics
  const stats = data.reduce(
    (acc, loan) => {
      acc.total += 1;
      acc.totalAmount += loan.total_repayment_amount || 0;
      acc.totalMonthlyPayments += loan.monthly_payment || 0;

      // You can add more specific status-based calculations here
      // based on your loan status values

      return acc;
    },
    {
      total: 0,
      totalAmount: 0,
      totalMonthlyPayments: 0,
    }
  );

  return stats;
}

export async function updateApprovedLoanStatus(loanId: number, status: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("approved_loans")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", loanId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update approved loan status: ${error.message}`);
  }

  return data;
}

export const getApprovedLoanByApplicationId = async (applicationId: string) => {
  const supabase = await createClient();

  const { data: loan, error } = await supabase
    .from("approved_loans")
    .select(
      `
      *,
      application:applications(*),
      profile:profiles(*)
    `
    )
    .eq("application_id", Number(applicationId))
    .single();

  if (error) {
    console.error("Error fetching approved loan by application ID:", error);
    return null;
  }

  if (!loan) {
    return null;
  }

  return {
    ...loan,
    application: decryptApplication(loan.application),
  } as ApprovedLoanWithDetails;
};
