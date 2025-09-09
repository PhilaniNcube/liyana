import { NextRequest, NextResponse } from "next/server";
import { sendFuneralPolicyDetailsEmail } from "@/lib/actions/funeral-policy";
import { z } from "zod";

const requestSchema = z.object({
  policyId: z.number().min(1, "Policy ID must be a positive number"),
  attachments: z.array(z.object({
    filename: z.string(),
    data: z.string(), // Base64 string
    content_type: z.string().optional(),
  })).optional(),
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

    const { policyId, attachments } = result.data;

    // Call the server action
    const emailResult = await sendFuneralPolicyDetailsEmail(policyId, attachments);

    if (emailResult.error) {
      return NextResponse.json(
        {
          error: emailResult.message,
          details: emailResult.details,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: emailResult.message,
      emailId: emailResult.emailId,
      recipient: emailResult.recipient,
      policyId: policyId,
    });

  } catch (error) {
    console.error("Test funeral email API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
