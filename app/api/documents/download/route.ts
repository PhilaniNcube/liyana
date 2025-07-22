import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");

    if (!filePath) {
      return NextResponse.json(
        { error: "File path is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Get the current user's profile to check permissions
    const { data: currentUserProfile, error: currentUserError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (currentUserError) {
      return NextResponse.json(
        { error: "Current user profile not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to download this file
    // For profile documents, check if it's their own document or if they're admin/editor
    const isAdminOrEditor =
      currentUserProfile.role === "admin" ||
      currentUserProfile.role === "editor";

    // Extract profile ID from file path (assuming path structure: profile-documents/{profileId}/...)
    const pathParts = filePath.split("/");
    let hasPermission = isAdminOrEditor;

    if (
      !hasPermission &&
      pathParts[0] === "profile-documents" &&
      pathParts[1]
    ) {
      // Check if this is the user's own document
      hasPermission = pathParts[1] === user.id;
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Generate signed URL for download
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage.from("documents").createSignedUrl(filePath, 3600); // 1 hour expiry

    if (signedUrlError) {
      console.error("Error creating signed URL:", signedUrlError);
      return NextResponse.json(
        { error: "Failed to generate download URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      signedUrl: signedUrlData.signedUrl,
    });
  } catch (error) {
    console.error("Error in download API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
