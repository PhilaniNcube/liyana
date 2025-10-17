import { createClient } from "@/lib/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get current user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      return NextResponse.json({
        error: "Failed to get user",
        details: userError.message,
        user: null,
        isAuthenticated: false
      });
    }

    // Try to get user profile if user exists
    let profile = null;
    if (user) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (!profileError) {
        profile = profileData;
      }
    }

    return NextResponse.json({
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.role,
        aud: user.aud,
        created_at: user.created_at
      } : null,
      profile,
      isAuthenticated: !!user,
      error: null
    });
  } catch (error) {
    return NextResponse.json({
      error: "Server error",
      details: error instanceof Error ? error.message : "Unknown error",
      user: null,
      isAuthenticated: false
    });
  }
}