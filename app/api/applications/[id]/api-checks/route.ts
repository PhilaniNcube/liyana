import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const applicationId = parseInt(id);

    if (isNaN(applicationId)) {
      return NextResponse.json(
        { error: "Invalid application ID" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if user is authenticated
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

    // Check if user has admin or editor role to view API checks
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

    // Get the application to find the user_id (profile_id)
    const { data: application, error: applicationError } = await supabase
      .from("applications")
      .select("user_id")
      .eq("id", applicationId)
      .single();

    if (applicationError || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Fetch API checks for this application's profile
    const { data: apiChecks, error: apiCheckError } = await supabase
      .from("api_checks")
      .select("*")
      .eq("profile_id", application.user_id)
      .order("checked_at", { ascending: false });

    if (apiCheckError) {
      console.error("Failed to fetch API checks:", apiCheckError);
      return NextResponse.json(
        { error: "Failed to fetch API checks" },
        { status: 500 }
      );
    }

    return NextResponse.json(apiChecks || []);
  } catch (error) {
    console.error("API checks API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
