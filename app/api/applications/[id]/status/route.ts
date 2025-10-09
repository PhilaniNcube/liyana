import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/queries";

const updateStatusSchema = z.object({
  status: z.enum([
    "pre_qualifier",
    "in_review",
    "pending_documents",
    "approved",
    "declined",
    "submitted_to_lender",
    "submission_failed",
  ]),
  decline_reason: z.string().optional(),
});

export async function PATCH(
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

    // Parse request body
    const body = await request.json();
    const result = updateStatusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { status, decline_reason } = result.data;

    const supabase = await createClient();

    // Check if user is authenticated and is admin/editor
const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }





    if (user.role !== "admin" && user.role !== "editor") {
      return NextResponse.json(
        { error: "Access denied. Admin or editor privileges required." },
        { status: 403 }
      );
    }

    // Check if application exists
    const { data: existingApplication, error: fetchError } = await supabase
      .from("applications")
      .select("id, status")
      .eq("id", applicationId)
      .single();

    if (fetchError || !existingApplication) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Prevent status changes if already approved or declined (optional business rule)
    if (
      (existingApplication.status === "approved" ||
        existingApplication.status === "declined") &&
      status !== existingApplication.status
    ) {
      return NextResponse.json(
        {
          error: `Cannot change status from ${existingApplication.status} to ${status}`,
        },
        { status: 400 }
      );
    }

    // Update the application status
    const updateData: any = {
      status: status,
      updated_at: new Date().toISOString(),
    };

    // Add decline reason if status is declined and reason is provided
    if (status === "declined" && decline_reason) {
      updateData.decline_reason = decline_reason;
    }

    const { data: updatedApplication, error: updateError } = await supabase
      .from("applications")
      .update(updateData)
      .eq("id", applicationId)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update application status:", updateError);
      return NextResponse.json(
        { error: "Failed to update application status" },
        { status: 500 }
      );
    }

    console.log(
      `Application ${applicationId} status updated to ${status} by user ${user.id}`
    );

    return NextResponse.json({
      success: true,
      message: `Application status updated to ${status}`,
      application: updatedApplication,
    });
  } catch (error) {
    console.error("Application status update API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
