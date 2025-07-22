import { NextRequest, NextResponse } from "next/server";
import { WhoYouEmailVerificationResponse } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

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

  // Now you can use the access_token to make requests to the Who You API

  const emailVerificationUrl = `${process.env.WHO_YOU_URL}/hanis/enquire/v1/email-verification`;

  const emailVerificationResponse = await fetch(emailVerificationUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      EmailAddress: email,
      CacheValidity: "1",
      ClientReference: "",
      RequestPurpose: "",
      RequestSource: "",
    }),
  });

  // add a try-catch block to handle errors
  if (!emailVerificationResponse.ok) {
    const errorData = await emailVerificationResponse.json();
    console.error("Error verifying email:", errorData);
    return NextResponse.json(
      { error: "Failed to verify email", details: errorData },
      { status: 400 }
    );
  }

  const emailVerificationData: WhoYouEmailVerificationResponse =
    await emailVerificationResponse.json();

  const emailVerificationInfo =
    emailVerificationData.detail.emailVerificationInformation;

  // Return the email verification response
  return NextResponse.json({
    success: true,
    data: emailVerificationData,
    // Extract key verification details for easy access
    verification: {
      email: emailVerificationInfo.email,
      isHighRisk: emailVerificationInfo.isHighRisk,
      isDeliverable: emailVerificationInfo.isDeliverable,
      domainInfo: {
        domain: emailVerificationInfo.domainDetails.domain,
        isDisposable: emailVerificationInfo.domainDetails.isDisposable,
        isFree: emailVerificationInfo.domainDetails.isFree,
        registeredTo: emailVerificationInfo.domainDetails.registeredTo,
      },
      breachInfo: {
        compromised: emailVerificationInfo.breachDetails.haveIBeenPwnedListed,
        numberOfBreaches: emailVerificationInfo.breachDetails.numberOfBreaches,
      },
    },
  });
}
