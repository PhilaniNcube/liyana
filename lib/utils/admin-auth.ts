"use server";

import { createClient } from "../server";
import { getCurrentUser } from "../queries";

export interface AdminAuthResult {
  success: boolean;
  user?: any;
  userProfile?: any;
  error?: string;
  details?: string;
}

/**
 * Reusable wrapper function to check if a user is authenticated and has admin privileges
 * @param allowEditor - Whether to allow users with 'editor' role in addition to 'admin'
 * @returns AdminAuthResult with success status and user/profile data or error details
 * 
 * @example
 * ```typescript
 * // Basic admin-only check
 * const authResult = await requireAdminAuth();
 * if (!authResult.success) {
 *   return { error: true, message: authResult.error!, details: authResult.details };
 * }
 * 
 * // Allow both admin and editor
 * const authResult = await requireAdminAuth(true);
 * if (!authResult.success) {
 *   return { error: true, message: authResult.error!, details: authResult.details };
 * }
 * 
 * // Continue with admin-protected logic...
 * ```
 */
export async function requireAdminAuth(allowEditor: boolean = false): Promise<AdminAuthResult> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error: "Authentication required",
        details: "You must be logged in to perform this action.",
      };
    }

    // Get user profile to check role
    const { data: userProfile, error: userProfileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userProfileError || !userProfile) {
      return {
        success: false,
        error: "User profile not found",
        details: userProfileError?.message || "Unable to fetch user profile.",
      };
    }

    // Check if user has required privileges
    const hasRequiredRole = userProfile.role === "admin" || (allowEditor && userProfile.role === "editor");

    if (!hasRequiredRole) {
      const requiredRoles = allowEditor ? "admin or editor" : "admin";
      return {
        success: false,
        error: "Insufficient permissions",
        details: `${requiredRoles.charAt(0).toUpperCase() + requiredRoles.slice(1)} privileges required.`,
      };
    }

    return {
      success: true,
      user,
      userProfile,
    };
  } catch (error) {
    console.error("Error in requireAdminAuth:", error);
    return {
      success: false,
      error: "Authentication check failed",
      details: error instanceof Error ? error.message : "Unknown error occurred.",
    };
  }
}

/**
 * Helper function to create an admin-protected action
 * @param action - The action function to wrap
 * @param allowEditor - Whether to allow users with 'editor' role in addition to 'admin'
 * @returns Function that creates admin-protected action
 * 
 * @example
 * ```typescript
 * // Create an admin-only protected action
 * const protectedAction = await createAdminAction(async (data: string) => {
 *   // Your admin-only logic here
 *   return { success: true, data: "processed" };
 * });
 * 
 * // Use the protected action
 * const result = await protectedAction("some data");
 * ```
 */
export async function createAdminAction<T extends any[], R>(
  action: (...args: T) => Promise<R>,
  allowEditor: boolean = false
): Promise<(...args: T) => Promise<R | { error: true; message: string; details?: string }>> {
  return async (...args: T): Promise<R | { error: true; message: string; details?: string }> => {
    const authResult = await requireAdminAuth(allowEditor);
    
    if (!authResult.success) {
      return {
        error: true,
        message: authResult.error!,
        details: authResult.details,
      };
    }

    // Execute the original action with admin auth confirmed
    return action(...args);
  };
}

/**
 * Utility function to get the current user with admin privileges checked
 * Useful for actions that need the authenticated admin user data
 * @param allowEditor - Whether to allow users with 'editor' role in addition to 'admin'
 * @returns AdminAuthResult with user and profile data
 * 
 * @example
 * ```typescript
 * const adminUser = await getAdminUser();
 * if (!adminUser.success) {
 *   return { error: true, message: adminUser.error! };
 * }
 * 
 * // Use adminUser.user and adminUser.userProfile
 * console.log(`Admin user: ${adminUser.user.email}`);
 * ```
 */
export async function getAdminUser(allowEditor: boolean = false): Promise<AdminAuthResult> {
  return requireAdminAuth(allowEditor);
}