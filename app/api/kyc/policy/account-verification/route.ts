import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { decryptValue } from "@/lib/encryption";
import { WhoYouAccountVerificationResponse } from "@/lib/schemas";

// Policy Bank Account Verification - mirrors application account verification logic
export async function POST(request: NextRequest) {
  const { policy_id } = await request.json();

  if (!policy_id) {
    return NextResponse.json(
      { error: "policy_id is required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Fetch policy with holder
  const { data: policy, error: policyError } = await supabase
    .from("policies")
    .select("*, policy_holder:policy_holder_id(*)")
    .eq("id", policy_id)
    .single();

  if (policyError || !policy) {
    return NextResponse.json(
      { error: "Policy not found" },
      { status: 404 }
    );
  }

  const holder: any = (policy as any).policy_holder;
  if (!holder) {
    return NextResponse.json(
      { error: "Policy holder not found" },
      { status: 404 }
    );
  }

  // Banking details expected to be a JSON object
  const banking: any = holder.banking_details || {};
  const account_number = banking.account_number;
  const account_type = banking.account_type;
  const branch_code = banking.branch_code;
  const bank_name = banking.bank_name;
  const account_name = banking.account_name || holder.first_name || "";

  if (!account_number || !account_type || !branch_code || !bank_name) {
    return NextResponse.json(
      { error: "Missing required banking details" },
      { status: 400 }
    );
  }

  if (!holder.id_number) {
    return NextResponse.json(
      { error: "Holder ID number not available" },
      { status: 400 }
    );
  }

  const decryptedIdNumber = decryptValue(holder.id_number);
  if (!decryptedIdNumber) {
    return NextResponse.json(
      { error: "Failed to decrypt ID number" },
      { status: 400 }
    );
  }

  // Login to WhoYou
  const loginURL = `${process.env.WHO_YOU_URL}/otv/token/v1/login/${process.env.WHO_YOU_ID}/${process.env.WHO_YOU_USERNAME}`;
  const loginResponse = await fetch(loginURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const accessToken = loginData.detail.token;

  const accountVerificationUrl = `${process.env.WHO_YOU_URL}/hanis/enquire/v1/accountverification/bureau-avs`;

  const accountVerificationResponse = await fetch(accountVerificationUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      IdentificationNumber: decryptedIdNumber,
      ClientReference: "policy",
      AccountNumber: account_number,
      BranchCode: branch_code,
      AccountType: account_type,
      IdentificationType: "SAID",
      Bank: bank_name.split(" ")[0],
      FirstName: holder.first_name || account_name.split(" ")[0] || "",
      Surname: holder.last_name || account_name.split(" ").slice(1).join(" ") || "",
      HasConsent: true,
      CacheValidity: "1",
    }),
  });

  if (!accountVerificationResponse.ok) {
    const errorData = await accountVerificationResponse.json();
    return NextResponse.json(
      { error: "Failed to verify account", details: errorData },
      { status: 500 }
    );
  }

  const accountVerificationData: WhoYouAccountVerificationResponse =
    await accountVerificationResponse.json();

  try {
    await supabase.from("api_checks").insert({
      id_number: holder.id_number,
      check_type: "bank_verification",
      vendor: "WhoYou",
      status: "passed",
      response_payload: JSON.parse(JSON.stringify(accountVerificationData)),
      checked_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Failed to save bank verification api_check", e);
  }

  return NextResponse.json({
    success: true,
    accountVerificationInformation:
      accountVerificationData.detail.accountVerificationInformation,
  });
}
