import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { z } from "zod";

const approvalSchema = z.object({
  loan_amount: z.number().min(500).max(5000),
  loan_term: z.number().min(5).max(60),
  interest_rate: z.number().min(0.01).max(50),
  total_repayment: z.number(),
  monthly_repayment: z.number(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const resolvedParams = await params;
    const applicationId = resolvedParams.id;

    // Get the current user and check if they're an admin
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = approvalSchema.parse(body);

    // Get the current application
    const { data: application, error: fetchError } = await supabase
      .from("applications")
      .select("*")
      .eq("id", parseInt(applicationId))
      .single();

    if (fetchError || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Check if application is in a state that can be approved
    if (
      application.status === "approved" ||
      application.status === "declined"
    ) {
      return NextResponse.json(
        { error: "Application has already been processed" },
        { status: 400 }
      );
    }

    // Update the application with approval details
    const { data: updatedApplication, error: updateError } = await supabase
      .from("applications")
      .update({
        status: "approved",
        application_amount: validatedData.loan_amount,
        term: validatedData.loan_term,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parseInt(applicationId))
      .select()
      .single();

    if (updateError) {
      console.error("Error updating application:", updateError);
      return NextResponse.json(
        { error: "Failed to approve application" },
        { status: 500 }
      );
    }

    // Create an approved loan record
    const { data: approvedLoan, error: approvedLoanError } = await supabase
      .from("approved_loans")
      .insert({
        application_id: parseInt(applicationId),
        profile_id: application.user_id,
        total_repayment_amount: validatedData.total_repayment,
        monthly_payment: validatedData.monthly_repayment,
        loan_term_days: validatedData.loan_term,
        interest_rate: validatedData.interest_rate,
        initiation_fee: 0, // You can calculate this based on your business logic
        service_fee: 0, // You can calculate this based on your business logic
        approved_date: new Date().toISOString(),
        status: "active",
      })
      .select()
      .single();

    if (approvedLoanError) {
      console.error("Error creating approved loan:", approvedLoanError);
      // Rollback the application status update
      await supabase
        .from("applications")
        .update({ status: application.status })
        .eq("id", parseInt(applicationId));

      return NextResponse.json(
        { error: "Failed to create approved loan record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Application approved successfully",
      application: updatedApplication,
      approvedLoan: approvedLoan,
    });
  } catch (error) {
    console.error("Error in approval endpoint:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
