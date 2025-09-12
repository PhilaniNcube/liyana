import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { markPreApplicationAsAbandoned } from "@/lib/queries/pre-applications";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const preApplicationId = parseInt(id);

    if (isNaN(preApplicationId)) {
      return NextResponse.json(
        { error: "Invalid pre-application ID" },
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

    if (userProfile.role !== "admin" && userProfile.role !== "editor") {
      return NextResponse.json(
        { error: "Access denied. Admin or editor privileges required." },
        { status: 403 }
      );
    }

    // Mark as abandoned
    await markPreApplicationAsAbandoned(preApplicationId);

    return NextResponse.json({
      success: true,
      message: "Pre-application marked as abandoned",
    });

  } catch (error) {
    console.error("Error marking pre-application as abandoned:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
