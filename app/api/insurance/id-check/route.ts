import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { decryptValue } from "@/lib/encryption";
import { WhoYouIdVerificationResponse } from "@/lib/schemas";

export async function POST(request: NextRequest) {
    // receive the encrypted ID Number and profile_id from the request body
  const { id_number, profile_id } = await request.json();

  
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

  const supabase = await createClient();

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
   
   

    await supabase.from("api_checks").insert({
      id_number: id_number,
      profile_id: profile_id,
      check_type: "id_verification",
      status: "failed",
      vendor: "WhoYou",
      response_payload: {
        code: verificationResponse.status,
        error: verificationResponse.statusText,
        data: null
      },
      checked_at: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: "Failed to verify ID number" },
      { status: 500 }
    );
  }

  const verificationData: WhoYouIdVerificationResponse =
  await verificationResponse.json();

 

  console.log("Verification Data:", verificationData);

  if (!verificationData || !verificationData.detail) {
   
    // stringify the response data for logging
    const responseText = await verificationResponse.text();


    // save the stringified response to the api-checks table
    await supabase.from("api_checks").insert({
      id_number: id_number,
      profile_id: profile_id,
      check_type: "id_verification",
      status: "failed",
      vendor: "WhoYou",
      response_payload: responseText,
      checked_at: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: "Invalid response from Who You API" },
      { status: 500 }
    );
  }



  // Save the API check result to the database
  try {
    const { error } = await supabase.from("api_checks").insert({
      id_number: id_number,
      profile_id: profile_id,
      check_type: "id_verification",
      vendor: "WhoYou",
      status: "passed",
      response_payload: JSON.parse(JSON.stringify(verificationData)),
      checked_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error saving API check result:", error);
    } else {
      console.log("ID verification API check result saved successfully");
    }
  } catch (error) {
    console.error("Error saving API check result:", error);

    await supabase.from("api_checks").insert({
      id_number: id_number,
      profile_id: profile_id,
      check_type: "id_verification",
      status: "failed",
      vendor: "WhoYou",
      response_payload: JSON.stringify(error),
      checked_at: new Date().toISOString(),
    });

  }

  return NextResponse.json({
    success: true,
    data: verificationData.detail,
  });
}
