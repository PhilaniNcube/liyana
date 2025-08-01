import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { decryptValue } from "@/lib/encryption";
import { WhoYouOtvResultsResponse } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  const { application_id } = await request.json();

  if (!application_id) {
    console.error("Application ID is required");
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
    .order("created_at", { ascending: false })
    .single();

  if (applicationError || !application) {
    console.error("Application fetch error:", applicationError);
    return new Response(JSON.stringify({ error: "Application not found" }), {
      status: 404,
    });
  }

  // fetch the most recent otv_check for the application matching the application_id
  const { data: otvChecks, error: otvCheckError } = await supabase
    .from("otv_checks")
    .select("*")
    .eq("application_id", application_id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (otvCheckError || !otvChecks || otvChecks.length === 0) {
    console.error("OTV Check fetch error:", otvCheckError);
    return new Response(
      JSON.stringify({ error: "No OTV check found for this application" }),
      {
        status: 404,
      }
    );
  }

  const otvCheck = otvChecks[0]; // Get the most recent OTV check

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
  const loginToken = loginData.detail.token;

  // Perform the OTV check
  const otvResultsURL = `${process.env.WHO_YOU_URL}/otv/token/v1/results`;

  const otvResponse = await fetch(otvResultsURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${loginToken}`,
    },
    body: JSON.stringify({
      pinCode: otvCheck.pin_code,
    }),
  });

  if (!otvResponse.ok) {
    const errorText = await otvResponse.text();
    console.error("Failed to fetch OTV results:", errorText);
    return NextResponse.json(
      {
        error: `Failed to fetch OTV results: ${otvResponse.status} ${otvResponse.statusText}`,
      },
      { status: 500 }
    );
  }

  let otvResults: any;
  try {
    otvResults = await otvResponse.json();
    console.log("OTV Results:", JSON.stringify(otvResults, null, 2));
  } catch (parseError) {
    console.error("Failed to parse OTV results JSON:", parseError);
    return NextResponse.json(
      { error: "Invalid response format from OTV service" },
      { status: 500 }
    );
  }

  // Validate that we have the expected structure
  if (!otvResults || typeof otvResults !== "object") {
    console.error("Invalid OTV results structure:", otvResults);
    return NextResponse.json(
      { error: "Invalid OTV results structure" },
      { status: 500 }
    );
  }

  // Check if the response indicates an error or incomplete data
  if (otvResults.code !== 0) {
    console.error(
      "OTV API returned error code:",
      otvResults.code,
      otvResults.message
    );
    return NextResponse.json(
      { error: otvResults.message || "OTV verification failed" },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { application, otvResults },
    {
      status: 200,
    }
  );
}
