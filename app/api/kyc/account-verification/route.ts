import { WhoYouAccountVerificationResponse } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { decryptValue } from "@/lib/encryption";

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
    .select("full_name")
    .eq("id", application.user_id)
    .single();

  if (profileError || !profile) {
    console.error("Profile fetch error:", profileError);
    return new Response(JSON.stringify({ error: "User profile not found" }), {
      status: 404,
    });
  }

  // Extract required fields
  const {
    bank_account_number: account_number,
    bank_account_type: account_type,
    branch_code,
    bank_name: bank,
    id_number,
  } = application;

  // Split full_name into first_name and last_name
  const fullName = profile.full_name || "";
  const nameParts = fullName.trim().split(" ");
  const first_name = nameParts[0] || "";
  const last_name = nameParts.slice(1).join(" ") || "";

  // Validate required fields
  if (
    !account_number ||
    !account_type ||
    !branch_code ||
    !bank ||
    !first_name ||
    !last_name ||
    !id_number
  ) {
    console.error("Missing required fields for account verification");
    const missingFields = [
      !account_number && "bank_account_number",
      !account_type && "bank_account_type",
      !branch_code && "branch_code",
      !bank && "bank_name",
      !first_name && "first_name",
      !last_name && "last_name",
      !id_number && "id_number",
    ]
      .filter(Boolean)
      .join(", ");

    return new Response(
      JSON.stringify({
        error: `Missing required fields: ${missingFields}`,
      }),
      { status: 400 }
    );
  }

  // Login to the Who You API
  const loginURL = `${process.env.WHO_YOU_URL}/otv/token/v1/login/${process.env.WHO_YOU_ID}/${process.env.WHO_YOU_USERNAME}`;

  // the login request is a post request with a body containing the following object:
  // {
  //  "serviceAccount": true,
  //  "password": "{password}"
  // }

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

  const accountVerificationUrl = `${process.env.WHO_YOU_URL}/hanis/enquire/v1/accountverification/bureau-avs`;

  const accountVerificationResponse = await fetch(accountVerificationUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      IdentificationNumber: decryptValue(id_number),
      ClientReference: "test",
      AccountNumber: account_number,
      BranchCode: branch_code,
      AccountType: account_type,
      IdentificationType: "SAID",
      Bank: bank.split(" ")[0], // Use the first part of the bank name
      FirstName: first_name,
      Surname: last_name,
      HasConsent: true,
      CacheValidity: "1",
    }),
  });

  if (!accountVerificationResponse.ok) {
    const errorData = await accountVerificationResponse.json();
    console.error("Error verifying account:", errorData);
    return NextResponse.json(
      { error: "Failed to verify account", details: errorData },
      { status: 500 }
    );
  }

  const accountVerificationData: WhoYouAccountVerificationResponse =
    await accountVerificationResponse.json();

  console.log(
    "Account Verification Data:",
    accountVerificationData.detail.accountVerificationInformation
  );

  // Save the API check result to the database
  try {
    const decryptedIdNumber = decryptValue(id_number);
    const { error } = await supabase.from("api_checks").insert({
      id_number: id_number,
      check_type: "bank_verification",
      vendor: "WhoYou",
      status: "passed",
      response_payload: JSON.parse(JSON.stringify(accountVerificationData)),
      checked_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error saving API check result:", error);
    } else {
      console.log("Account verification API check result saved successfully");
    }
  } catch (error) {
    console.error("Error saving API check result:", error);
  }

  return NextResponse.json({
    success: true,
    accountVerificationInformation:
      accountVerificationData.detail.accountVerificationInformation,
  });
}
