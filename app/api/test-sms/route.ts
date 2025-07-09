import { NextRequest, NextResponse } from "next/server";
import { sendSms } from "@/lib/actions/sms";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, message } = body;

    // Validate input
    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: "Phone number and message are required" },
        { status: 400 }
      );
    }

    // Basic phone number validation (South African format)
    const phoneRegex = /^(\+27|0)[0-9]{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json(
        {
          error:
            "Invalid phone number format. Use South African format (+27xxxxxxxxx or 0xxxxxxxxx)",
        },
        { status: 400 }
      );
    }

    // Ensure message is not empty and not too long
    if (message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 }
      );
    }

    if (message.length > 160) {
      return NextResponse.json(
        { error: "Message is too long. Maximum 160 characters allowed." },
        { status: 400 }
      );
    }

    // Convert phone number to international format if needed
    let formattedPhoneNumber = phoneNumber;
    if (phoneNumber.startsWith("0")) {
      formattedPhoneNumber = "+27" + phoneNumber.substring(1);
    }

    // Send the SMS
    await sendSms(formattedPhoneNumber, message);

    return NextResponse.json(
      {
        success: true,
        message: "SMS sent successfully",
        phoneNumber: formattedPhoneNumber,
        messageLength: message.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("SMS sending error:", error);

    return NextResponse.json(
      {
        error: "Failed to send SMS",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "SMS Test API Endpoint",
      usage: "Send POST request with { phoneNumber, message } in body",
      example: {
        phoneNumber: "+27123456789",
        message: "Hello from Liyana!",
      },
      notes: [
        "Phone number should be in South African format (+27xxxxxxxxx or 0xxxxxxxxx)",
        "Message should be max 160 characters",
        "Requires SMS_PORTAL_CLIENT_ID and SMS_PORTAL_API_SECRET environment variables",
      ],
    },
    { status: 200 }
  );
}
