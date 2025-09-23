import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/service";
import { getCurrentUser } from "@/lib/queries/user";

export async function GET(request: NextRequest) {
  try {
    // Check if user has admin privileges
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const supabase = await createServiceClient();

    // Check if user has admin or editor role
    const { data: userProfile, error: userProfileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
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

    const searchQuery = request.nextUrl.searchParams.get("q") || "";
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50");

    let query = supabase
      .from("profiles")
      .select("id, full_name, email, phone_number, created_at")
      .neq("role", "admin") // Exclude admin users
      .order("full_name", { ascending: true })
      .limit(limit);

    // Add search filter if query provided
    if (searchQuery) {
      query = query.ilike("full_name", `%${searchQuery}%`);
    }

    const { data: profiles, error } = await query;
 
    console.log({ profiles, error });

    if (error) {
      console.error("Failed to fetch profiles:", error);
      return NextResponse.json(
        { error: "Failed to fetch user profiles" },
        { status: 500 }
      );
    }



    return NextResponse.json(
      {
        success: true,
        profiles: profiles || []
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error in search users API:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 500 }
    );
  }
}