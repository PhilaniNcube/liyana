import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createMaxMoneyLoanApplicationSchema,
  maxMoneyLoginResponseSchema,
  maxMoneyLoanApplicationInputSchema,
  maxMoneyLoanApplicationResponseSchema,
  type MaxMoneyLoanApplicationInput,
} from "@/lib/schemas";

const MAX_MONEY_URL = process.env.MAX_MONEY_URL;
const MAX_MONEY_USERNAME = process.env.MAX_MONEY_API_USERNAME;
const MAX_MONEY_PASSWORD = process.env.MAX_MONEY_API_PASSWORD;

async function login() {
  if (!MAX_MONEY_URL || !MAX_MONEY_USERNAME || !MAX_MONEY_PASSWORD) {
    console.error("Missing Max Money environment variables:", {
      MAX_MONEY_URL: !!MAX_MONEY_URL,
      MAX_MONEY_USERNAME: !!MAX_MONEY_USERNAME,
      MAX_MONEY_PASSWORD: !!MAX_MONEY_PASSWORD,
    });
    throw new Error("Missing Max Money environment variables");
  }

  const loginUrl = `${MAX_MONEY_URL}/MaxIntegrate/login`;
  console.log("Attempting to login to Max Money:", loginUrl);
  console.log("Using credentials:", {
    user_name: MAX_MONEY_USERNAME,
    password: MAX_MONEY_PASSWORD ? "[HIDDEN]" : "NOT_SET",
  });

  const startTime = Date.now();
  console.log("Starting Max Money login request at:", new Date(startTime).toISOString());
  
  const loginPayload = {
    user_name: MAX_MONEY_USERNAME,
    password: MAX_MONEY_PASSWORD,
  };
  
  console.log("Login payload (password hidden):", {
    ...loginPayload,
    password: "[HIDDEN]"
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const endTime = Date.now();
    console.log("Max Money login response received in:", endTime - startTime, "ms");
    console.log("Login response status:", response.status);
    console.log("Login response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Max Money login failed with status:", response.status);
      console.error("Error response:", errorText);
      throw new Error(`Max Money login failed: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const responseText = await response.text();
      console.error("Max Money login response is not JSON:", responseText);
      throw new Error("Max Money API returned non-JSON response for login");
    }

    const data = await response.json();
    console.log("Max Money login response data:", data);

    const validatedLogin = maxMoneyLoginResponseSchema.safeParse(data);

    if (!validatedLogin.success) {
      console.error("Max Money login validation error:", validatedLogin.error);
      console.error("Raw response data that failed validation:", JSON.stringify(data, null, 2));
      console.error("Validation error details:", validatedLogin.error.flatten());
      throw new Error("Failed to validate Max Money login response.");
    }

    if (validatedLogin.data.return_code !== 0) {
      console.error(
        "Max Money login failed:",
        validatedLogin.data.return_reason
      );
      throw new Error(
        `Max Money login failed: ${validatedLogin.data.return_reason}`
      );
    }

    console.log("Max Money login successful for user_id:", validatedLogin.data.user_id);

    return validatedLogin.data;
  } catch (fetchError) {
    console.error("Network error during login:", fetchError);
    if (fetchError instanceof TypeError) {
      console.error("This might be a network connectivity issue or invalid URL");
    }
    if (fetchError instanceof Error && fetchError.name === 'AbortError') {
      console.error("Login request timed out after 30 seconds");
    }
    throw fetchError;
  }
}

export async function POST(request: Request) {
  try {
    console.log("Starting Max Money loan application creation process...");
    console.log("Environment check:", {
      MAX_MONEY_URL: !!MAX_MONEY_URL,
      MAX_MONEY_USERNAME: !!MAX_MONEY_USERNAME,
      MAX_MONEY_PASSWORD: !!MAX_MONEY_PASSWORD
    });

    // Login to Max Money API first
    const loginData = await login();

    const body = await request.json();
    console.log("Received request body:", Object.keys(body));

    // Validate input data first
    const validatedInput = maxMoneyLoanApplicationInputSchema.safeParse(body);
    
    if (!validatedInput.success) {
      console.error("Input validation error:", validatedInput.error);
      return NextResponse.json(
        {
          message: "Invalid input data.",
          errors: validatedInput.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    console.log("Input data validated successfully:", validatedInput.data);

    // Create the loan application payload
    const loanApplicationPayload = {
      ...validatedInput.data,
      mle_id: loginData.mle_id,
      mbr_id: loginData.branch_id,
      user_id: loginData.user_id,
      login_token: loginData.login_token,
    };

    // Validate the complete payload
    const validatedLoanApplicationPayload = createMaxMoneyLoanApplicationSchema.safeParse(loanApplicationPayload);

    if (!validatedLoanApplicationPayload.success) {
      console.error("Max Money loan application validation error:", validatedLoanApplicationPayload.error);
      return NextResponse.json(
        {
          message: "Invalid loan application data payload.",
          errors: validatedLoanApplicationPayload.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    console.log("Creating loan application with payload:", validatedLoanApplicationPayload.data);

    // Make the API call to create loan application
    const createLoanApplicationResponse = await fetch(
      `${MAX_MONEY_URL}/MaxIntegrate/create_loan_application`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedLoanApplicationPayload.data),
      }
    );

    console.log("Create loan application response status:", createLoanApplicationResponse.status);
    console.log("Create loan application response headers:", Object.fromEntries(createLoanApplicationResponse.headers.entries()));

    if (!createLoanApplicationResponse.ok) {
      const errorText = await createLoanApplicationResponse.text();
      console.error("Create loan application failed:", errorText);
      return NextResponse.json(
        { message: `Failed to create loan application in Max Money: ${createLoanApplicationResponse.statusText}` },
        { status: createLoanApplicationResponse.status }
      );
    }

    const contentType = createLoanApplicationResponse.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const responseText = await createLoanApplicationResponse.text();
      console.error("Create loan application response is not JSON:", responseText);
      return NextResponse.json(
        { message: "Max Money API returned non-JSON response for create loan application" },
        { status: 500 }
      );
    }

    const createLoanApplicationData = await createLoanApplicationResponse.json();
    console.log("Create loan application response data:", createLoanApplicationData);

    // Validate the response data
    const validatedResponse = maxMoneyLoanApplicationResponseSchema.safeParse(createLoanApplicationData);

    if (!validatedResponse.success) {
      console.error("Max Money loan application response validation error:", validatedResponse.error);
      console.error("Raw response data that failed validation:", JSON.stringify(createLoanApplicationData, null, 2));
      // Return the raw data if validation fails, as the API might be working but schema is wrong
      return NextResponse.json(createLoanApplicationData);
    }

    if (validatedResponse.data.return_code !== 0) {
      console.error("Max Money loan application creation failed:", validatedResponse.data.return_reason);
      return NextResponse.json(
        {
          message: `Failed to create loan application in Max Money: ${validatedResponse.data.return_reason}`,
        },
        { status: 500 }
      );
    }

    console.log("Loan application created successfully:", {
      loan_id: validatedResponse.data.loan_id,
      loan_no: validatedResponse.data.loan_no,
    });

    return NextResponse.json(validatedResponse.data);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Max Money create loan application error:", errorMessage);
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}