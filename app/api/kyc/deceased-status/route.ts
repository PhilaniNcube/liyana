import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { decryptValue } from "@/lib/encryption";
import { WhoYouDeceasedStatusResponse } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  try {
    const { id_number } = await request.json();

    if (!id_number) {
      return NextResponse.json(
        { error: "ID number is required" },
        { status: 400 }
      );
    }

    // Decrypt the ID number
    const decryptedIdNumber = decryptValue(id_number);
    if (!decryptedIdNumber) {
      return NextResponse.json(
        { error: "Failed to decrypt ID number" },
        { status: 400 }
      );
    }

    // Login to WhoYou API
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
        { error: "Failed to login to WhoYou API" },
        { status: 401 }
      );
    }

    const loginData = await loginResponse.json();
    const accessToken = loginData.detail.token;

    // Check deceased status
    const deceasedStatusURL = `${process.env.WHO_YOU_URL}/hanis/enquire/v1/deceased-status`;
    
    const deceasedStatusResponse = await fetch(deceasedStatusURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        IdNumber: decryptedIdNumber,
        CacheValidity: "1",
        ClientReference: "",
        RequestPurpose: "POLICY_BENEFICIARY_VERIFICATION",
        RequestSource: "LIYANA_POLICY_SYSTEM",
      }),
    });

    if (!deceasedStatusResponse.ok) {
      const errorText = await deceasedStatusResponse.text();
      console.error("WhoYou deceased status API error:", errorText);
      return NextResponse.json(
        { error: "Failed to check deceased status", details: errorText },
        { status: deceasedStatusResponse.status }
      );
    }

    const deceasedStatusData: WhoYouDeceasedStatusResponse = await deceasedStatusResponse.json();

    const supabase = await createClient();

    // Store the API check result
    try {
      // Note: 'deceased_status' type needs to be added to the database enum
      // For now, we'll skip the API check logging until the database is updated
      console.log("Deceased status check completed successfully for ID:", decryptedIdNumber);
      // await supabase.from("api_checks").insert({
      //   id_number: id_number, // Store encrypted value
      //   check_type: "deceased_status",
      //   vendor: "WhoYou",
      //   status: "passed",
      //   response_payload: JSON.parse(JSON.stringify(deceasedStatusData)),
      //   checked_at: new Date().toISOString(),
      // });
    } catch (e) {
      console.error("Failed to save deceased status api_check", e);
    }

    return NextResponse.json({
      success: true,
      data: deceasedStatusData,
    });
  } catch (error) {
    console.error("Deceased status check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
