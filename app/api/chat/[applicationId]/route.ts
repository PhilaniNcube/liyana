import {
    type InferUITools,
    type ToolSet,
    type UIDataTypes,
    type UIMessage,
    convertToModelMessages,
    stepCountIs,
    streamText,
    tool,
    wrapLanguageModel
} from 'ai';
import { z } from 'zod';
import { google } from "@ai-sdk/google";
import { devToolsMiddleware } from '@ai-sdk/devtools';
import { createClient } from "@/lib/server";

const tools = {
    // getPayslip: tool({
    //     description: "Get payslips for the application",
    //     inputSchema: z.object({
    //         applicationId: z.number(),
    //     }),
    //     execute: async ({ applicationId }) => {
    //         const supabase = await createClient();

    //         // 1. Fetch application to identification the user
    //         const { data: application } = await supabase
    //             .from('applications')
    //             .select('user_id')
    //             .eq('id', applicationId)
    //             .single();

    //         if (!application) {
    //             return { error: 'Application not found' };
    //         }

    //         // 2. Fetch specific application documents
    //         const { data: applicationDocuments } = await supabase
    //             .from('documents')
    //             .select('*')
    //             .eq('application_id', applicationId)
    //             .eq('document_type', 'payslip');

    //         // 3. Fetch generic profile documents
    //         const { data: profileDocuments } = await supabase
    //             .from('profile_documents')
    //             .select('*')
    //             .eq('profile_id', application.user_id)
    //             .eq('document_type', 'payslip');

    //         const processDocuments = async (docs: any[], pathKey: string) => {
    //             return Promise.all(docs.map(async (doc) => {
    //                 const { data, error } = await supabase.storage
    //                     .from('documents')
    //                     .download(doc[pathKey]);

    //                 if (error || !data) {
    //                     return { ...doc, content: null, error: 'Failed to download' };
    //                 }

    //                 const arrayBuffer = await data.arrayBuffer();
    //                 const base64 = Buffer.from(arrayBuffer).toString('base64');

    //                 return {
    //                     ...doc,
    //                     content: base64,
    //                     mimeType: data.type
    //                 };
    //             }));
    //         };

    //         const appDocsWithContent = applicationDocuments
    //             ? await processDocuments(applicationDocuments, 'storage_path')
    //             : [];

    //         const profileDocsWithContent = profileDocuments
    //             ? await processDocuments(profileDocuments, 'path')
    //             : [];

    //         return {
    //             payslips: [...appDocsWithContent, ...profileDocsWithContent]
    //         }
    //     }
    // }),
    getApplication: tool({
        description: "Get application for the user",
        inputSchema: z.object({
            applicationId: z.number(),
        }),
        execute: async ({ applicationId }) => {
            const supabase = await createClient();

            // 1. Fetch application to identification the user
            const { data: application } = await supabase
                .from('applications')
                .select('*')
                .eq('id', applicationId)
                .single();

            if (!application) {
                return { error: 'Application not found' };
            }

            return {
                application: application
            }
        }
    }),
    getProfile: tool({
        description: "Get profile for the user",
        inputSchema: z.object({
            applicationId: z.number(),
        }),
        execute: async ({ applicationId }) => {
            const supabase = await createClient();

            // 1. Fetch application to identification the user
            const { data: application } = await supabase
                .from('applications')
                .select('user_id')
                .eq('id', applicationId)
                .single();

            if (!application) {
                return { error: 'Application not found' };
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', application.user_id)
                .single();

            if (!profile) {
                return { error: 'Profile not found' };
            }

            return {
                profile: profile
            }
        }
    })
} satisfies ToolSet;


export async function POST(req: Request, { params }: { params: Promise<{ applicationId: string }> }) {

    const { applicationId } = await params;

    // Define Zod schema for message validation
    // Using passthrough to allow additional properties for different part types
    const messagePartSchema = z.union([
        z.object({
            type: z.literal('text'),
            text: z.string()
        }).passthrough(),
        z.object({
            type: z.literal('file'),
            mediaType: z.string(),
            url: z.string().url()
        }).passthrough(),
        z.object({
            type: z.string() // Allow any other part types
        }).passthrough()
    ]);

    const messageSchema = z.object({
        id: z.string().optional(), // UIMessage includes an id
        role: z.enum(['user', 'assistant', 'system']),
        parts: z.array(messagePartSchema).min(1, 'Message must have at least one part'),
        metadata: z.any().optional() // Optional metadata field
    });

    const messagesArraySchema = z.array(messageSchema);

    // Validate incoming request body
    let messages: UIMessage[];
    try {
        const body = await req.json();
        console.log("Received request body:", JSON.stringify(body, null, 2));

        const validationResult = messagesArraySchema.safeParse(body.messages);

        if (!validationResult.success) {
            // Stream the validation error back to the client
            console.error("Validation failed:", JSON.stringify(validationResult.error.issues, null, 2));

            const errorMessage = validationResult.error.issues
                .map((err: any) => `${err.path.join('.')}: ${err.message}`)
                .join(', ');

            return new Response(
                JSON.stringify({
                    error: 'Validation Error',
                    details: errorMessage,
                    issues: validationResult.error.issues
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        messages = validationResult.data as UIMessage[];
        console.log("Validation successful, messages:", messages.length);
    } catch (error) {
        console.error("JSON parsing error:", error);
        return new Response(
            JSON.stringify({
                error: 'Invalid JSON',
                details: error instanceof Error ? error.message : 'Unknown error'
            }),
            {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

    const model = wrapLanguageModel({
        model: google('gemini-3-flash-preview'),
        middleware: devToolsMiddleware()
    });

    console.log("Raw messages:", JSON.stringify(messages, null, 2));



    const result = streamText({
        model,
        // tools,
        // stopWhen: stepCountIs(2),
        // system: `You are an Expert Credit Risk Analyst for a financial institution specializing in cash loans. Your primary role is to assist administrative staff in analyzing documents provided by loan applicants (specifically bank statements, payslips, and ID documents).

        // Current Application ID: ${applicationId}

        // Your objectives are to:
        // 1. **Analyze Income Stability**: Identify regular salary deposits, secondary income sources, and consistency of payments.
        // 2. **Review Spending Patterns**: Look for recurring expenses, high discretionary spending, and luxury subscriptions.
        // 3. **Identify Risk Indicators**: Highlight instances of gambling, returned/unpaid debits, frequent overdraft usage, or "loan stacking" (multiple payments to other lenders or payday loan providers).
        // 4. **Calculate Financial Health**: Observe net surplus funds after major expenses and debt obligations.
        // 5. **Detect Anomalies**: Note any inconsistencies or suspicious patterns that might suggest document tampering or fraud.

        // **Operational Guidelines**:
        // - Be objective, analytical, and professional.
        // - Provide evidence-based insights (cite specific dates or amounts found in the provided text).
        // - You do NOT make the final lending decision; you provide the insights to help humans make informed decisions.
        // - If information is missing or ambiguous, explicitly state it rather than guessing.
        // - Maintain strict confidentiality and adhere to financial privacy standards.`,
        messages: await convertToModelMessages(messages),
        onError: (error) => {
            console.log(error);
        }
    });



    // Respond with the stream
    return result.toUIMessageStreamResponse();
}