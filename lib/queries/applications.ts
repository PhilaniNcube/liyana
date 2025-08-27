import { createClient } from "@/lib/server";
import { z } from "zod";
import type { Database } from "@/lib/types";
import { decryptValue } from "@/lib/encryption";

type ApplicationUpdate = Database["public"]["Tables"]["applications"]["Update"];
type Application = Database["public"]["Tables"]["applications"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Enhanced application type with profile data
export type ApplicationWithProfile = Application & {
  profile: Profile | null;
  // Convenience field for UI: decrypted id number when available
  id_number_decrypted?: string | null;
};

// Schemas
export const getApplicationByIdSchema = z.object({ id: z.number() });
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

export async function getApplicationById(id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(`Failed to fetch application: ${error.message}`);
  return data;
}

export async function getApplicationByIdWithProfile(
  id: number
): Promise<ApplicationWithProfile> {
  const supabase = await createClient();
  const { data: application, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(`Failed to fetch application: ${error.message}`);
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", application.user_id)
    .single();
  if (profileError) {
    console.warn("Failed to fetch profile details:", profileError.message);
    return { ...application, profile: null };
  }
  return { ...application, profile };
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
  if (options.limit) query = query.limit(options.limit);
  if (options.offset)
    query = query.range(
      options.offset,
      options.offset + (options.limit || 10) - 1
    );
  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch applications: ${error.message}`);
  return data;
}

export async function getApplicationsByStatus(
  status: Database["public"]["Enums"]["application_status"],
  options: { limit?: number } = {}
) {
  const supabase = await createClient();
  let query = supabase
    .from("applications")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });
  if (options.limit) query = query.limit(options.limit);
  const { data, error } = await query;
  if (error)
    throw new Error(
      `Failed to fetch applications by status: ${error.message}`
    );
  return data;
}

export async function getAllApplications(
  options: { limit?: number; offset?: number } = {}
): Promise<ApplicationWithProfile[]> {
  const supabase = await createClient();

  let query = supabase
    .from("applications")
    .select("*")
    .neq("status", "declined") // Exclude declined applications
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

  const { data: applications, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch applications: ${error.message}`);
  }

  // If we have applications, fetch profile details separately
  if (applications && applications.length > 0) {
    const userIds = [...new Set(applications.map((app) => app.user_id))];

    // Fetch profile details
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds);

    if (profilesError) {
      console.warn("Failed to fetch profile details:", profilesError.message);
      // Return applications with null profile data if profile fetch fails
      return applications.map((app) => ({ ...app, profile: null }));
    }

    // Create a map of profile data for quick lookup
    const profileMap = new Map(
      profiles?.map((profile) => [profile.id, profile]) || []
    );

    // Enhance applications with profile data
    const enhancedApplications = applications.map((app) => {
      let decrypted: string | null = null;
      try {
        decrypted = app.id_number ? decryptValue(app.id_number) : null;
      } catch {
        // Fallback to stored value if not decryptable (legacy/plaintext)
        decrypted = app.id_number ?? null;
      }

      return {
        ...app,
        profile: profileMap.get(app.user_id) || null,
        id_number_decrypted: decrypted,
      } as ApplicationWithProfile;
    });

    return enhancedApplications;
  }

  return [];
}

