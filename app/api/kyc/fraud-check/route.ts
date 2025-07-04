import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // const { idNumber } = await request.json();

    // get the id number from the query parameters
    const { searchParams } = new URL(request.url);
    const idNumber = searchParams.get("idNumber"); // Default for testing

    console.log("Received ID number:", idNumber);

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
      `${process.env.NORMAL_ENQUIRY_URL}/${encodedUserName}/${encodedPassword}/QATEST/3.0/Json/${idNumber}`
    );

    if (!userName || !password) {
      console.error(
        "Experian credentials are not set in environment variables."
      );
      return NextResponse.json(
        { error: "Experian credentials are not configured" },
        { status: 500 }
      );
    }

    console.log("Fetching fraud check data from:", apiURL.toString());

    const response = await fetch(apiURL.toString(), {
      method: "GET",
    });

    if (!response.ok) {
      console.error(response);
      console.error("Error fetching fraud check data:", response.statusText);
      return NextResponse.json(
        { error: "Failed to fetch fraud check data" },
        { status: response.status }
      );
    }

    // Check if the response is empty

    const data = await response.text();
    console.log("Fraud check data received:", data);

    return NextResponse.json(
      {
        results: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fraud check error:", error);
    return NextResponse.json(
      { error: "Internal server error during fraud check" },
      { status: 500 }
    );
  }
}
