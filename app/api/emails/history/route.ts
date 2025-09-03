import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { getEmailsForApplication, getEmailsForLoan, getEmailsForPolicy } from "@/lib/queries/emails";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId");
    const loanId = searchParams.get("loanId");
    const policyId = searchParams.get("policyId");

    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user has admin or editor role
    const { data: userProfile, error: userProfileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userProfileError || !userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    if (userProfile.role !== "admin" && userProfile.role !== "editor") {
      return NextResponse.json(
        { error: "Access denied. Admin or editor privileges required." },
        { status: 403 }
      );
    }

    let emails;

    if (applicationId) {
      emails = await getEmailsForApplication(parseInt(applicationId));
    } else if (loanId) {
      emails = await getEmailsForLoan(parseInt(loanId));
    } else if (policyId) {
      emails = await getEmailsForPolicy(parseInt(policyId));
    } else {
      return NextResponse.json(
        { error: "Missing required parameter: applicationId, loanId, or policyId" },
        { status: 400 }
      );
    }

    return NextResponse.json(emails);
  } catch (error) {
    console.error("Email history API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
