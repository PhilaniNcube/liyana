import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { policyDocumentSchema } from "@/lib/schemas";
import { z } from "zod";

// GET /api/policy-documents?policy_id=123 - Get documents for a policy
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const policyId = searchParams.get("policy_id");

    if (!policyId) {
      return NextResponse.json(
        { error: "Policy ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: documents, error } = await supabase
      .from("policy_documents")
      .select("*")
      .eq("policy_id", parseInt(policyId))
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching policy documents:", error);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 }
      );
    }

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error in GET /api/policy-documents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/policy-documents - Create a new policy document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = policyDocumentSchema.parse(body);

    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Insert the document record
    const { data: document, error } = await supabase
      .from("policy_documents")
      .insert({
        ...validatedData,
        user_id: validatedData.user_id || user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating policy document:", error);
      return NextResponse.json(
        { error: "Failed to create document" },
        { status: 500 }
      );
    }

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error in POST /api/policy-documents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
