import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { z } from "zod";
import { PaydayLoanCalculator } from "@/lib/utils/loancalculator";
import { getCurrentUser } from "@/lib/queries";

const approvalSchema = z.object({
  loan_amount: z.number().min(500).max(5000),
  loan_term: z.number().min(5).max(60),
  interest_rate: z.number().min(0.01).max(50),
  total_repayment: z.number(),
  monthly_repayment: z.number(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const resolvedParams = await params;
    const applicationId = resolvedParams.id;

    // Get the current user and check if they're an admin
const user = await getCurrentUser();

    if ( !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    if (!user || user.role !== "admin") {
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
        { status: 404 },
      );
    }

    // Check if application is in a state that can be approved
    if (
      application.status === "approved" ||
      application.status === "declined"
    ) {
      return NextResponse.json(
        { error: "Application has already been processed" },
        { status: 400 },
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
        { status: 500 },
      );
    }

    // Compute fees and next payment date using the loan calculator
    const calculator = new PaydayLoanCalculator({
      principal: validatedData.loan_amount,
      termInDays: validatedData.loan_term,
      loanStartDate: new Date(),
      interestRate: validatedData.interest_rate / 100, // convert % to decimal
      salaryDay: application.salary_date ? application.salary_date : undefined,
    });

    const initiationFee = calculator.getInitiationFee();
    const serviceFee = calculator.getServiceFeeForTerm();
    const nextPaymentDate = calculator.getNextPaymentDate(new Date());

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
        initiation_fee: initiationFee,
        service_fee: serviceFee,
        approved_date: new Date().toISOString(),
        next_payment_date: nextPaymentDate.toISOString().slice(0, 10),
        status: "active",
        approved_loan_amount: validatedData.loan_amount,
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
        { status: 500 },
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
        { error: "Invalid request data", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
