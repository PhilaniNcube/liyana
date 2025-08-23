import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";

export async function POST(request: NextRequest) {
  const { application_id } = await request.json();

  if (!application_id) {
    return NextResponse.json(
      { error: "Application ID is required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Fetch the application to get the ID number
  const { data: application, error: applicationError } = await supabase
    .from("applications")
    .select("id_number")
    .eq("id", application_id)
    .single();

  if (applicationError || !application) {
    console.error("Application fetch error:", applicationError);
    return NextResponse.json(
      { error: "Application not found" },
      { status: 404 }
    );
  }

  // Fetch the latest successful ID verification result from api_checks
  const { data: apiCheck, error: apiCheckError } = await supabase
    .from("api_checks")
    .select("*")
    .eq("id_number", application.id_number)
    .eq("check_type", "id_verification")
    .eq("status", "passed")
    .order("checked_at", { ascending: false })
    .limit(1)
    .single();

  if (apiCheckError || !apiCheck) {
    return NextResponse.json(
      { error: "No ID verification results found", found: false },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: apiCheck.response_payload,
    checked_at: apiCheck.checked_at,
    found: true,
  });
}
