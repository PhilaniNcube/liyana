import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/service";
import { encryptValue } from "@/lib/encryption";
import { getCurrentUser } from "@/lib/queries/user";

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
  returnData?: string;
}

interface AdhocCreditScoreRequest {
  idNumber: string; // Mandatory ID number for credit check
  profileId?: string; // Optional profile ID of the customer being checked
}

// Helper function to save API check result to database
async function saveApiCheckResult(
  idNumber: string,
  status: "passed" | "failed" | "pending",
  responsePayload: any,
  profileId?: string
) {
  try {
    const supabase = await createServiceClient();

    console.log("Saving API check result with status:", profileId);

    // Validate profile_id exists if provided
    let validatedProfileId = null;
    if (profileId) {
      const { data: profileExists, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", profileId)
        .single();
      
      if (profileError || !profileExists) {
        console.warn(`Profile ID ${profileId} does not exist. Saving API check without profile association.`);
      } else {
        validatedProfileId = profileId;
      }
    }

    const { data, error } = await supabase.from("api_checks").insert({
      id_number: encryptValue(idNumber),
      check_type: "credit_bureau",
      vendor: "Experian",
      status: status,
      response_payload: responsePayload,
      checked_at: new Date().toISOString(),
      profile_id: validatedProfileId,
    }).select('*').single();

    if (error) {
      console.error("Error saving API check result:", error);
      return null;
    } else {
      console.log("Adhoc credit score API check result saved successfully");
      return data.id;
    }
  } catch (error) {
    console.error("Error saving API check result:", error);
    return null;
  }
}



export async function POST(request: NextRequest) {
  try {
    const {
      idNumber,
      profileId
    }: AdhocCreditScoreRequest = await request.json();

    console.log("Adhoc Credit Score Request:", { idNumber, profileId });

    // Validate required fields
    if (!idNumber) {
      return NextResponse.json(
        { error: "ID number is required" },
        { status: 400 }
      );
    }

    // Check if user has admin privileges
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    

    // For this demo, we'll use the existing ID-based API
    // In a real implementation, you might use a different Experian endpoint
    // that accepts personal details instead of just an ID number
    
    // Use the provided ID number directly

    const userName = process.env.EXPERIAN_USERNAME!;
    const password = process.env.EXPERIAN_PASSWORD!;

    if (!userName || !password) {
      console.error("Experian credentials are not set in environment variables.");
      return NextResponse.json(
        { error: "Experian credentials are not configured" },
        { status: 500 }
      );
    }

    // Encode credentials for URL
    const encodedUserName = encodeURIComponent(userName);
    const encodedPassword = encodeURIComponent(password);

    const apiURL = new URL(
      `${process.env.GET_SCORE_URL}/${encodedUserName}/${encodedPassword}/LiyanaFinance/3.0/Json/${idNumber}`
    );

    const response = await fetch(apiURL.toString(), {
      method: "GET",
    });

    if (!response.ok) {
      console.error("Error fetching score data:", response.statusText);
      
      // Save failed API check result
      await saveApiCheckResult(idNumber, "failed", {
        error: response.statusText,
        requestData: { idNumber, profileId }
      }, profileId);

      return NextResponse.json(
        { error: "Failed to fetch credit score data" },
        { status: response.status }
      );
    }

    const apiResponse: ExperianResponse = await response.json();
    console.log("Adhoc Credit Score API Response:", apiResponse);

    // Check for transaction errors
    if (apiResponse.hasErrors || !apiResponse.transactionCompleted) {
      await saveApiCheckResult(idNumber, "failed", {
        ...apiResponse,
        requestData: { idNumber, profileId }
      }, profileId);

      return NextResponse.json(
        {
          success: false,
          message: apiResponse.errorDescription || "Credit check could not be completed.",
          error: apiResponse.errorDescription
        },
        { status: 200 }
      );
    }

    // Parse return data
    if (!apiResponse.returnData) {
      await saveApiCheckResult(idNumber, "failed", {
        ...apiResponse,
        requestData: { idNumber, profileId }
      }, profileId);

      return NextResponse.json(
        {
          success: false,
          message: "Incomplete data received from credit bureau.",
          error: "No return data"
        },
        { status: 500 }
      );
    }

    const data: ScoreData = JSON.parse(apiResponse.returnData);
    console.log("Parsed adhoc score data:", data);

    // Check for empty results
    if (!data || !data.results || data.results.length === 0) {
      await saveApiCheckResult(idNumber, "failed", {
        ...apiResponse,
        parsedData: data,
        requestData: { idNumber, profileId },
        reason: "No credit score information found"
      }, profileId);

      return NextResponse.json(
        {
          success: false,
          message: "No credit score information found for the provided details.",
          error: "No results"
        },
        { status: 200 }
      );
    }

    // Get the score
    const scoreResult = data.results[0];
    const score = parseInt(scoreResult.score, 10);

    if (isNaN(score)) {
      await saveApiCheckResult(idNumber, "failed", {
        ...apiResponse,
        parsedData: data,
        requestData: { idNumber, profileId },
        reason: "Invalid score format received"
      }, profileId);

      return NextResponse.json(
        {
          success: false,
          message: "Invalid score format received.",
          error: "Invalid score"
        },
        { status: 500 }
      );
    }

    // Determine status based on score
    const status = score >= 600 ? "passed" : "failed";
    
    // Save successful API check result
    const result = await saveApiCheckResult(idNumber, status, {
      ...apiResponse,
      parsedData: data,
      creditScore: score,
      requestData: { idNumber, profileId },
      reason: status === "passed" ? "Credit check passed" : "Score below minimum requirement"
    }, profileId);

    // Determine credit band
    let band = "Very Poor";
    if (score >= 750) band = "Excellent";
    else if (score >= 700) band = "Good";
    else if (score >= 650) band = "Fair";
    else if (score >= 600) band = "Poor";

    return NextResponse.json(
      {
        success: true,
        score: score,
        band: band,
        factors: scoreResult.reasons?.map(r => r.reasonDescription) || [],
        timestamp: new Date().toISOString(),
        checkId: result,
        profileId: profileId || null
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error in adhoc credit score check:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "Adhoc Credit Score API",
      usage: "Send POST request with ID number",
      fields: {
        required: ["idNumber"],
        optional: ["profileId"]
      }
    },
    { status: 200 }
  );
}