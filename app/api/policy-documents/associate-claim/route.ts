import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { z } from "zod";

// Schema for associating documents with a claim
const associateClaimSchema = z.object({
  document_ids: z.array(z.number()).min(1, "At least one document ID is required"),
  claim_id: z.number().positive("Valid claim ID is required"),
});

// PATCH /api/policy-documents/associate-claim - Associate documents with a claim
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validationResult = associateClaimSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid request data",
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { document_ids, claim_id } = validationResult.data;

    const supabase = await createClient();

    // First, verify that the claim exists
    const { data: claim, error: claimError } = await supabase
      .from("claims")
      .select("id")
      .eq("id", claim_id)
      .single();

    if (claimError || !claim) {
      return NextResponse.json(
        { error: "Claim not found" },
        { status: 404 }
      );
    }

    // Update the documents to associate them with the claim
    const { data: updatedDocuments, error: updateError } = await supabase
      .from("policy_documents")
      .update({ claim_id: claim_id })
      .in("id", document_ids)
      .select("*");

    if (updateError) {
      console.error("Error associating documents with claim:", updateError);
      return NextResponse.json(
        { error: "Failed to associate documents with claim" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Documents successfully associated with claim",
      updated_documents: updatedDocuments,
      claim_id: claim_id,
    });

  } catch (error) {
    console.error("Error in PATCH /api/policy-documents/associate-claim:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
