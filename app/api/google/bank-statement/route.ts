import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, convertToModelMessages, type UIMessage } from "ai";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("No messages provided", { status: 400 });
    }

    console.log("Received messages:", messages.length);

    // Use gemini-3-pro-preview for the latest capabilities
    const model = google("gemini-3-pro-preview");

    const result = streamText({
      model,
      system: `You are an expert financial analyst. Analyze the attached bank statement document.
Provide a detailed summary including:
- **Income Analysis**: Total deposits, main sources of income, and frequency.
- **Expense Analysis**: Total withdrawals, major expense categories (e.g., rent, utilities, groceries, entertainment).
- **Spending Patterns**: Identify recurring payments, discretionary vs. non-discretionary spending trends.
- **Risk Assessment**: Highlight any red flags such as overdraft fees, returned checks, gambling transactions, excessive debt repayments, or consistently low balances.
- **Net Cash Flow**: Calculate the difference between total income and total expenses.

Please provide the output in a structured markdown format.`,
      messages: convertToModelMessages(messages),
      onChunk: ({ chunk }) => {
          if (chunk.type === 'text-delta') {
            console.log('Chunk:', chunk.text);
          }
      },
      onFinish: ({ text }) => {
        console.log('Analysis complete, length:', text.length);
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error processing bank statement:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal Server Error" }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
