import { createClient } from "@/lib/server";
import { z } from "zod";
import type { Database } from "@/lib/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

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

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Error fetching current session:", error);
    return null;
  }

  return session;
}
