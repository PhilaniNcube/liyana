import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";

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

    // Get policy documents from database
    const { data: documents, error } = await supabase
      .from("policy_documents")
      .select("*")
      .eq("policy_id", parseInt(policyId));

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch documents", details: error.message },
        { status: 500 }
      );
    }

    // Test downloading each document
    const results = [];
    for (const doc of documents || []) {
      console.log(`Testing download for document ${doc.id}, path: ${doc.path}`);
      
      try {
        // Try to download the file
        const { data: fileData, error: downloadError } = await supabase.storage
          .from("documents")
          .download(doc.path);

        if (downloadError) {
          console.error(`Download error for document ${doc.id}:`, downloadError);
          results.push({
            documentId: doc.id,
            path: doc.path,
            success: false,
            error: downloadError.message,
            type: doc.document_type
          });
        } else if (fileData) {
          console.log(`Successfully downloaded document ${doc.id}, size: ${fileData.size} bytes`);
          results.push({
            documentId: doc.id,
            path: doc.path,
            success: true,
            size: fileData.size,
            type: doc.document_type,
            mimeType: fileData.type
          });
        } else {
          results.push({
            documentId: doc.id,
            path: doc.path,
            success: false,
            error: "No data returned",
            type: doc.document_type
          });
        }
      } catch (err) {
        console.error(`Exception downloading document ${doc.id}:`, err);
        results.push({
          documentId: doc.id,
          path: doc.path,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
          type: doc.document_type
        });
      }
    }

    return NextResponse.json({
      totalDocuments: documents?.length || 0,
      results
    });

  } catch (error) {
    console.error("Error in document test:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
