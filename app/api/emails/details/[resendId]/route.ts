import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resendId: string }> }
) {
  try {
    const { resendId } = await params;

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

    // Verify that the resend ID exists in our database
    const { data: emailRecord, error: emailError } = await supabase
      .from("resend_emails")
      .select("resend_id")
      .eq("resend_id", resendId)
      .single();

    if (emailError || !emailRecord) {
      return NextResponse.json(
        { error: "Email record not found" },
        { status: 404 }
      );
    }

    // Fetch email details from Resend API
    try {
      const email = await resend.emails.get(resendId);
      
      if (!email.data) {
        return NextResponse.json(
          { error: "Email not found in Resend" },
          { status: 404 }
        );
      }

      const details = {
        id: email.data.id || resendId,
        to: Array.isArray(email.data.to) ? email.data.to : email.data.to ? [email.data.to] : [],
        from: email.data.from || "",
        subject: email.data.subject || "",
        html: email.data.html || "",
        text: email.data.text || "",
        created_at: email.data.created_at || "",
        last_event: email.data.last_event || "sent",
      };

      return NextResponse.json(details);
    } catch (resendError) {
      console.error(`Failed to fetch email details from Resend for ${resendId}:`, resendError);
      return NextResponse.json(
        { error: "Failed to fetch email details from Resend" },
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
