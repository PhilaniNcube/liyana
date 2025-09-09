import { NextRequest, NextResponse } from "next/server";
import { getDocumentsForEmail } from "@/lib/utils/document-helpers";

export async function POST(request: NextRequest) {
  try {
    const { documentIds } = await request.json();

    console.log("Document attachment request for IDs:", documentIds);

    if (!documentIds || !Array.isArray(documentIds)) {
      return NextResponse.json(
        { error: "Invalid document IDs provided" },
        { status: 400 }
      );
    }

    const attachments = await getDocumentsForEmail(documentIds);

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
