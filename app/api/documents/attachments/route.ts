import { NextRequest, NextResponse } from "next/server";
import { getDocumentsForEmail } from "@/lib/utils/document-helpers";

export async function POST(request: NextRequest) {
  try {
    const { documentIds } = await request.json();

    if (!documentIds || !Array.isArray(documentIds)) {
      return NextResponse.json(
        { error: "Invalid document IDs provided" },
        { status: 400 }
      );
    }

    const attachments = await getDocumentsForEmail(documentIds);

    return NextResponse.json({ attachments });
  } catch (error) {
    console.error("Error preparing document attachments:", error);
    return NextResponse.json(
      { error: "Failed to prepare document attachments" },
      { status: 500 }
    );
  }
}
