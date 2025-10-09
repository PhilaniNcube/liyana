import { createClient } from "@/lib/server";
import { Tables } from "@/lib/types";
import { z } from "zod";

// Analytics query schemas
export const getApplicationsOverTimeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  groupBy: z.enum(["day", "week", "month"]).default("day"),
});

export const getApplicationsByDateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

// Analytics and reporting functions
export async function getDashboardStats() {
  const supabase = await createClient();

  // Get applications count by status
  const { data: applications, error: appError } = await supabase
    .from("applications")
    .select("*")
    .returns<Pick<Tables<"applications">, "status" | "application_amount" | "created_at">[]>();

  if (appError) {
    console.error("Error fetching applications for dashboard:", appError);
return [];
  }

  // Get API checks count by status
  const { data: apiChecks, error: apiError } = await supabase
    .from("api_checks")
    .select("status, check_type")
    .returns<Pick<Tables<"api_checks">, "status" | "check_type">[]>();

  if (apiError) {
    console.error("Error fetching API checks for dashboard:", apiError);
    return [];
  }

  // Get documents count
  const { data: documents, error: docError } = await supabase
    .from("documents")
    .select("document_type")
    .returns<Pick<Tables<"documents">, "document_type">[]>();

  if (docError) {
    console.error("Error fetching documents for dashboard:", docError);
    return [];
  }

  // Get user profiles count
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .returns<Pick<Tables<"profiles">, "role">[]>();

  if (profileError) {
    console.error("Error fetching profiles for dashboard:", profileError);
    return [];
  }

  // Calculate application stats
  const applicationStats = applications.reduce(
    (acc, app) => {
      acc.total += 1;
      acc.totalAmount += app.application_amount || 0;

      switch (app.status) {
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
          acc.approvedAmount += app.application_amount || 0;
          break;
        case "declined":
          acc.declined += 1;
          break;
      }

      // Count applications from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (new Date(app.created_at) > thirtyDaysAgo) {
        acc.last30Days += 1;
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
      last30Days: 0,
    }
  );

  // Calculate API check stats
  const apiCheckStats = apiChecks.reduce(
    (acc, check) => {
      acc.total += 1;

      switch (check.status) {
        case "passed":
          acc.passed += 1;
          break;
        case "failed":
          acc.failed += 1;
          break;
        case "pending":
          acc.pending += 1;
          break;
      }

      return acc;
    },
    {
      total: 0,
      passed: 0,
      failed: 0,
      pending: 0,
    }
  );

  // Calculate document stats
  const documentStats = documents.reduce(
    (acc, doc) => {
      acc.total += 1;

      switch (doc.document_type) {
        case "id":
          acc.idDocuments += 1;
          break;
        case "bank_statement":
          acc.bankStatements += 1;
          break;
        case "payslip":
          acc.payslips += 1;
          break;
        case "proof_of_residence":
          acc.proofOfResidence += 1;
          break;
      }

      return acc;
    },
    {
      total: 0,
      idDocuments: 0,
      bankStatements: 0,
      payslips: 0,
      proofOfResidence: 0,
    }
  );

  // Calculate user stats
  const userStats = profiles.reduce(
    (acc, profile) => {
      acc.total += 1;

      switch (profile.role) {
        case "customer":
          acc.customers += 1;
          break;
        case "admin":
          acc.admins += 1;
          break;
        case "editor":
          acc.editors += 1;
          break;
      }

      return acc;
    },
    {
      total: 0,
      customers: 0,
      admins: 0,
      editors: 0,
    }
  );

  return {
    applications: {
      ...applicationStats,
      approvalRate:
        applicationStats.total > 0
          ? (applicationStats.approved / applicationStats.total) * 100
          : 0,
      averageAmount:
        applicationStats.total > 0
          ? applicationStats.totalAmount / applicationStats.total
          : 0,
    },
    apiChecks: {
      ...apiCheckStats,
      passRate:
        apiCheckStats.total > 0
          ? (apiCheckStats.passed / apiCheckStats.total) * 100
          : 0,
    },
    documents: documentStats,
    users: userStats,
  };
}

