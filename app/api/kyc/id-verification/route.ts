import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { decryptValue } from "@/lib/encryption";
import { WhoYouIdVerificationResponse } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  const { application_id } = await request.json();

  if (!application_id) {
    return new Response(
      JSON.stringify({ error: "Application ID is required" }),
      {
        status: 400,
      }
    );
  }

  const supabase = await createClient();

  const { data: application, error: applicationError } = await supabase
    .from("applications")
    .select("*")
    .eq("id", application_id)
    .single();

  if (applicationError || !application) {
    console.error("Application fetch error:", applicationError);
    return new Response(JSON.stringify({ error: "Application not found" }), {
      status: 404,
    });
  }

  // Fetch user profile data
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", application.user_id)
    .single();

  if (profileError || !profile) {
    console.error("Profile fetch error:", profileError);
    return new Response(JSON.stringify({ error: "User profile not found" }), {
      status: 404,
    });
  }

  const id_number = application.id_number;

  const decryptedIdNumber = decryptValue(id_number);

  if (!decryptedIdNumber) {
    return new Response(
      JSON.stringify({ error: "Failed to decrypt ID number" }),
      {
        status: 500,
      }
    );
  }

  // Login to the Who You API
  const loginURL = `${process.env.WHO_YOU_URL}/otv/token/v1/login/${process.env.WHO_YOU_ID}/${process.env.WHO_YOU_USERNAME}`;

  const loginResponse = await fetch(loginURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      serviceAccount: true,
      password: process.env.WHO_YOU_PASSWORD,
    }),
  });

  if (!loginResponse.ok) {
    return NextResponse.json(
      { error: "Failed to login to Who You API" },
      { status: 401 }
    );
  }

  const loginData = await loginResponse.json();

  // get the access token from the response
  const accessToken = loginData.detail.token;

  const verificationURL = `${process.env.WHO_YOU_URL}/hanis/enquire/v1/demographic/${decryptedIdNumber}`;

  const verificationResponse = await fetch(verificationURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      CanBypassCache: "false",
      CanAccessDhaLive: "false",
    }),
  });

  if (!verificationResponse.ok) {
    return NextResponse.json(
      { error: "Failed to verify ID number" },
      { status: 500 }
    );
  }

  const verificationData: WhoYouIdVerificationResponse =
    await verificationResponse.json();

  console.log("Verification Data:", verificationData);

  if (!verificationData || !verificationData.detail) {
    return NextResponse.json(
      { error: "Invalid response from Who You API" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: verificationData.detail,
  });
}
