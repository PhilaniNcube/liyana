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

/**
 * /api/kyc/credit-check:
 *   post:
 *     summary: Mock credit score endpoint for testing
 *     description: Returns mock credit score data for testing purposes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idNumber:
 *                 type: string
 *                 description: The 13-digit RSA consumer ID number
 *     responses:
 *       200:
 *         description: Successful response with mock score data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 idNumber:
 *                   type: string
 *                 results:
 *                   type: array
 *       400:
 *         description: Bad Request - Missing or invalid parameters
 */

export async function POST(request: NextRequest) {
  try {
    const { idNumber } = await request.json();

    if (!idNumber) {
      return NextResponse.json(
        { error: "ID number is required" },
        { status: 400 }
      );
    }

    // Validate ID number format (should be 13 digits)
    if (!/^\d{13}$/.test(idNumber)) {
      return NextResponse.json(
        { error: "ID number must be exactly 13 digits" },
        { status: 400 }
      );
    }

    // Mock response - simulate different scores based on ID number
    const mockScoreData: ScoreData = {
      idNumber: idNumber,
      results: [
        {
          resultType: "Activated Score",
          score: idNumber.endsWith("0") ? "750" : "620", // Mock different scores
          reasons: [
            {
              reasonCode: "01",
              reasonDescription: "Good payment history",
            },
            {
              reasonCode: "02",
              reasonDescription: "Length of credit history",
            },
          ],
        },
      ],
    };

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return NextResponse.json(mockScoreData, { status: 200 });
  } catch (error) {
    console.error("Credit check error:", error);
    return NextResponse.json(
      { error: "Internal server error during credit check" },
      { status: 500 }
    );
  }
}
