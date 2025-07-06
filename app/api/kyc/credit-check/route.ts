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

interface ExperianResponse {
  transactionCompleted: boolean;
  hasErrors: boolean;
  errorCode: string;
  errorDescription: string;
  returnData?: string; // This is a JSON string, and optional
}

export async function GET(request: NextRequest) {
  // get the id number from the query parameters
  const idNumber = request.nextUrl.searchParams.get("idNumber");

  if (!idNumber) {
    return NextResponse.json(
      { error: "ID number is required" },
      { status: 400 }
    );
  }

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

  const apiResponse: ExperianResponse = await response.json();
  console.log("Full API Response:", apiResponse);

  // Check for transaction errors from the Experian API
  if (apiResponse.hasErrors || !apiResponse.transactionCompleted) {
    return NextResponse.json(
      {
        success: false,
        message:
          apiResponse.errorDescription ||
          "Credit check could not be completed.",
      },
      { status: 200 } // Return 200 OK as the API call itself was successful
    );
  }

  // Since we checked for errors, returnData should now be present.
  // If it's not, something is wrong with the API response contract.
  if (!apiResponse.returnData) {
    return NextResponse.json(
      {
        success: false,
        message: "Incomplete data received from credit bureau.",
      },
      { status: 500 }
    );
  }

  // Parse the JSON string in returnData
  const data: ScoreData = JSON.parse(apiResponse.returnData);
  console.log("Parsed Score data received:", data);

  // Check for an empty result from the Experian API, which can indicate a "thin file"
  if (!data || !data.results || data.results.length === 0) {
    return NextResponse.json(
      {
        success: false,
        message:
          apiResponse.errorDescription ||
          "No credit score information found for the provided ID.",
      },
      { status: 200 } // Treat as a successful call that returned no data
    );
  }

  // Assuming the first result is the primary score
  const scoreResult = data.results[0];
  const score = parseInt(scoreResult.score, 10);

  if (isNaN(score)) {
    return NextResponse.json(
      { success: false, message: "Invalid score format received." },
      { status: 500 }
    );
  }

  // Check if the score meets the minimum requirement
  if (score < 600) {
    return NextResponse.json(
      {
        success: false,
        message: `Unfortunately, your credit score of ${score} does not meet the minimum requirement of 600.`,
        score: score,
        reasons: scoreResult.reasons,
      },
      { status: 200 } // Still a 200 OK because the API call was successful
    );
  }

  // If the score is sufficient, return a success response
  return NextResponse.json(
    {
      success: true,
      message: "Credit check passed.",
      score: score,
      reasons: scoreResult.reasons,
    },
    { status: 200 }
  );
}
