import { createClient } from "@/lib/server";
import { z } from "zod";
import type { Database } from "@/lib/types";
import { decryptValue } from "@/lib/encryption";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Helper function to safely decrypt ID number
function safeDecryptIdNumber(encryptedIdNumber: string | null): string | null {
  if (!encryptedIdNumber) {
    return null;
  }

  try {
    return decryptValue(encryptedIdNumber);
  } catch (error) {
    console.error("Failed to decrypt ID number:", error);
    return "Error decrypting";
  }
}

// Types
export interface CurrentUser {
  id: string;
  full_name: string;
  email: string | undefined;
  role: Database["public"]["Enums"]["user_role"];
  created_at: string;
}

// User query schemas
export const getUserByIdSchema = z.object({
  id: z.string().uuid(),
});

export const updateUserProfileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(1).optional(),
  role: z.enum(["customer", "admin", "editor"]).optional(),
});

// Query functions
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // If there's an auth error or no user, return null instead of throwing
    if (error || !user) {
      return null;
    }

    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // If profile doesn't exist or there's an error, return null
    if (profileError || !data) {
      return null;
    }

    return {
      id: data.id,
      full_name: data.full_name,
      email: user.email,
      role: data.role,
      created_at: data.created_at,
    };
  } catch (error) {
    // Log the error for debugging but don't throw it
    console.error("Error fetching current user:", error);
    return null;
  }
}

export async function getUserProfile(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }

  return data;
}

export async function getAllUserProfiles() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .neq("role", "admin") // Exclude admin users
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch user profiles: ${error.message}`);
  }

  return data;
}

export async function getUserProfilesPaginated(
  page: number = 1,
  pageSize: number = 10,
) {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .neq("role", "admin")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.log("Error fetching user profiles:", error.message);
    throw new Error(`Failed to fetch user profiles: ${error.message}`);
  }

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function getUsersByRole(
  role: Database["public"]["Enums"]["user_role"],
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", role)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch users by role: ${error.message}`);
  }

  return data;
}

