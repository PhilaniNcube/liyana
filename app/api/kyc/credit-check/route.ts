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

  const apiUrl = `https://apis-uat.experian.co.za:9443/PersonScoreService/getScore/?pUsername=${process.env.EXPERIAN_USERNAME}&pPassword=${process.env.EXPERIAN_PASSWORD}&pIdNumber=${idNumber}&pMyOrigin=Liyana&pMyVersion=2.0&pResultType=json`;

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  console.log("Response status:", response);

  if (!response.ok) {
    console.error("Error fetching score data:", response.statusText);
    return NextResponse.json(
      { error: "Failed to fetch score data" },
      { status: response.status }
    );
  }

  if (!idNumber) {
    return NextResponse.json(
      { error: "ID number is required" },
      { status: 400 }
    );
  }

  return NextResponse.json({ message: "Hello" }, { status: 200 });
}
