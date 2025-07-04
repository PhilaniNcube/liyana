import { NextRequest, NextResponse } from "next/server";

interface ScoreReason {
  reasonCode: string;
  reasonDescription: string;
}

interface ScoreResult {
  resultType: string;
  score: string;
  reasons: ScoreReason[];
}

interface ScoreData {
  idNumber: string;
  results: ScoreResult[];
}

export async function GET(request: NextRequest) {
  // get the id number from the query parameters
  const idNumber = "7408285107080";
  console.log("Received ID number:", idNumber);

  // experian url: https://apis-uat.experian.co.za:9443/PersonScoreService

  // const apiUrl = `https://apis-uat.experian.co.za:9443/PersonScoreService/getScore/${process.env.EXPERIAN_USERNAME}/${process.env.EXPERIAN_PASSWORD}/QATEST/3.0/json/${idNumber}`;

  const userName = process.env.EXPERIAN_USERNAME!;
  const password = process.env.EXPERIAN_PASSWORD!;

  // encode the username and password into url parameters
  const encodedUserName = encodeURIComponent(userName);
  const encodedPassword = encodeURIComponent(password);

  const apiURL = new URL(
    `${process.env.GET_SCORE_URL}/${encodedUserName}/${encodedPassword}/QATEST/3.0/Json/${idNumber}`
  );

  if (!userName || !password) {
    console.error("Experian credentials are not set in environment variables.");
    return NextResponse.json(
      { error: "Experian credentials are not configured" },
      { status: 500 }
    );
  }

  console.log("Fetching score data from:", apiURL.toString());

  const response = await fetch(apiURL.toString(), {
    method: "GET",
  });

  if (!response.ok) {
    console.error("Error fetching score data:", response.statusText);
    return NextResponse.json(
      { error: "Failed to fetch score data" },
      { status: response.status }
    );
  }

  const data = await response.json();
  console.log("Score data received:", data);

  if (!idNumber) {
    return NextResponse.json(
      { error: "ID number is required" },
      { status: 400 }
    );
  }

  return NextResponse.json({ message: "Hello" }, { status: 200 });
}
