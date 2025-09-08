import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/client";
import { 
  getPreApplicationsWithDetails, 
  getPreApplicationStats 
} from "@/lib/queries/pre-applications";

export async function GET(request: NextRequest) {
  try {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as any;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0;
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    // Fetch pre-applications
    const preApplications = await getPreApplicationsWithDetails({
      status: status || undefined,
      limit,
      offset,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    });

    return NextResponse.json({
      success: true,
      data: preApplications,
      pagination: {
        limit,
        offset,
        count: preApplications.length,
      },
    });

  } catch (error) {
    console.error("Error fetching pre-applications:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
