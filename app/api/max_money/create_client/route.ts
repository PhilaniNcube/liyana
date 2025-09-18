import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createMaxMoneyClientSchema,
  maxMoneyLoginResponseSchema,
  maxMoneyClientInputSchema,
  type MaxMoneyClientInput,
} from "@/lib/schemas";
import { GENDERS, ID_TYPES } from "@/lib/enums";



const MAX_MONEY_URL = process.env.MAX_MONEY_URL;
const MAX_MONEY_USERNAME = process.env.MAX_MONEY_API_USERNAME;
const MAX_MONEY_PASSWORD = process.env.MAX_MONEY_API_PASSWORD;

async function login() {
  if (!MAX_MONEY_URL || !MAX_MONEY_USERNAME || !MAX_MONEY_PASSWORD) {
    throw new Error("Missing Max Money environment variables");
  }

  console.log("Attempting to login to Max Money:", `${MAX_MONEY_URL}/MaxIntegrate/login`);
  
  const response = await fetch(`${MAX_MONEY_URL}/MaxIntegrate/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_name: MAX_MONEY_USERNAME,
      password: MAX_MONEY_PASSWORD,
    }),
  });

  console.log("Login response status:", response.status);


  if (!response.ok) {
    const errorText = await response.text();
    console.error("Login failed with status:", response.status, "Response:", errorText);
    throw new Error(`Login failed: ${response.status} ${response.statusText}`);
  }

 
  const data = await response.json();
  console.log("Login response data:", data);

  const validatedLogin = maxMoneyLoginResponseSchema.safeParse(data);

  if (!validatedLogin.success) {
    console.error("Max Money login validation error:", validatedLogin.error);
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
}

export async function POST(request: Request) {
  try {
    console.log("Starting Max Money client creation process...");
    console.log("Environment check:", {
      MAX_MONEY_URL: !!MAX_MONEY_URL,
      MAX_MONEY_USERNAME: !!MAX_MONEY_USERNAME,
      MAX_MONEY_PASSWORD: !!MAX_MONEY_PASSWORD
    });

    const loginData = await login();

    const body = await request.json();

    console.log("Received request body:", Object.keys(body));

    // Validate input data first
    const validatedInput = maxMoneyClientInputSchema.safeParse(body);
    
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

    // Map gender and id_type descriptions to their corresponding numeric values
    const genderValue = GENDERS.find(
      (g) => g.description.toLowerCase() === (validatedInput.data.gender || "male").toLowerCase()
    )?.value || 1; // Default to Male if not found
    
    const idTypeValue = ID_TYPES.find(
      (i) => i.description.toLowerCase() === (validatedInput.data.id_type || "rsa id").toLowerCase()
    )?.value || 1; // Default to RSA Id if not found

    const clientPayload = {
      ...validatedInput.data,
      mle_id: loginData.mle_id,
      mbr_id: loginData.branch_id,
      user_id: loginData.user_id,
      login_token: loginData.login_token,
      gender: genderValue,
      id_type: idTypeValue,
    };

    const validatedClientPayload =
      createMaxMoneyClientSchema.safeParse(clientPayload);

    if (!validatedClientPayload.success) {
      console.error("Max Money client validation error:", validatedClientPayload.error);
      return NextResponse.json(
        {
          message: "Invalid client data payload.",
          errors: validatedClientPayload.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    console.log("Creating client with payload:", validatedClientPayload.data);

    const createClientResponse = await fetch(
      `${MAX_MONEY_URL}/MaxIntegrate/client_create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedClientPayload.data),
      }
    );

    console.log("Create client response status:", createClientResponse.status);
    console.log("Create client response headers:", Object.fromEntries(createClientResponse.headers.entries()));

    if (!createClientResponse.ok) {
      const errorText = await createClientResponse.text();
      console.error("Create client failed:", errorText);
      return NextResponse.json(
        { message: `Failed to create client in Max Money: ${createClientResponse.statusText}` },
        { status: createClientResponse.status }
      );
    }

    const contentType = createClientResponse.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const responseText = await createClientResponse.text();
      console.error("Create client response is not JSON:", responseText);
      return NextResponse.json(
        { message: "Max Money API returned non-JSON response for create client" },
        { status: 500 }
      );
    }

    const createClientData = await createClientResponse.json();
    console.log("Create client response data:", createClientData);

    if (createClientData.return_code !== 0) {
      // Check if it's a validation error
      if (createClientData.validation_errors && createClientData.validation_errors.length > 0) {
        const validationErrors = createClientData.validation_errors.map((err: any) => 
          `${err.field_name}: ${err.error}`
        ).join(', ');
        
        return NextResponse.json(
          {
            message: `Validation error from Max Money: ${validationErrors}`,
            validation_errors: createClientData.validation_errors
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        {
          message: `Failed to create client in Max Money: ${createClientData.return_reason}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(createClientData);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Max Money create client error:", errorMessage);
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
