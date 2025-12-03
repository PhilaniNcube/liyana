import { NextRequest } from "next/server";
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY!,
});

export async function POST(request: NextRequest) {

    const model = google('gemini-3-pro-preview');



    // this function should receive a document from the request
   const { document } = await request.json();

   

}