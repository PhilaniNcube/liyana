import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { decryptValue } from "@/lib/encryption";
import { WhoYouOtvResponse } from "@/lib/schemas";

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
    .select("*")
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
  const loginToken = loginData.detail.token;

  if (!loginToken) {
    return NextResponse.json(
      { error: "Failed to get login token from Who You API" },
      { status: 401 }
    );
  }

  // Request PIN from Who You API
  const requestPinURL = `${process.env.WHO_YOU_URL}/otv/token/v1/request-pin`;

  const requestPinResponse = await fetch(requestPinURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${loginToken}`,
    },
    body: JSON.stringify({
      IdNumber: decryptedIdNumber,
      BypassCache: "false",
      CountryCode: "ZAF",
      RequestPurpose: "ID SELFIE VERIFICATION",
      RequestSource: "",
      ClientReference: application_id, // use the application ID as a reference
      CanAccessDhaLive: "false",
    }),
  });

  if (!requestPinResponse.ok) {
    console.error("Failed to request PIN:", await requestPinResponse.text());
    return NextResponse.json(
      { error: "Failed to request PIN from Who You API" },
      { status: 400 }
    );
  }

  const requestPinData: WhoYouOtvResponse = await requestPinResponse.json();

  console.log("Request PIN Data:", requestPinData);

  const cellnumber = profile.phone_number;

  if (!cellnumber) {
    return NextResponse.json(
      { error: "Phone number is required for PIN request" },
      { status: 400 }
    );
  }

  // Check if the response indicates an error based on the response structure
  if ("code" in requestPinData && requestPinData.code !== 0) {
    return NextResponse.json(
      { error: requestPinData.message || "Unknown error occurred" },
      { status: 400 }
    );
  }

  // Check if the PIN was successfully requested
  if (
    !requestPinData.detail ||
    !requestPinData.detail.pinCode ||
    !requestPinData.detail.url ||
    !requestPinData.detail.url.PWA
  ) {
    return NextResponse.json(
      { error: "Failed to request PIN" },
      { status: 400 }
    );
  }

  // If the PIN was successfully requested, save it to the database in the otv_checks table
  const { error: insertError } = await supabase.from("otv_checks").insert({
    application_id,
    pin_code: requestPinData.detail.pinCode,
    id_number: id_number,
  });

  if (insertError) {
    console.error("Failed to save PIN to database:", insertError);
    return NextResponse.json(
      { error: "Failed to save PIN to database" },
      { status: 500 }
    );
  }

  // Construct the verification link from the Who You URL and the PIN code
  console.log("Verification link will be sent via SMS");
  const verLink = `${requestPinData.detail.url.PWA}${requestPinData.detail.pinCode}`;

  const smsUrl = `${process.env.WHO_YOU_URL}/otv/token/v1/sendMessage`;

  const smsResponse = await fetch(smsUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${loginToken}`,
    },
    body: JSON.stringify({
      number: "+27817551279",
      message: `Liyana Finance: Please verify yourself using the following link: ${verLink}. Please enter the following PIN: ${requestPinData.detail.pinCode} when requested.`,
    }),
  });

  if (!smsResponse.ok) {
    return NextResponse.json(
      { error: "Failed to send SMS with verification link" },
      { status: 500 }
    );
  }

  console.log("SMS sent successfully with verification link");
  const smsData = await smsResponse.json();
  console.log("SMS Data:", smsData);

  return NextResponse.json(
    { message: "Verification link sent successfully" },
    { status: 200 }
  );
}