export async function updateUserProfile(
  userId: string,
  updates: {
    full_name?: string;
    role?: Database["public"]["Enums"]["user_role"];
  },
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user profile: ${error.message}`);
  }

  return data;
}

// write a function to get the current session of the user
export async function getCurrentSession() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(`Failed to get current session: ${error.message}`);
  }

  return data;
}

export async function getUsersWithoutApplications() {
  const supabase = await createClient();

  // Get all user profiles
  const { data: allProfiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (profilesError) {
    throw new Error(`Failed to fetch user profiles: ${profilesError.message}`);
  }

  // Get all unique user IDs who have submitted applications
  const { data: applications, error: applicationsError } = await supabase
    .from("applications")
    .select("user_id")
    .order("created_at", { ascending: false });

  if (applicationsError) {
    throw new Error(
      `Failed to fetch applications: ${applicationsError.message}`,
    );
  }

  // Create a set of user IDs who have applications
  const userIdsWithApplications = new Set(
    applications.map((app) => app.user_id),
  );

  // Filter out users who have submitted applications and exclude admin users
  const usersWithoutApplications = allProfiles.filter(
    (profile) =>
      !userIdsWithApplications.has(profile.id) && profile.role !== "admin",
  );

  return usersWithoutApplications;
}

export async function getUsersWithoutApplicationsPaginated(
  page: number = 1,
  pageSize: number = 10,
) {
  const supabase = await createClient();

  // Get all user profiles with count
  const {
    data: allProfiles,
    error: profilesError,
    count: totalProfiles,
  } = await supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (profilesError) {
    throw new Error(`Failed to fetch user profiles: ${profilesError.message}`);
  }

  // Get all unique user IDs who have submitted applications
  const { data: applications, error: applicationsError } = await supabase
    .from("applications")
    .select("user_id");

  if (applicationsError) {
    throw new Error(
      `Failed to fetch applications: ${applicationsError.message}`,
    );
  }

  // Create a set of user IDs who have applications
  const userIdsWithApplications = new Set(
    applications.map((app) => app.user_id),
  );

  // Filter out users who have submitted applications and exclude admin users
  const usersWithoutApplications = allProfiles.filter(
    (profile) =>
      !userIdsWithApplications.has(profile.id) && profile.role !== "admin",
  );

  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize;
  const paginatedUsers = usersWithoutApplications.slice(from, to);

  // Add decrypted ID numbers to the paginated users
  const usersWithDecryptedIds = paginatedUsers.map((user) => ({
    ...user,
    decrypted_id_number: safeDecryptIdNumber(user.id_number),
  }));

  return {
    data: usersWithDecryptedIds,
    total: usersWithoutApplications.length,
    totalProfiles: totalProfiles || 0,
    usersWithApplications: userIdsWithApplications.size,
    page,
    pageSize,
    totalPages: Math.ceil(usersWithoutApplications.length / pageSize),
  };
}

// Enhanced interface for declined users/applications
export interface DeclinedUserProfile extends Profile {
  decrypted_id_number: string | null;
  application_status?: "declined" | "no_application";
  latest_application_id?: number;
  application_amount?: number;
  declined_at?: string;
  credit_score?: number | null;
}

export async function getDeclinedUsersAndApplicationsPaginated(
  page: number = 1,
  pageSize: number = 10,
  dateFrom?: string,
  dateTo?: string,
  sortBy:
    | "registration_date"
    | "application_date"
    | "name"
    | "status" = "application_date",
  sortOrder: "asc" | "desc" = "desc",
) {
  const supabase = await createClient();

  // Build profile query with optional date filtering
  let profileQuery = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  // Apply date filters if provided
  if (dateFrom) {
    profileQuery = profileQuery.gte("created_at", dateFrom);
  }
  if (dateTo) {
    // Add 1 day to include the entire end date
    const endDate = new Date(dateTo);
    endDate.setDate(endDate.getDate() + 1);
    profileQuery = profileQuery.lt("created_at", endDate.toISOString());
  }

  // Get all user profiles with count
  const {
    data: allProfiles,
    error: profilesError,
    count: totalProfiles,
  } = await profileQuery;

  if (profilesError) {
    throw new Error(`Failed to fetch user profiles: ${profilesError.message}`);
  }


  // Get all applications with status
  const { data: applications, error: applicationsError } = await supabase
    .from("applications")
    .select(
      "user_id, status, id, application_amount, updated_at, created_at, id_number",
    )
    .order("created_at", { ascending: true });

  if (applicationsError) {
    throw new Error(
      `Failed to fetch applications: ${applicationsError.message}`,
    );
  }

  // Get all api_checks for credit_bureau
  const { data: apiChecks, error: apiChecksError } = await supabase
    .from("api_checks")
    .select("id_number, response_payload, checked_at, check_type")
    .eq("check_type", "credit_bureau")
    .order("checked_at", { ascending: false });

  if (apiChecksError) {
    throw new Error(`Failed to fetch api_checks: ${apiChecksError.message}`);
  }

  // Map from id_number to latest credit score (score < 600)
  const creditScoreMap = new Map();
  for (const check of apiChecks) {
    const idNum = check.id_number;
    if (!creditScoreMap.has(idNum)) {
      let score = null;
      try {
        const payload = check.response_payload;
        if (payload && typeof payload === "object" && !Array.isArray(payload)) {
          // Try common keys
          if ("score" in payload && typeof payload["score"] === "number") {
            score = payload["score"];
          } else if ("Score" in payload && typeof payload["Score"] === "number") {
            score = payload["Score"];
          } else if ("data" in payload && payload["data"] && typeof payload["data"] === "object" && !Array.isArray(payload["data"])) {
            const dataObj = payload["data"];
            if ("score" in dataObj && typeof dataObj["score"] === "number") {
              score = dataObj["score"];
            }
          }
        }
      } catch {}
      if (score !== null && !isNaN(Number(score))) {
        creditScoreMap.set(idNum, Number(score));
      }
    }
  }

  // Create maps for application data
  const userApplicationMap = new Map();
  const declinedApplications = new Set<string>();

  applications.forEach((app) => {
    // Keep track of the latest application for each user
    if (
      !userApplicationMap.has(app.user_id) ||
      new Date(app.created_at) >
        new Date(userApplicationMap.get(app.user_id).created_at)
    ) {
      userApplicationMap.set(app.user_id, app);
    }

    // Track users with declined applications
    if (app.status === "declined") {
      declinedApplications.add(app.user_id);
    }
  });

  // Filter profiles to include:
  // 1. Users without any applications (excluding admins)
  // 2. Users with declined applications
  // 3. Users whose latest credit report score is less than 600
  const declinedUsers: DeclinedUserProfile[] = allProfiles
    .filter((profile) => profile.role !== "admin")
    .filter((profile) => {
      // Exclude users with no id_number (cannot check credit score)
      if (!profile.id_number) return false;

      const hasApplication = userApplicationMap.has(profile.id);
      const hasDeclinedApplication = declinedApplications.has(profile.id);

      // Use ID number from application if available, otherwise from profile
      const application = userApplicationMap.get(profile.id);
      const idNumberToCheck = application?.id_number || profile.id_number;
      const creditScore = creditScoreMap.get(idNumberToCheck);

      // Include if: no application OR has declined application OR credit score < 600
      return (
        !hasApplication ||
        hasDeclinedApplication ||
        (creditScore !== undefined && creditScore < 600)
      );
    })
    .map((profile) => {
      const application = userApplicationMap.get(profile.id);
      const hasDeclinedApplication = declinedApplications.has(profile.id);
      const idNumberToDecrypt = application?.id_number || profile.id_number;
      const creditScore = creditScoreMap.get(idNumberToDecrypt);

      return {
        ...profile,
        decrypted_id_number: safeDecryptIdNumber(idNumberToDecrypt),
        application_status:
          (hasDeclinedApplication ? "declined" : "no_application") as
            | "declined"
            | "no_application",
        latest_application_id: application?.id,
        application_amount: application?.application_amount,
        declined_at: hasDeclinedApplication
          ? application?.updated_at
          : undefined,
        credit_score: creditScore,
      };
    })
    .sort((a, b) => {
      const order = sortOrder === "asc" ? 1 : -1;

      switch (sortBy) {
        case "name":
          const nameA = (a.full_name || "").toLowerCase();
          const nameB = (b.full_name || "").toLowerCase();
          return nameA.localeCompare(nameB) * order;

        case "status":
          // Primary sort by status (declined first, then no_application)
          if (a.application_status !== b.application_status) {
            if (
              a.application_status === "declined" &&
              b.application_status === "no_application"
            ) {
              return -1 * order;
            }
            if (
              a.application_status === "no_application" &&
              b.application_status === "declined"
            ) {
              return 1 * order;
            }
          }
          // Secondary sort by registration date
          return (
            (new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()) *
            order
          );

        case "application_date":
          // Sort by application date if available, otherwise registration date
          const dateA = a.declined_at
            ? new Date(a.declined_at).getTime()
            : new Date(a.created_at).getTime();
          const dateB = b.declined_at
            ? new Date(b.declined_at).getTime()
            : new Date(b.created_at).getTime();
          return (dateA - dateB) * order;

        case "registration_date":
        default:
          return (
            (new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()) *
            order
          );
      }
    });

  // Count statistics (excluding admins)
  const totalDeclinedUsers = declinedUsers.length;
  const usersWithDeclinedApplications = declinedUsers.filter(
    (u) => u.application_status === "declined",
  ).length;
  const usersWithoutApplications = declinedUsers.filter(
    (u) => u.application_status === "no_application",
  ).length;

  // Calculate proper statistics excluding admins
  const totalNonAdminProfiles = (allProfiles || []).filter(
    (profile) => profile.role !== "admin",
  ).length;

  // Count users with successful applications (not declined)
  const usersWithSuccessfulApplications = new Set<string>();
  applications.forEach((app) => {
    if (app.status !== "declined") {
      usersWithSuccessfulApplications.add(app.user_id);
    }
  });

  // Filter to only count non-admin users with successful applications
  const nonAdminUsersWithSuccessfulApplications = Array.from(
    usersWithSuccessfulApplications,
  ).filter((userId) => {
    const profile = allProfiles?.find((p) => p.id === userId);
    return profile && profile.role !== "admin";
  }).length;

  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize;
  const paginatedUsers = declinedUsers.slice(from, to);

  return {
    data: paginatedUsers,
    total: totalDeclinedUsers,
    totalProfiles: totalNonAdminProfiles,
    usersWithDeclinedApplications,
    usersWithoutApplications,
    usersWithApplications: nonAdminUsersWithSuccessfulApplications,
    page,
    pageSize,
    totalPages: Math.ceil(totalDeclinedUsers / pageSize),
  };
}
