import { z } from "zod";
import {
  maxMoneyLoginResponseSchema,
  maxMoneyClientSearchSchema,
  maxMoneyClientSearchResponseSchema,
  type MaxMoneyClientSearch,
  type MaxMoneyClientSearchResponse,
} from "@/lib/schemas";

const MAX_MONEY_URL = process.env.MAX_MONEY_URL;
const MAX_MONEY_USERNAME = process.env.MAX_MONEY_API_USERNAME;
const MAX_MONEY_PASSWORD = process.env.MAX_MONEY_API_PASSWORD;

/**
 * Login to MaxMoney API and get authentication token
 * @returns Promise<MaxMoneyLoginResponse>
 */
async function loginToMaxMoney() {
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

  const startTime = Date.now();
  console.log("Starting Max Money login request at:", new Date(startTime).toISOString());
  
  const loginPayload = {
    user_name: MAX_MONEY_USERNAME,
    password: MAX_MONEY_PASSWORD,
  };

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
    console.log(`Login request completed in ${endTime - startTime}ms`);
    console.log("Login response status:", response.status, response.statusText);

    if (!response.ok) {
      console.error("Max Money login request failed with status:", response.status);
      const errorText = await response.text();
      console.error("Login error response body:", errorText);
      throw new Error(`Login failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const responseText = await response.text();
      console.error("Login response is not JSON. Content-Type:", contentType);
      console.error("Login response body:", responseText);
      throw new Error("Max Money API returned non-JSON response for login");
    }

    const data = await response.json();
    console.log("Login response data:", data);

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

/**
 * Search for a MaxMoney client by ID number or client number
 * @param params - Search parameters containing either id_number or client_number
 * @returns Promise<MaxMoneyClientSearchResponse>
 */
export async function searchMaxMoneyClient(params: {
  id_number?: string;
  client_number?: string;
}): Promise<MaxMoneyClientSearchResponse> {
  try {
    console.log("Starting Max Money client search...");
    
    // Validate that at least one search parameter is provided
    if (!params.id_number && !params.client_number) {
      throw new Error("Either id_number or client_number must be provided");
    }

    // Login to get authentication token
    const loginData = await loginToMaxMoney();

    // Prepare search payload
    const searchPayload: MaxMoneyClientSearch = {
      mle_id: loginData.mle_id,
      mbr_id: loginData.branch_id,
      user_id: loginData.user_id,
      login_token: loginData.login_token,
      ...(params.id_number && { id_number: params.id_number }),
      ...(params.client_number && { client_number: params.client_number }),
    };

    // Validate the search payload
    const validatedSearchPayload = maxMoneyClientSearchSchema.safeParse(searchPayload);

    if (!validatedSearchPayload.success) {
      console.error("Max Money client search validation error:", validatedSearchPayload.error);
      throw new Error("Invalid client search payload");
    }

    console.log("Searching for client with payload:", {
      ...validatedSearchPayload.data,
      login_token: "[HIDDEN]"
    });

    const searchUrl = `${MAX_MONEY_URL}/MaxIntegrate/client_search`;
    console.log("Max Money client search URL:", searchUrl);

    const startTime = Date.now();
    
    const searchResponse = await fetch(searchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validatedSearchPayload.data),
    });

    const endTime = Date.now();
    console.log(`Client search request completed in ${endTime - startTime}ms`);
    console.log("Client search response status:", searchResponse.status, searchResponse.statusText);

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error("Client search failed:", errorText);
      throw new Error(`Failed to search client in Max Money: ${searchResponse.statusText} - ${errorText}`);
    }

    const contentType = searchResponse.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const responseText = await searchResponse.text();
      console.error("Client search response is not JSON:", responseText);
      throw new Error("Max Money API returned non-JSON response for client search");
    }

    const searchData = await searchResponse.json();
    console.log("Client search response data:", searchData);

    const validatedSearchResponse = maxMoneyClientSearchResponseSchema.safeParse(searchData);

    if (!validatedSearchResponse.success) {
      console.error("Max Money client search response validation error:", validatedSearchResponse.error);
      console.error("Raw response data that failed validation:", JSON.stringify(searchData, null, 2));
      throw new Error("Failed to validate Max Money client search response");
    }

    if (validatedSearchResponse.data.return_code !== 0) {
      console.error(
        "Max Money client search failed:",
        validatedSearchResponse.data.return_reason
      );
      throw new Error(
        `Max Money client search failed: ${validatedSearchResponse.data.return_reason}`
      );
    }

    console.log("Max Money client search successful.");
    
    // Log client information if found
    if (validatedSearchResponse.data.return_code === 0 && validatedSearchResponse.data.client_no) {
      console.log("Found client:", {
        client_no: validatedSearchResponse.data.client_no,
        client_name: validatedSearchResponse.data.client_name,
        client_surname: validatedSearchResponse.data.client_surname,
        client_id: validatedSearchResponse.data.client_id,
        cli_status: validatedSearchResponse.data.cli_status,
      });
    } else {
      console.log("No client found or search unsuccessful");
    }

    return validatedSearchResponse.data;

 

  
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Max Money client search error:", errorMessage);
    throw new Error(`Max Money client search failed: ${errorMessage}`);
  }
}

/**
 * Search for a MaxMoney client specifically by ID number
 * @param idNumber - The ID number to search for
 * @returns Promise<MaxMoneyClientSearchResponse>
 */
export async function searchMaxMoneyClientByIdNumber(idNumber: string): Promise<MaxMoneyClientSearchResponse> {
  if (!idNumber || idNumber.trim() === "") {
    throw new Error("ID number is required");
  }

  console.log("Searching for MaxMoney client by ID number:", idNumber);
  
  return searchMaxMoneyClient({ id_number: idNumber.trim() });
}

/**
 * Search for a MaxMoney client specifically by client number
 * @param clientNumber - The client number to search for
 * @returns Promise<MaxMoneyClientSearchResponse>
 */
export async function searchMaxMoneyClientByClientNumber(clientNumber: string): Promise<MaxMoneyClientSearchResponse> {
  if (!clientNumber || clientNumber.trim() === "") {
    throw new Error("Client number is required");
  }

  console.log("Searching for MaxMoney client by client number:", clientNumber);
  
  return searchMaxMoneyClient({ client_number: clientNumber.trim() });
}