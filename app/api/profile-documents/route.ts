import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";

export async function POST(request: NextRequest) {
  try {
    const { profileId, documentType, path } = await request.json();

    if (!profileId || !documentType || !path) {
      return NextResponse.json(
        { error: "Profile ID, document type, and path are required" },
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

    // Check if user has permission to upload documents for this profile
    // Either they are the profile owner or they are an admin/editor
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", profileId)
      .single();

    if (profileError) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check permissions
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

    const isOwner = user.id === profileId;
    const isAdminOrEditor =
      currentUserProfile.role === "admin" ||
      currentUserProfile.role === "editor";

    if (!isOwner && !isAdminOrEditor) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Insert the profile document record
    const { data: profileDocument, error: insertError } = await supabase
      .from("profile_documents")
      .insert({
        profile_id: profileId,
        document_type: documentType,
        path: path,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting profile document:", insertError);
      return NextResponse.json(
        { error: "Failed to save document record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      document: profileDocument,
    });
  } catch (error) {
    console.error("Error in profile documents API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");

    if (!profileId) {
      return NextResponse.json(
        { error: "Profile ID is required" },
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

    // Check permissions (same as POST)
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

    const isOwner = user.id === profileId;
    const isAdminOrEditor =
      currentUserProfile.role === "admin" ||
      currentUserProfile.role === "editor";

    if (!isOwner && !isAdminOrEditor) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get profile documents
    const { data: profileDocuments, error: documentsError } = await supabase
      .from("profile_documents")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });

    if (documentsError) {
      console.error("Error fetching profile documents:", documentsError);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      documents: profileDocuments || [],
    });
  } catch (error) {
    console.error("Error in profile documents GET API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
