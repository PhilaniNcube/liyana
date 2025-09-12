import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { z } from "zod";
import { sendSms } from "@/lib/actions/sms";

// Schema for API that accepts date strings
const createClaimApiSchema = z.object({
  policy_id: z.coerce.number().min(1, "Policy ID is required"),
  claimant_party_id: z.string().min(1, "Claimant party ID is required"),
  claim_number: z.string().optional(),
  date_of_incident: z.string()
    .min(1, "Date of incident is required")
    .refine((date) => !isNaN(Date.parse(date)), "Invalid date format for incident date"),
  date_filed: z.string()
    .min(1, "Date filed is required")
    .refine((date) => !isNaN(Date.parse(date)), "Invalid date format for date filed"),
  status: z.enum(["submitted", "under_review", "approved", "denied", "paid"]).optional(),
  contact_details: z.object({
    is_policy_holder: z.enum(["yes", "no"]),
    relationship: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().min(1, "Phone number is required"),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate the request body
    const result = createClaimApiSchema.safeParse(body);

    if (!result.success) {
        console.log("Validation error:", result.error);
      return NextResponse.json(
        { error: "Invalid data", details: result.error.format() },
        { status: 400 }
      );
    }

    const claimData = result.data;

    // Additional date validation
    const incidentDate = new Date(claimData.date_of_incident);
    const filedDate = new Date(claimData.date_filed);
    const now = new Date();

    if (incidentDate > now) {
      return NextResponse.json(
        { error: "Date of incident cannot be in the future" },
        { status: 400 }
      );
    }

    if (filedDate > now) {
      return NextResponse.json(
        { error: "Date filed cannot be in the future" },
        { status: 400 }
      );
    }

    if (incidentDate > filedDate) {
      return NextResponse.json(
        { error: "Date of incident cannot be after date filed" },
        { status: 400 }
      );
    }

    // Verify that the user owns the policy or is a beneficiary
    const { data: policy, error: policyError } = await supabase
      .from("policies")
      .select(`
        id,
        policy_holder_id,
        policy_beneficiaries!inner(
          beneficiary_party_id
        )
      `)
      .eq("id", claimData.policy_id).eq('user_id', user.id)
      .single();

    if (policyError || !policy) {
        console.log("Policy error:", policyError);
      return NextResponse.json(
        { error: "Policy not found" },
        { status: 404 }
      );
    }

    // Check if the claimant is either the policy holder or a beneficiary
    const isValidClaimant = 
      policy.policy_holder_id === claimData.claimant_party_id ||
      policy.policy_beneficiaries.some(b => b.beneficiary_party_id === claimData.claimant_party_id);

    if (!isValidClaimant) {
        console.log("Invalid claimant - must be policy holder or beneficiary");
      return NextResponse.json(
        { error: "Invalid claimant - must be policy holder or beneficiary" },
        { status: 403 }
      );
    }

    // Generate claim number if not provided
    let claimNumber = claimData.claim_number;
    if (!claimNumber) {
      const date = new Date();
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
      claimNumber = `CLM-${policy.id}-${dateStr}-${random}`;
    }

    // Insert the claim
    const { data: claim, error: insertError } = await supabase
      .from("claims")
      .insert({
        policy_id: claimData.policy_id,
        claimant_party_id: claimData.claimant_party_id,
        claim_number: claimNumber,
        status: claimData.status || "submitted", // Always start as submitted for public users
        date_filed: new Date(claimData.date_filed).toISOString(),
        date_of_incident: new Date(claimData.date_of_incident).toISOString(),
        contact_details: claimData.contact_details || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create claim" },
        { status: 500 }
      );
    }

    sendSms(`${process.env.SMS_NUMBER}`, `New claim filed: ${claim.claim_number} for policy https://apply.liyanafinance.co.za/dashboard/insurance/${policy.id}`);

    return NextResponse.json({ success: true, claim: claim }, { status: 201 });

  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
