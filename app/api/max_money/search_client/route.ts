import { NextResponse } from "next/server";
import { z } from "zod";
import { searchMaxMoneyClientByIdNumber } from "@/lib/utils/max-money";

// Request schema for the client search endpoint
const clientSearchRequestSchema = z.object({
  id_number: z.string().min(1, "ID number is required"),
});

export async function POST(request: Request) {
  try {
    console.log("Starting Max Money client search API request...");

    const body = await request.json();
    console.log("Received request body:", { id_number: body.id_number ? "[PROVIDED]" : "[NOT PROVIDED]" });

    // Validate input data
    const validatedInput = clientSearchRequestSchema.safeParse(body);
    
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

    console.log("Input data validated successfully");

    // Search for the client using the utility function
    const searchResult = await searchMaxMoneyClientByIdNumber(validatedInput.data.id_number);

    console.log("Client search completed successfully");

    // Return the search result
    return NextResponse.json({
      message: "Client search completed successfully",
      ...searchResult,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Max Money client search API error:", errorMessage);
    
    // Return appropriate error status based on error type
    if (errorMessage.includes("Missing Max Money environment variables")) {
      return NextResponse.json(
        { message: "Service configuration error" },
        { status: 500 }
      );
    }
    
    if (errorMessage.includes("Login failed")) {
      return NextResponse.json(
        { message: "Authentication failed with Max Money service" },
        { status: 503 }
      );
    }
    
    if (errorMessage.includes("Client search failed")) {
      return NextResponse.json(
        { message: errorMessage },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}