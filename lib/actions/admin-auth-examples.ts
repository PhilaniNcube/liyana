/**
 * Examples of how to use the admin authentication wrapper functions
 * 
 * This file demonstrates different patterns for implementing admin-only actions
 * using the reusable admin-auth utilities.
 */

"use server";

import { requireAdminAuth, getAdminUser, createAdminAction } from "@/lib/utils/admin-auth";
import { createClient } from "@/lib/server";

// Example 1: Basic admin check pattern (most common)
export async function deleteUserExample(userId: string) {
  // Check admin authentication first
  const authResult = await requireAdminAuth();
  if (!authResult.success) {
    return {
      error: true,
      message: authResult.error!,
      details: authResult.details,
    };
  }

  // Proceed with admin-only logic
  const supabase = await createClient();
  
  // ... your admin-only logic here
  console.log(`Admin ${authResult.user.email} is deleting user ${userId}`);
  
  return {
    error: false,
    message: "User deleted successfully",
  };
}

// Example 2: Allow both admin and editor
export async function updateApplicationStatusExample(applicationId: number, status: string) {
  // Allow both admin and editor roles
  const authResult = await requireAdminAuth(true);
  if (!authResult.success) {
    return {
      error: true,
      message: authResult.error!,
      details: authResult.details,
    };
  }

  // Proceed with admin/editor logic
  const supabase = await createClient();
  
  // ... your logic here
  console.log(`${authResult.userProfile.role} ${authResult.user.email} is updating application ${applicationId}`);
  
  return {
    error: false,
    message: "Application status updated successfully",
  };
}

// Example 3: Using getAdminUser when you need user data
export async function getAdminDashboardDataExample() {
  const adminUser = await getAdminUser();
  if (!adminUser.success) {
    return {
      error: true,
      message: adminUser.error!,
      details: adminUser.details,
    };
  }

  // Use the admin user data
  const supabase = await createClient();
  
  // ... fetch admin-only data
  console.log(`Loading dashboard for admin: ${adminUser.user.email}`);
  
  return {
    error: false,
    data: {
      adminEmail: adminUser.user.email,
      role: adminUser.userProfile.role,
      // ... other dashboard data
    },
  };
}

// Example 4: Using createAdminAction for dynamic wrapping (advanced)
export async function createProtectedActionExample() {
  // Create a protected version of any action
  const protectedAction = await createAdminAction(async (message: string) => {
    // This will only run if user is admin
    console.log(`Admin action executed: ${message}`);
    return { success: true, processed: message };
  });

  // Use the protected action
  return await protectedAction("test message");
}

// Example 5: Conditional admin check for optional features
export async function sendEmailWithAttachmentsExample(
  recipientId: string,
  message: string,
  attachments?: File[]
) {
  const supabase = await createClient();
  
  // Anyone can send basic emails, but only admins can send with attachments
  if (attachments && attachments.length > 0) {
    const authResult = await requireAdminAuth(true); // Allow editor too
    if (!authResult.success) {
      return {
        error: true,
        message: "Only admin or editor users can send emails with attachments.",
        details: authResult.details,
      };
    }
  }

  // Proceed with email sending logic
  console.log(`Sending email to ${recipientId} with ${attachments?.length || 0} attachments`);
  
  return {
    error: false,
    message: "Email sent successfully",
  };
}

// Example 6: Multiple admin checks in complex workflows
export async function complexAdminWorkflowExample(workflowId: string) {
  // Step 1: Check if user can initiate workflow
  const authResult = await requireAdminAuth();
  if (!authResult.success) {
    return {
      error: true,
      message: authResult.error!,
      details: authResult.details,
    };
  }

  const supabase = await createClient();
  
  // Step 2: Validate workflow
  // ... validation logic
  
  // Step 3: Check admin permissions again for critical operations
  const finalAuthCheck = await requireAdminAuth();
  if (!finalAuthCheck.success) {
    return {
      error: true,
      message: "Admin privileges lost during workflow execution",
    };
  }

  // Step 4: Execute critical admin operations
  console.log(`Admin ${authResult.user.email} executing workflow ${workflowId}`);
  
  return {
    error: false,
    message: "Workflow completed successfully",
    executedBy: authResult.user.email,
  };
}