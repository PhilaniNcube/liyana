import { NextRequest, NextResponse } from "next/server";
import { getDocumentsForEmail, getDocumentsForEmailV2 } from "@/lib/utils/document-helpers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Support both old format (documentIds) and new format (policyDocumentIds, applicationDocumentIds)
    const { 
      documentIds, 
      policyDocumentIds = [], 
      applicationDocumentIds = [] 
    } = body;

    console.log("Document attachment request:", {
      documentIds,
      policyDocumentIds,
      applicationDocumentIds
    });

    let attachments;

    // Use new V2 function if we have separate ID arrays
    if (policyDocumentIds.length > 0 || applicationDocumentIds.length > 0) {
      if (!Array.isArray(policyDocumentIds) || !Array.isArray(applicationDocumentIds)) {
        return NextResponse.json(
          { error: "Invalid document IDs provided" },
          { status: 400 }
        );
      }
      attachments = await getDocumentsForEmailV2(policyDocumentIds, applicationDocumentIds);
    } 
    // Fall back to old function for backward compatibility
    else if (documentIds && Array.isArray(documentIds)) {
      attachments = await getDocumentsForEmail(documentIds);
    } 
    else {
      return NextResponse.json(
        { error: "Invalid document IDs provided" },
        { status: 400 }
      );
    }

    console.log("Generated attachments:", attachments.length, "attachments");
    attachments.forEach((att, index) => {
      console.log(`Attachment ${index + 1}:`, {
        filename: att.filename,
        content_type: att.content_type,
        hasContent: !!att.content,
        contentLength: att.content?.length || 0,
        contentPreview: att.content ? att.content.substring(0, 50) + '...' : 'No content'
      });
    });

    // Filter out any attachments with empty content
    const validAttachments = attachments.filter(att => att.content && att.content.length > 0);
    console.log(`Filtered valid attachments: ${validAttachments.length} of ${attachments.length}`);

    return NextResponse.json({ attachments: validAttachments });
  } catch (error) {
    console.error("Error preparing document attachments:", error);
    return NextResponse.json(
      { error: "Failed to prepare document attachments" },
      { status: 500 }
    );
  }
}
