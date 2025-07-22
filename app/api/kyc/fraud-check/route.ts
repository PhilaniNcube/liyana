import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";

// Helper function to save API check result to database
async function saveApiCheckResult(
  idNumber: string,
  status: "passed" | "failed" | "pending",
  responsePayload: any
) {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("api_checks").insert({
      id_number: idNumber,
      check_type: "fraud_check",
      vendor: "Experian",
      status: status,
      response_payload: responsePayload,
      checked_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error saving API check result:", error);
    } else {
      console.log("API check result saved successfully");
    }
  } catch (error) {
    console.error("Error saving API check result:", error);
  }
}

export async function POST(request: NextRequest) {
  let idNumber: string | undefined;

  try {
    const {
      idNumber: extractedIdNumber,
      forename,
      surname,
      gender,
      dateOfBirth,
      address1,
      address2,
      address3,
      address4,
      postalCode,
      homeTelCode,
      homeTelNo,
      workTelNo,
      cellTelNo,
      workTelCode,
    } = await request.json();

    idNumber = extractedIdNumber;

    if (!idNumber) {
      return NextResponse.json(
        { error: "ID number is required" },
        { status: 400 }
      );
    }

    const userName = process.env.EXPERIAN_USERNAME!;
    const password = process.env.EXPERIAN_PASSWORD!;

    if (!userName || !password) {
      console.error(
        "Experian credentials are not set in environment variables."
      );
      return NextResponse.json(
        { error: "Experian credentials are not configured" },
        { status: 500 }
      );
    }

    const apiURL =
      process.env.NORMAL_ENQUIRY_URL ||
      "https://apis-uat.experian.co.za:9443/nsv2/NormalSearchService";

    const requestBody = {
      username: userName,
      password: password,
      myOrigin: "QATEST",
      dllVersion: "1",
      searchCriteria: {
        publicDomainSearch: "Y",
        csData: "N",
        cpaPlusNLRData: "N",
        deeds: "N",
        directors: "N",
        runCompuScore: "Y",
        runCodix: "N",
        codixParams:
          "<PARAMS><PARAM_NAME>MonthsSinceEmployed</PARAM_NAME><PARAM_VALUE>12</PARAM_VALUE></PARAMS><PARAMS><PARAM_NAME>IncomePM</PARAM_NAME><PARAM_VALUE>7000</PARAM_VALUE></PARAMS><PARAMS><PARAM_NAME>RunBehaviourScore</PARAM_NAME><PARAM_VALUE>N</PARAM_VALUE></PARAMS>",
        passportFlag: "N",
        identity_number: idNumber,
        forename: forename || "",
        forename2: "",
        forename3: "",
        surname: surname || "",
        gender: gender || "",
        dateOfBirth: dateOfBirth || "",
        address1: address1 || "",
        address2: address2 || address4 || "",
        address3: address3 || "",
        address4: address4 || "",
        postalCode: postalCode || "",
        homeTelCode: homeTelCode || "",
        homeTelNo: homeTelNo || "",
        workTelNo: workTelNo || "",
        cellTelNo: cellTelNo || "",
        workTelCode: workTelCode || "",
        clientConsent: "Y",
        adrs_Mandatory: "Y",
        resultType: "JPDF2",
        enqPurpose: "12",
      },
    };

    console.log("Sending Credit Check request to:", apiURL);

    const response = await fetch(apiURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error("Error fetching Credit Check data:", response.statusText);

      // Save failed API check result
      await saveApiCheckResult(idNumber, "failed", {
        error: "API request failed",
        statusText: response.statusText,
        status: response.status,
        requestBody: requestBody,
      });

      return NextResponse.json(
        { error: "Failed to fetch Credit Check data" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Credit Check data received:", data);

    if (data.error) {
      console.error("Credit Check error:", data.error);

      // Save failed API check result
      await saveApiCheckResult(idNumber, "failed", {
        ...data,
        requestBody: requestBody,
        reason: "API returned error",
      });

      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    // the type of the response is a JSON object that looks like this:
    // {
    // "pTransactionCompleted": true/false,
    // "pRetData": Base64 encoded string (to be decoded on client),
    // }

    // Determine the status based on transaction completion
    const status = data.pTransactionCompleted ? "passed" : "failed";

    // Save API check result
    await saveApiCheckResult(idNumber, status, {
      ...data,
      requestBody: requestBody,
      reason: data.pTransactionCompleted
        ? "Credit Check completed successfully"
        : "Transaction not completed",
    });

    // Return the data as-is, including the Base64 encoded pRetData
    // Client will handle the Base64 decoding
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Credit Check error:", error);

    // Save failed API check result for internal errors
    if (idNumber) {
      await saveApiCheckResult(idNumber, "failed", {
        error: "Internal server error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        reason: "Internal server error during Credit Check",
      });
    }

    return NextResponse.json(
      { error: "Internal server error during Credit Check" },
      { status: 500 }
    );
  }
}
