import { NextRequest } from "next/dist/server/web/spec-extension/request";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { decryptValue } from "@/lib/encryption";
import { WhoYouCellphoneVerificationResponse } from "@/lib/schemas";

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

  // Fetch application data
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
    .select("*")
    .eq("id", application.user_id)
    .single();

  if (profileError || !profile) {
    console.error("Profile fetch error:", profileError);
    return new Response(JSON.stringify({ error: "User profile not found" }), {
      status: 404,
    });
  }

  //  get the cell number from the profile

  const cell_number = profile.phone_number;

  if (!cell_number) {
    return new Response(
      JSON.stringify({ error: "User profile does not have a cell number" }),
      {
        status: 400,
      }
    );
  }

  const decryptedIdNumber = decryptValue(application.id_number);

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

  const cellPhoneVerificationURL = `${process.env.WHO_YOU_URL}/otv/token/v1/cellphone-match`;

  const cellPhoneVerificationResponse = await fetch(cellPhoneVerificationURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      IdNumber: decryptedIdNumber,
      CellphoneNumber: cell_number,
      IncludeRawResponse: false,
    }),
  });

  if (!cellPhoneVerificationResponse.ok) {
    const errorData = await cellPhoneVerificationResponse.text();

    console.error("Error verifying cellphone:", errorData);
    return NextResponse.json(
      { error: "Failed to verify cellphone", details: errorData },
      { status: 500 }
    );
  }

  console.log("Response from Who You API:", cellPhoneVerificationResponse);

  const cellPhoneVerificationData: WhoYouCellphoneVerificationResponse =
    await cellPhoneVerificationResponse.json();

  console.log("Cellphone verification data:", cellPhoneVerificationData);

  // Save the API check result to the database
  try {
    const { error } = await supabase.from("api_checks").insert({
      id_number: decryptedIdNumber,
      check_type: "cellphone_verification",
      vendor: "WhoYou",
      status: "passed",
      response_payload: JSON.parse(JSON.stringify(cellPhoneVerificationData)),
      checked_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error saving API check result:", error);
    } else {
      console.log("Cellphone verification API check result saved successfully");
    }
  } catch (error) {
    console.error("Error saving API check result:", error);
  }

  return NextResponse.json({
    success: true,
    cellphoneVerificationInformation: cellPhoneVerificationData.detail,
  });
}
