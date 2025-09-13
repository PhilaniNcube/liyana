import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { decryptValue, encryptValue } from "@/lib/encryption";
import { WhoYouDeceasedStatusResponse } from "@/lib/schemas";
import { parse } from "path";

export async function POST(request: NextRequest) {
  try {
    const { id_number, user_id } = await request.json();

    if (!id_number) {
      return NextResponse.json(
        { error: "ID number is required" },
        { status: 400 }
      );
    }


    // Login to WhoYou API
    const loginURL = `${process.env.WHO_YOU_URL}/otv/token/v1/login/${process.env.WHO_YOU_ID}/${process.env.WHO_YOU_USERNAME}`;
    
    const loginResponse = await fetch(loginURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        serviceAccount: true,
        password: process.env.WHO_YOU_PASSWORD,
      }),
    });

    if (!loginResponse.ok) {
      console.error("WhoYou login API error:", await loginResponse.text());
      return NextResponse.json(
        { error: "Failed to login to WhoYou API" },
        { status: 401 }
      );
    }

    const loginData = await loginResponse.json();
    const accessToken = loginData.detail.token;

        const supabase = await createClient();

    // Check deceased status
    const deceasedStatusURL = `${process.env.WHO_YOU_URL}/hanis/enquire/v1/deceased-status`;
    
    const deceasedStatusResponse = await fetch(deceasedStatusURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        IdNumber: id_number,
        CacheValidity: "1",
        ClientReference: "",
        RequestPurpose: "POLICY_BENEFICIARY_VERIFICATION",
        RequestSource: "LIYANA_POLICY_SYSTEM",
      }),
    });

    if (!deceasedStatusResponse.ok) {
      const errorText = await deceasedStatusResponse.text();
      console.error("WhoYou deceased status API error:", errorText);
      
      // Try to parse the error response for specific error codes
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.code === 10084) {

             const { data, error } = await supabase.from("api_checks").insert({
        id_number: encryptValue(id_number), // Store encrypted value
        check_type: "deceased_status",
        vendor: "WhoYou",
        status: "failed",
        response_payload: JSON.parse(JSON.stringify(errorData)),
        checked_at: new Date().toISOString(),
        profile_id: user_id || null, // Link to user if available
      });

      console.error("Failed to log API check:", error);

          return NextResponse.json(
            { 
              error: "Deceased status verification service is currently unavailable", 
              details: errorData,
              userMessage: "The deceased status verification service is temporarily unavailable. Please contact support for assistance." 
            },
            { status: 400 }
          );
        }
             const { data, error } = await supabase.from("api_checks").insert({
        id_number: encryptValue(id_number), // Store encrypted value
        check_type: "deceased_status",
        vendor: "WhoYou",
        status: "failed",
        response_payload: JSON.parse(JSON.stringify(errorData)),
        checked_at: new Date().toISOString(),
        profile_id: user_id || null, // Link to user if available
      });

      console.error("Failed to log API check:", error);

        return NextResponse.json(
            { 
              error: "Deceased status verification service is currently unavailable", 
              details: errorData,
              userMessage: "The deceased status verification service is temporarily unavailable. Please contact support for assistance." 
            },
            { status: 400 }
          );

        
      } catch (parseError) {
        // If parsing fails, continue with generic error handling

             const { data, error } = await supabase.from("api_checks").insert({
        id_number: encryptValue(id_number), // Store encrypted value
        check_type: "deceased_status",
        vendor: "WhoYou",
        status: "failed",
        response_payload: JSON.parse(JSON.stringify(parseError)),
        checked_at: new Date().toISOString(),
        profile_id: user_id || null, // Link to user if available
      });

      console.error("Failed to log API check:", error);

      }
      
      return NextResponse.json(
        { error: "Failed to check deceased status", details: errorText },
        { status: deceasedStatusResponse.status }
      );
    }

    const deceasedStatusData: WhoYouDeceasedStatusResponse = await deceasedStatusResponse.json();



    // find the user by id_number


    // Store the API check result
    try {
      // Note: 'deceased_status' type needs to be added to the database enum
      // For now, we'll skip the API check logging until the database is updated
      console.log("Deceased status check completed successfully for ID:", id_number);
    const { data, error } = await supabase.from("api_checks").insert({
        id_number: encryptValue(id_number), // Store encrypted value
        check_type: "deceased_status",
        vendor: "WhoYou",
        status: "passed",
        response_payload: JSON.parse(JSON.stringify(deceasedStatusData)),
        checked_at: new Date().toISOString(),
        profile_id: user_id || null, // Link to user if available
      });
   
      console.error("Failed to log API check:", error);

    } catch (e) {
      console.error("Failed to save deceased status api_check", e);
    }

    return NextResponse.json({
      success: true,
      data: deceasedStatusData,
    });
  } catch (error) {
    console.error("Deceased status check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
