import { NextRequest } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

export async function POST(request: NextRequest) {



  try {
    const { document } = await request.json();

    if (!document) {
      console.error("No document provided in the request body");  
      return new Response("No document provided", { status: 400 });
    }

    // Extract mime type and clean base64 data
    let mimeType = "application/pdf";
    let base64Data = document;

    if (document.includes("base64,")) {
      const match = document.match(/data:(.*);base64,(.*)/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      } else {
        // Fallback if regex doesn't match but base64 marker exists
        base64Data = document.split("base64,")[1];
      }
    }

    // Use gemini-3-pro-preview for the latest capabilities
    const model = google("gemini-2.5-flash-preview-09-2025");

    const result = streamText({
      model,
      onChunk: ({ chunk }) => {
          if (chunk.type === 'text-delta') {
            console.log('Chunk:', chunk.text);
          }
      },
      onFinish: ({ text }) => {
        console.log('Analysis complete:', text);
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert financial analyst. Analyze the attached bank statement document.
Provide a detailed summary including:
- **Income Analysis**: Total deposits, main sources of income, and frequency.
- **Expense Analysis**: Total withdrawals, major expense categories (e.g., rent, utilities, groceries, entertainment).
- **Spending Patterns**: Identify recurring payments, discretionary vs. non-discretionary spending trends.
- **Risk Assessment**: Highlight any red flags such as overdraft fees, returned checks, gambling transactions, excessive debt repayments, or consistently low balances.
- **Net Cash Flow**: Calculate the difference between total income and total expenses.

Please provide the output in a structured markdown format.`,
            },
            {
              type: "file",
              data: base64Data,
              mediaType: mimeType,
            },
          ],
        },
      ],
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error processing bank statement:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
