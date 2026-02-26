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

    // Extract profile ID from file path (assuming path structure: profile-documents/{profileId}/...)
    const pathParts = filePath.split("/");
    const role = currentUserProfile?.role;

    // Check if user has permission to download this file
    // For profile documents, check if it's their own document or if they're admin/editor
    const isAdminOrEditor = role === "admin" || role === "editor";

    let hasPermission = isAdminOrEditor;

    if (
      !hasPermission &&
      pathParts[0] === "profile-documents" &&
      pathParts[1]
    ) {
      // Check if this is the user's own document
      hasPermission = pathParts[1] === user.id;
    } else if (!hasPermission && pathParts[0] === user.id) {
      // Check if this is the user's own application document (stored as user_id/filename)
      hasPermission = true;
    }

    console.log("Download Debug:", {
      path: filePath,
      userId: user.id,
      role: role,
      isAdminOrEditor,
      hasPermission
    });

    if (!hasPermission) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Download file directly
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(filePath);

    if (downloadError || !fileData) {
      console.error("Error downloading file:", downloadError);
      return NextResponse.json(
        { error: "Failed to download file" },
        { status: 500 }
      );
    }

    // Return file as response
    const headers = new Headers();
    headers.set("Content-Type", fileData.type);
    headers.set("Content-Disposition", `attachment; filename="${pathParts[pathParts.length - 1]}"`);

    return new NextResponse(fileData, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error in download API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
