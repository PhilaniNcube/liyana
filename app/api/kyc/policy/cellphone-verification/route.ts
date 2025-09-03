import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { decryptValue } from "@/lib/encryption";
import { WhoYouCellphoneVerificationResponse } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  const { policy_id } = await request.json();

  if (!policy_id) {
    return NextResponse.json({ error: "policy_id is required" }, { status: 400 });
  }

  const supabase = await createClient();

  // Fetch policy with holder
  const { data: policy, error: policyError } = await supabase
    .from("policies")
    .select("*, policy_holder:policy_holder_id(*)")
    .eq("id", policy_id)
    .single();

  if (policyError || !policy) {
    return NextResponse.json({ error: "Policy not found" }, { status: 404 });
  }

  const holder: any = (policy as any).policy_holder;
  if (!holder) {
    return NextResponse.json({ error: "Policy holder not found" }, { status: 404 });
  }

  const phone = holder?.contact_details && typeof holder.contact_details === "object"
    ? (holder.contact_details as any).phone || (holder.contact_details as any).cell || null
    : null;

  if (!phone) {
    return NextResponse.json({ error: "No cellphone number for policy holder" }, { status: 400 });
  }

  if (!holder.id_number) {
    return NextResponse.json({ error: "Holder ID number missing" }, { status: 400 });
  }

  const decryptedIdNumber = decryptValue(holder.id_number);
  if (!decryptedIdNumber) {
    return NextResponse.json({ error: "Failed to decrypt ID number" }, { status: 400 });
  }

  // Login to WhoYou
  const loginURL = `${process.env.WHO_YOU_URL}/otv/token/v1/login/${process.env.WHO_YOU_ID}/${process.env.WHO_YOU_USERNAME}`;
  const loginResponse = await fetch(loginURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ serviceAccount: true, password: process.env.WHO_YOU_PASSWORD }),
  });

  if (!loginResponse.ok) {
    return NextResponse.json({ error: "Failed to login to Who You API" }, { status: 401 });
  }

  const loginData = await loginResponse.json();
  const accessToken = loginData.detail.token;

  const cellPhoneVerificationURL = `${process.env.WHO_YOU_URL}/otv/token/v1/cellphone-match`;
  const cellPhoneVerificationResponse = await fetch(cellPhoneVerificationURL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      IdNumber: decryptedIdNumber,
      CellphoneNumber: phone,
      IncludeRawResponse: false,
    }),
  });

  if (!cellPhoneVerificationResponse.ok) {
    const errorText = await cellPhoneVerificationResponse.text();
    return NextResponse.json(
      { error: "Failed to verify cellphone", details: errorText },
      { status: 500 }
    );
  }

  const cellPhoneVerificationData: WhoYouCellphoneVerificationResponse =
    await cellPhoneVerificationResponse.json();

  // Save api_check
  try {
    await supabase.from("api_checks").insert({
      id_number: holder.id_number,
      check_type: "cellphone_verification",
      vendor: "WhoYou",
      status: "passed",
      response_payload: JSON.parse(JSON.stringify(cellPhoneVerificationData)),
      checked_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Failed to save policy cellphone verification api_check", e);
  }

  return NextResponse.json({
    success: true,
    cellphoneVerificationInformation: cellPhoneVerificationData.detail,
  });
}
