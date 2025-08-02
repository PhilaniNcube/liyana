import { NextRequest, NextResponse } from "next/server";
import {
  WhoYouEmploymentVerificationResponse,
  DecryptedApplication,
} from "@/lib/schemas";

export async function POST(request: NextRequest) {
  const { application }: { application: DecryptedApplication } =
    await request.json();

  if (!application) {
    return NextResponse.json(
      { error: "Application data is required" },
      { status: 400 }
    );
  }

  if (!application.id_number_decrypted) {
    return NextResponse.json(
      { error: "Decrypted ID number is required" },
      { status: 400 }
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

  const employmentURL = `${process.env.WHO_YOU_URL}/hanis/enquire/v1/employer`;

  const idNumber = application.id_number_decrypted;

  const employmentResponse = await fetch(employmentURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${loginToken}`,
    },
    body: JSON.stringify({
      idNumber: idNumber,
      CacheValidity: "1",
      ClientReference: application.id,
      RequestPurpose: "",
      RequestSource: "",
    }),
  });

  if (!employmentResponse.ok) {
    console.error(
      "Failed to fetch employment data:",
      employmentResponse.statusText
    );
    console.error("Response body:", await employmentResponse.text());
    return NextResponse.json(
      { error: "Failed to fetch employment data" },
      { status: employmentResponse.status }
    );
  }

  const employmentData: WhoYouEmploymentVerificationResponse =
    await employmentResponse.json();

  return NextResponse.json({
    data: employmentData,
    message: "Employment data fetched successfully",
  });
}
