import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resendId = searchParams.get("resendId");

    if (!resendId) {
      return NextResponse.json(
        { error: "Missing required parameter: resendId" },
        { status: 400 }
      );
    }

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

    // Fetch email details from Resend
    try {
      const email = await resend.emails.get(resendId);
      
      return NextResponse.json({
        id: email.data?.id,
        to: email.data?.to,
        from: email.data?.from,
        subject: email.data?.subject,
        html: email.data?.html,
        text: email.data?.text,
        created_at: email.data?.created_at,
        last_event: email.data?.last_event,
      });
    } catch (resendError) {
      console.error("Resend API error:", resendError);
      return NextResponse.json(
        { 
          error: "Failed to fetch email details from Resend",
          details: resendError instanceof Error ? resendError.message : "Unknown error"
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Email details API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