export async function getApplicationsWithDocuments(applicationId: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("applications")
    .select(
      `
      *,
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


export async function getDeclinedApplications(
  page: number = 1,
  per_page: number = 50,
  start_date: string,
  end_date: string
) {
  const supabase = await createClient();

  // 1. Fetch declined applications within date range
  const { data: declinedApps, error: declinedError } = await supabase
    .from("applications")
    .select("*")
    .eq("status", "declined")
    .gte("created_at", start_date)
    .lte("created_at", end_date);
  if (declinedError) {
    throw new Error(`Failed to fetch declined applications: ${declinedError.message}`);
  }

  const declinedUserIds = Array.from(new Set(declinedApps.map(a => a.user_id)));

  // Fetch profiles for those declined applications
  let profileMap: Map<string, Profile> = new Map();
  if (declinedUserIds.length > 0) {
    const { data: declinedProfiles, error: declinedProfilesError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", declinedUserIds);
    if (!declinedProfilesError && declinedProfiles) {
      profileMap = new Map(declinedProfiles.map(p => [p.id, p]));
    }
  }

  // Decrypt id_numbers for applications
  const declinedAppRecords = declinedApps.map(app => {
    let decrypted: string | null = null;
    try { decrypted = decryptValue(app.id_number); } catch { decrypted = app.id_number; }
    return { ...app, id_number: decrypted };
  });

  // 2. Fetch failed credit bureau checks within date range
  const { data: failedChecks, error: failedChecksError } = await supabase
    .from("api_checks")
    .select("*")
    .eq("check_type", "credit_bureau")
    .eq("status", "failed")
    .gte("checked_at", start_date)
    .lte("checked_at", end_date);
  if (failedChecksError) {
    throw new Error(`Failed to fetch failed credit checks: ${failedChecksError.message}`);
  }

  // Decrypt credit check id_numbers
  const decryptedFailedChecks = failedChecks.map(check => {
    let decrypted: string | null = null;
    try { decrypted = decryptValue(check.id_number); } catch { decrypted = check.id_number; }
    return { ...check, id_number: decrypted };
  });

  // 3. Fetch candidate profiles (with id_number not null, created within range) to match failed checks
  const { data: candidateProfiles, error: candidateProfilesError } = await supabase
    .from("profiles")
    .select("*")
    .not("id_number", "is", null)
    .gte("created_at", start_date)
    .lte("created_at", end_date);
  if (candidateProfilesError) {
    console.warn("Failed to fetch candidate profiles for failed checks:", candidateProfilesError.message);
  }

  // Build decrypted profile id number map
  const profileByDecryptedId = new Map<string, Profile>();
  (candidateProfiles || []).forEach(p => {
    if (!p.id_number) return;
    try {
      const dec = decryptValue(p.id_number);
      profileByDecryptedId.set(dec, p);
    } catch {
      // ignore decryption failure
    }
  });

  // Match failed checks to profiles
  const failedCheckMatches: { profile: Profile; credit_check: any; id_number: string | null }[] = [];
  decryptedFailedChecks.forEach(ch => {
    const prof = profileByDecryptedId.get(ch.id_number);
    if (prof) {
      failedCheckMatches.push({ profile: prof, credit_check: ch, id_number: ch.id_number });
      // ensure profileMap contains this profile for potential merging
      if (!profileMap.has(prof.id)) profileMap.set(prof.id, prof);
    }
  });

  // Combine into user-centric list
  interface UnifiedUser {
    profile: Profile | null;
    application?: any | null;
    credit_check?: any | null;
    id_number: string | null;
    reason: 'declined_application' | 'failed_credit_check' | 'both';
  }
  const unified = new Map<string, UnifiedUser>();

  declinedAppRecords.forEach(app => {
    const prof = profileMap.get(app.user_id) || null;
    const current = unified.get(app.user_id);
    if (current) {
      current.application = app;
      current.reason = current.reason === 'failed_credit_check' ? 'both' : 'declined_application';
    } else {
      unified.set(app.user_id, {
        profile: prof,
        application: app,
        credit_check: null,
        id_number: app.id_number,
        reason: 'declined_application'
      });
    }
  });

  failedCheckMatches.forEach(({ profile, credit_check, id_number }) => {
    const key = profile.id;
    const current = unified.get(key);
    if (current) {
      current.credit_check = credit_check;
      current.reason = current.reason === 'declined_application' ? 'both' : 'failed_credit_check';
      if (!current.id_number) current.id_number = id_number;
    } else {
      unified.set(key, {
        profile,
        application: null,
        credit_check,
        id_number,
        reason: 'failed_credit_check'
      });
    }
  });

  // Convert to array and sort by most recent event (application.created_at or credit_check.checked_at or profile.created_at)
  const unifiedArray = Array.from(unified.values()).sort((a, b) => {
    const aDate = new Date(a.application?.created_at || a.credit_check?.checked_at || a.profile?.created_at || 0).getTime();
    const bDate = new Date(b.application?.created_at || b.credit_check?.checked_at || b.profile?.created_at || 0).getTime();
    return bDate - aDate;
  });

  // Pagination in memory
  const start = (page - 1) * per_page;
  const end = start + per_page;
  return unifiedArray.slice(start, end);
}