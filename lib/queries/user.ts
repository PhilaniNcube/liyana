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
  pageSize: number = 5
) {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .neq("role", "admin") // Exclude admin users
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
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
  role: Database["public"]["Enums"]["user_role"]
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
  }
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
      `Failed to fetch applications: ${applicationsError.message}`
    );
  }

  // Create a set of user IDs who have applications
  const userIdsWithApplications = new Set(
    applications.map((app) => app.user_id)
  );

  // Filter out users who have submitted applications and exclude admin users
  const usersWithoutApplications = allProfiles.filter(
    (profile) =>
      !userIdsWithApplications.has(profile.id) && profile.role !== "admin"
  );

  return usersWithoutApplications;
}

export async function getUsersWithoutApplicationsPaginated(
  page: number = 1,
  pageSize: number = 10
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
      `Failed to fetch applications: ${applicationsError.message}`
    );
  }

  // Create a set of user IDs who have applications
  const userIdsWithApplications = new Set(
    applications.map((app) => app.user_id)
  );

  // Filter out users who have submitted applications and exclude admin users
  const usersWithoutApplications = allProfiles.filter(
    (profile) =>
      !userIdsWithApplications.has(profile.id) && profile.role !== "admin"
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
}

export async function getDeclinedUsersAndApplicationsPaginated(
  page: number = 1,
  pageSize: number = 10
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

  // Get all applications with status
  const { data: applications, error: applicationsError } = await supabase
    .from("applications")
    .select("user_id, status, id, application_amount, updated_at, created_at")
    .order("created_at", { ascending: false });

  if (applicationsError) {
    throw new Error(
      `Failed to fetch applications: ${applicationsError.message}`
    );
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
  const declinedUsers: DeclinedUserProfile[] = allProfiles
    .filter((profile) => profile.role !== "admin")
    .filter((profile) => {
      const hasApplication = userApplicationMap.has(profile.id);
      const hasDeclinedApplication = declinedApplications.has(profile.id);

      // Include if: no application OR has declined application
      return !hasApplication || hasDeclinedApplication;
    })
    .map((profile) => {
      const application = userApplicationMap.get(profile.id);
      const hasDeclinedApplication = declinedApplications.has(profile.id);

      return {
        ...profile,
        decrypted_id_number: safeDecryptIdNumber(profile.id_number),
        application_status: (hasDeclinedApplication
          ? "declined"
          : "no_application") as "declined" | "no_application",
        latest_application_id: application?.id,
        application_amount: application?.application_amount,
        declined_at: hasDeclinedApplication
          ? application?.updated_at
          : undefined,
      };
    })
    .sort((a, b) => {
      // Sort by: declined applications first, then by creation date (newest first)
      if (
        a.application_status === "declined" &&
        b.application_status === "no_application"
      ) {
        return -1;
      }
      if (
        a.application_status === "no_application" &&
        b.application_status === "declined"
      ) {
        return 1;
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

  // Count statistics
  const totalDeclinedUsers = declinedUsers.length;
  const usersWithDeclinedApplications = declinedUsers.filter(
    (u) => u.application_status === "declined"
  ).length;
  const usersWithoutApplications = declinedUsers.filter(
    (u) => u.application_status === "no_application"
  ).length;
  const totalUsersWithAnyApplication = userApplicationMap.size;

  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize;
  const paginatedUsers = declinedUsers.slice(from, to);

  return {
    data: paginatedUsers,
    total: totalDeclinedUsers,
    totalProfiles: totalProfiles || 0,
    usersWithDeclinedApplications,
    usersWithoutApplications,
    usersWithApplications: totalUsersWithAnyApplication,
    page,
    pageSize,
    totalPages: Math.ceil(totalDeclinedUsers / pageSize),
  };
}