export async function getApplicationsOverTime(
  startDate: string,
  endDate: string,
  groupBy: "day" | "week" | "month" = "day"
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("applications")
    .select("created_at, status")
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .order("created_at", { ascending: true })
    .returns<Pick<Tables<"applications">, "created_at" | "status">[]>();

  if (error) {
    throw new Error(`Failed to fetch applications over time: ${error.message}`);
  }

  // Group applications by time period
  const grouped = data.reduce((acc, app) => {
    const date = new Date(app.created_at);
    let key: string;

    switch (groupBy) {
      case "month":
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
        break;
      case "week":
        // Get week number
        const weekNumber = getWeekNumber(date);
        key = `${date.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
        break;
      default:
        key = date.toISOString().split("T")[0];
    }

    if (!acc[key]) {
      acc[key] = {
        date: key,
        total: 0,
        approved: 0,
        declined: 0,
        pending: 0,
        inReview: 0,
      };
    }

    acc[key].total += 1;

    switch (app.status) {
      case "approved":
        acc[key].approved += 1;
        break;
      case "declined":
        acc[key].declined += 1;
        break;
      case "in_review":
        acc[key].inReview += 1;
        break;
      default:
        acc[key].pending += 1;
    }

    return acc;
  }, {} as Record<string, {
    date: string;
    total: number;
    approved: number;
    declined: number;
    pending: number;
    inReview: number;
  }>);

  return Object.values(grouped);
}

export async function getApplicationTrends() {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  // Get applications from last 30 days
  const { data: last30Days, error: error30 } = await supabase
    .from("applications")
    .select("status, application_amount")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .returns<Pick<Tables<"applications">, "status" | "application_amount">[]>();

  if (error30) {
    throw new Error(
      `Failed to fetch last 30 days applications: ${error30.message}`
    );
  }

  // Get applications from 30-60 days ago
  const { data: previous30Days, error: error60 } = await supabase
    .from("applications")
    .select("status, application_amount")
    .gte("created_at", sixtyDaysAgo.toISOString())
    .lt("created_at", thirtyDaysAgo.toISOString())
    .returns<Pick<Tables<"applications">, "status" | "application_amount">[]>();

  if (error60) {
    throw new Error(
      `Failed to fetch previous 30 days applications: ${error60.message}`
    );
  }

  const calculateStats = (
    applications: Pick<Tables<"applications">, "status" | "application_amount">[]
  ) => {
    return applications.reduce(
      (acc, app) => {
        acc.total += 1;
        acc.totalAmount += app.application_amount || 0;

        if (app.status === "approved") {
          acc.approved += 1;
          acc.approvedAmount += app.application_amount || 0;
        } else if (app.status === "declined") {
          acc.declined += 1;
        }

        return acc;
      },
      {
        total: 0,
        totalAmount: 0,
        approved: 0,
        declined: 0,
        approvedAmount: 0,
      }
    );
  };

  const current = calculateStats(last30Days);
  const previous = calculateStats(previous30Days);

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return {
    current: {
      ...current,
      approvalRate:
        current.total > 0 ? (current.approved / current.total) * 100 : 0,
    },
    previous: {
      ...previous,
      approvalRate:
        previous.total > 0 ? (previous.approved / previous.total) * 100 : 0,
    },
    growth: {
      applications: calculateGrowth(current.total, previous.total),
      approvals: calculateGrowth(current.approved, previous.approved),
      amount: calculateGrowth(current.totalAmount, previous.totalAmount),
      approvalRate: calculateGrowth(
        current.total > 0 ? (current.approved / current.total) * 100 : 0,
        previous.total > 0 ? (previous.approved / previous.total) * 100 : 0
      ),
    },
  };
}

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
