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

    // Mock fraud check logic
    // In production, this would call Experian fraud prevention API

    // Simulate some IDs with fraud flags
    const fraudIds = [
      "2222222222222", // Fraud flag
      "3333333333333", // Identity theft flag
      "4444444444444", // Suspicious activity flag
    ];

    // Simulate API processing delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (fraudIds.includes(idNumber)) {
      const fraudType =
        idNumber === "2222222222222"
          ? "FRAUD_ALERT"
          : idNumber === "3333333333333"
          ? "IDENTITY_THEFT"
          : "SUSPICIOUS_ACTIVITY";

      return NextResponse.json(
        {
          success: false,
          error: "Fraud alert detected",
          message:
            "This ID number has been flagged for potential fraudulent activity",
          data: {
            fraudType,
            alertLevel: "HIGH",
            dateReported: "2024-01-15",
            reportingAgency: "Experian Fraud Prevention",
          },
        },
        { status: 200 }
      );
    }

    // For demo purposes, all other IDs pass fraud check
    return NextResponse.json({
      success: true,
      message: "No fraud flags detected",
      data: {
        fraudStatus: "CLEAR",
        riskLevel: "LOW",
        lastScanned: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Fraud check error:", error);
    return NextResponse.json(
      { error: "Internal server error during fraud check" },
      { status: 500 }
    );
  }
}
