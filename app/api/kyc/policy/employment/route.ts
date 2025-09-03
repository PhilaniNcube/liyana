import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { decryptValue } from "@/lib/encryption";
import {
  WhoYouEmploymentVerificationResponse,
} from "@/lib/schemas";

// Policy Employment Verification - mirrors /api/kyc/employment used for applications
export async function POST(request: NextRequest) {
  const { policy_id } = await request.json();

  if (!policy_id) {
    return NextResponse.json(
      { error: "policy_id is required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Fetch policy & holder (party)
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
  if (!holder || !holder.id_number) {
    return NextResponse.json(
      { error: "Policy holder ID number not available" },
      { status: 400 }
    );
  }

  let decryptedIdNumber: string | null = null;
  try {
    decryptedIdNumber = decryptValue(holder.id_number) || null;
  } catch (e) {
    decryptedIdNumber = null;
  }

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

  const employmentURL = `${process.env.WHO_YOU_URL}/hanis/enquire/v1/employer`;
  const employmentResponse = await fetch(employmentURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      idNumber: decryptedIdNumber,
      CacheValidity: "1",
      ClientReference: "",
      RequestPurpose: "",
      RequestSource: "",
    }),
  });

  if (!employmentResponse.ok) {
    const body = await employmentResponse.text();
    return NextResponse.json(
      { error: "Failed to fetch employment data", details: body },
      { status: employmentResponse.status }
    );
  }

  const employmentData: WhoYouEmploymentVerificationResponse =
    await employmentResponse.json();

  // Persist API check
  try {
    await supabase.from("api_checks").insert({
      id_number: holder.id_number, // encrypted stored value
      check_type: "employment_verification",
      vendor: "WhoYou",
      status: "passed",
      response_payload: JSON.parse(JSON.stringify(employmentData)),
      checked_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Failed to save employment verification api_check", e);
  }

  return NextResponse.json({
    data: employmentData,
    message: "Employment data fetched successfully",
  });
}
