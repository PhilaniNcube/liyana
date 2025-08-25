import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";

// DELETE /api/policy-documents/[id] - Delete a policy document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = parseInt(params.id);

    if (isNaN(documentId)) {
      return NextResponse.json(
        { error: "Invalid document ID" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // First, get the document to check ownership and get the file path
    const { data: document, error: fetchError } = await supabase
      .from("policy_documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (fetchError) {
      console.error("Error fetching document:", fetchError);
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Delete the document record
    const { error: deleteError } = await supabase
      .from("policy_documents")
      .delete()
      .eq("id", documentId);

    if (deleteError) {
      console.error("Error deleting document:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete document" },
        { status: 500 }
      );
    }

    // Note: In a production environment, you might also want to delete the actual file
    // from your storage service here

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/policy-documents/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
