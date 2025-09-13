import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { getSmsHistoryByProfileId } from "@/lib/queries/sms";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");

    if (!profileId) {
      return NextResponse.json(
        { error: "profileId is required" },
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

    if (!["admin", "editor"].includes(userProfile.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Fetch SMS history
    const smsHistory = await getSmsHistoryByProfileId(profileId);

    return NextResponse.json({
      success: true,
      data: smsHistory,
    });
  } catch (error) {
    console.error("Error fetching SMS history:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}