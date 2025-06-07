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

    // Mock debt review check logic
    // In production, this would call Experian debt review API

    // Simulate some IDs under debt review
    const debtReviewIds = [
      "8888888888888", // Under debt review
      "9999999999999", // Under debt review
      "1122334455667", // Under debt review
    ];

    // Simulate API processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (debtReviewIds.includes(idNumber)) {
      return NextResponse.json(
        {
          success: false,
          error: "Consumer under debt review",
          message:
            "This consumer is currently under debt review and cannot apply for new credit",
          data: {
            debtReviewStatus: "ACTIVE",
            debtCounsellorName: "ABC Debt Counsellors",
            dateEntered: "2023-06-15",
          },
        },
        { status: 200 }
      );
    }

    // For demo purposes, all other IDs pass debt review check
    return NextResponse.json({
      success: true,
      message: "No debt review flags found",
      data: {
        debtReviewStatus: "CLEAR",
        lastChecked: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Debt review check error:", error);
    return NextResponse.json(
      { error: "Internal server error during debt review check" },
      { status: 500 }
    );
  }
}
