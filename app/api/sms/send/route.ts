import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { sendSms } from "@/lib/actions/sms";
import { z } from "zod";

const requestSchema = z.object({
  profileId: z.string().uuid("Invalid profile ID"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  message: z.string().min(1, "Message is required").max(160, "Message must be 160 characters or less"),
  applicationId: z.number().optional(),
  policyId: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const result = requestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { profileId, phoneNumber, message, applicationId, policyId } = result.data;

    const supabase = await createClient();

    // Check if user is authenticated and is admin/editor
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

    // Validate phone number format
    const phoneRegex = /^(\+27|0)[0-9]{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json(
        {
          error: "Invalid phone number format. Use South African format (+27xxxxxxxxx or 0xxxxxxxxx)",
        },
        { status: 400 }
      );
    }

    // Convert phone number to international format if needed
    let formattedPhoneNumber = phoneNumber;
    if (phoneNumber.startsWith("0")) {
      formattedPhoneNumber = "+27" + phoneNumber.substring(1);
    }

    try {
      // Send the SMS using the SMS Portal
      await sendSms(formattedPhoneNumber, message);
    } catch (smsError) {
      console.error("SMS sending failed:", smsError);
      return NextResponse.json(
        {
          error: "Failed to send SMS",
          details: smsError instanceof Error ? smsError.message : "Unknown SMS error",
        },
        { status: 500 }
      );
    }

    // Save SMS log to database
    const { error: saveError } = await supabase
      .from("sms_logs")
      .insert({
        profile_id: profileId,
        phone_number: formattedPhoneNumber,
        message: message,
      });

    if (saveError) {
      console.error("Failed to save SMS log:", saveError);
      // Don't fail the request if we can't save the log, but log the error
    }

    return NextResponse.json({
      success: true,
      message: "SMS sent successfully",
      phoneNumber: formattedPhoneNumber,
      messageLength: message.length,
      profileId: profileId,
    });

  } catch (error) {
    console.error("SMS API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "SMS Sending API Endpoint",
      usage: "Send POST request with { profileId, phoneNumber, message } in body",
      example: {
        profileId: "550e8400-e29b-41d4-a716-446655440000",
        phoneNumber: "+27123456789",
        message: "Hello from Liyana Finance!",
        applicationId: 123, // optional
        policyId: 456, // optional
      },
      notes: [
        "Phone number should be in South African format (+27xxxxxxxxx or 0xxxxxxxxx)",
        "Message should be max 160 characters",
        "Requires authentication and admin/editor role",
        "SMS logs are automatically saved to the database",
      ],
    },
    { status: 200 }
  );
}
