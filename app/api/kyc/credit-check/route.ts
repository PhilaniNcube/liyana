import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { idNumber } = await request.json();

    if (!idNumber) {
      return NextResponse.json(
        { error: "ID number is required" },
        { status: 400 }
      );
    }

    // Mock credit score check logic
    // In production, this would call Experian credit bureau API

    // Simulate some IDs with low credit scores
    const lowCreditScoreIds = [
      "5555555555555", // Low credit score
      "6666666666666", // Low credit score
      "7777777777777", // No credit history
    ];

    // Simulate API processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (lowCreditScoreIds.includes(idNumber)) {
      const score =
        idNumber === "7777777777777"
          ? 0
          : Math.floor(Math.random() * 300) + 300; // 300-600 range

      return NextResponse.json(
        {
          success: false,
          error: "Credit score below minimum requirement",
          message: `Credit score of ${score} is below the minimum requirement of 630`,
          data: {
            creditScore: score,
            minimumRequired: 630,
          },
        },
        { status: 200 }
      );
    }

    // For demo purposes, generate a passing credit score for other IDs
    const passingScore = Math.floor(Math.random() * 270) + 630; // 630-900 range

    return NextResponse.json({
      success: true,
      message: "Credit check passed",
      data: {
        creditScore: passingScore,
        minimumRequired: 630,
        creditHistory: {
          accountsInGoodStanding: Math.floor(Math.random() * 5) + 3,
          totalAccounts: Math.floor(Math.random() * 8) + 5,
          paymentHistory: "Good",
        },
      },
    });
  } catch (error) {
    console.error("Credit check error:", error);
    return NextResponse.json(
      { error: "Internal server error during credit check" },
      { status: 500 }
    );
  }
}
