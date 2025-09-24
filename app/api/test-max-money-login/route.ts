import { NextResponse } from "next/server";
import { maxMoneyLoginResponseSchema } from "@/lib/schemas";

const MAX_MONEY_URL = process.env.MAX_MONEY_URL;
const MAX_MONEY_USERNAME = process.env.MAX_MONEY_API_USERNAME;
const MAX_MONEY_PASSWORD = process.env.MAX_MONEY_API_PASSWORD;

export async function POST() {
  try {
    console.log("🔍 Testing Max Money Login...");
    
    // Environment Variables Check
    console.log("Environment Variables Check:");
    console.log("- MAX_MONEY_URL:", MAX_MONEY_URL || "❌ NOT SET");
    console.log("- MAX_MONEY_USERNAME:", MAX_MONEY_USERNAME || "❌ NOT SET");
    console.log("- MAX_MONEY_PASSWORD:", MAX_MONEY_PASSWORD ? "✅ SET" : "❌ NOT SET");
    
    if (!MAX_MONEY_URL || !MAX_MONEY_USERNAME || !MAX_MONEY_PASSWORD) {
      return NextResponse.json({
        success: false,
        error: "Missing environment variables",
        details: {
          MAX_MONEY_URL: !!MAX_MONEY_URL,
          MAX_MONEY_USERNAME: !!MAX_MONEY_USERNAME,
          MAX_MONEY_PASSWORD: !!MAX_MONEY_PASSWORD,
        }
      }, { status: 500 });
    }

    const loginUrl = `${MAX_MONEY_URL}/MaxIntegrate/login`;
    console.log("Login URL:", loginUrl);

    // URL Validation
    try {
      new URL(loginUrl);
      console.log("✅ URL is valid");
    } catch (urlError) {
      console.log("❌ URL is invalid:", urlError);
      return NextResponse.json({
        success: false,
        error: "Invalid URL",
        loginUrl,
        urlError: urlError instanceof Error ? urlError.message : String(urlError)
      }, { status: 500 });
    }

    const payload = {
      user_name: MAX_MONEY_USERNAME,
      password: MAX_MONEY_PASSWORD,
    };

    console.log("Payload (password hidden):", {
      user_name: MAX_MONEY_USERNAME,
      password: "[HIDDEN]"
    });

    const startTime = Date.now();
    console.log("⏰ Starting request at:", new Date(startTime).toISOString());

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log("⏰ Request timed out after 30 seconds");
      controller.abort();
    }, 30000);

    let response;
    try {
      response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.log("🔥 Fetch error:", fetchError);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json({
          success: false,
          error: "Request timeout",
          duration: Date.now() - startTime,
        }, { status: 408 });
      }
      
      return NextResponse.json({
        success: false,
        error: "Network error",
        details: fetchError instanceof Error ? fetchError.message : String(fetchError),
        duration: Date.now() - startTime,
      }, { status: 500 });
    }

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Request completed in ${duration}ms`);
    console.log("Response status:", response.status, response.statusText);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    // Check response status
    if (!response.ok) {
      const errorText = await response.text();
      console.log("❌ Response not OK. Body:", errorText);
      
      return NextResponse.json({
        success: false,
        error: "HTTP error",
        status: response.status,
        statusText: response.statusText,
        responseBody: errorText,
        duration,
        headers: Object.fromEntries(response.headers.entries()),
      }, { status: response.status });
    }

    // Check content type
    const contentType = response.headers.get("content-type");
    console.log("Content-Type:", contentType);
    
    if (!contentType || !contentType.includes("application/json")) {
      const responseText = await response.text();
      console.log("❌ Response is not JSON. Body:", responseText);
      
      return NextResponse.json({
        success: false,
        error: "Non-JSON response",
        contentType,
        responseBody: responseText,
        duration,
      }, { status: 200 });
    }

    // Parse JSON
    let responseData;
    try {
      responseData = await response.json();
    } catch (jsonError) {
      const responseText = await response.text();
      console.log("❌ Failed to parse JSON:", jsonError);
      console.log("Response body:", responseText);
      
      return NextResponse.json({
        success: false,
        error: "JSON parse error",
        jsonError: jsonError instanceof Error ? jsonError.message : String(jsonError),
        responseBody: responseText,
        duration,
      }, { status: 200 });
    }

    console.log("📦 Raw response data:", JSON.stringify(responseData, null, 2));

    // Validate with schema
    const validatedLogin = maxMoneyLoginResponseSchema.safeParse(responseData);

    if (!validatedLogin.success) {
      console.log("❌ Schema validation failed");
      console.log("Validation errors:", validatedLogin.error.flatten());
      
      return NextResponse.json({
        success: false,
        error: "Schema validation failed",
        rawData: responseData,
        validationErrors: validatedLogin.error.flatten(),
        expectedSchema: {
          return_reason: "string",
          return_code: "number",
          login_token: "string", 
          user_id: "number",
          user_name: "string",
          count_branches: "number",
          branch_id: "number",
          mle_id: "number",
          country_code: "string"
        },
        duration,
      }, { status: 200 });
    }

    console.log("✅ Schema validation passed");

    // Check return code
    if (validatedLogin.data.return_code !== 0) {
      console.log("❌ Login failed with return_code:", validatedLogin.data.return_code);
      console.log("Return reason:", validatedLogin.data.return_reason);
      
      return NextResponse.json({
        success: false,
        error: "Login rejected by Max Money API",
        return_code: validatedLogin.data.return_code,
        return_reason: validatedLogin.data.return_reason,
        fullResponse: validatedLogin.data,
        duration,
      }, { status: 200 });
    }

    console.log("🎉 Login successful!");
    console.log("User ID:", validatedLogin.data.user_id);
    console.log("Branch ID:", validatedLogin.data.branch_id);
    console.log("MLE ID:", validatedLogin.data.mle_id);

    return NextResponse.json({
      success: true,
      message: "Login successful",
      data: {
        ...validatedLogin.data,
        // Hide sensitive information in response
        login_token: "[HIDDEN]"
      },
      duration,
    });

  } catch (error) {
    console.log("🔥 Unexpected error:", error);
    return NextResponse.json({
      success: false,
      error: "Unexpected error",
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}