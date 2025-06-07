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

    // Mock ID verification logic
    // In production, this would call DHA/Experian API

    // Simulate some IDs that fail verification
    const failedIds = [
      "1234567890123", // Test ID that fails
      "0000000000000", // Invalid ID
      "1111111111111", // Invalid ID
    ];

    // Simulate API processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (failedIds.includes(idNumber)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID verification failed",
          message:
            "The provided ID number could not be verified with DHA records",
        },
        { status: 200 }
      );
    }

    // For demo purposes, all other IDs pass verification
    return NextResponse.json({
      success: true,
      message: "ID verified successfully",
      data: {
        verified: true,
        firstName: "John", // Mock data from DHA
        lastName: "Doe",
        dateOfBirth: "1990-01-01",
      },
    });
  } catch (error) {
    console.error("ID verification error:", error);
    return NextResponse.json(
      { error: "Internal server error during ID verification" },
      { status: 500 }
    );
  }
}
