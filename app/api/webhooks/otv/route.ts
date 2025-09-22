import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/service";
import { otvWebhookPayloadSchema, OtvWebhookPayloadType } from "@/lib/schemas";
import { ZodError } from "zod";
import { sendSms } from "@/lib/actions/sms";

export async function POST(request: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await request.json();
    console.log("OTV Webhook received:", JSON.stringify(body, null, 2));

    // Validate the payload against our schema
    let payload: OtvWebhookPayloadType;
    try {
      payload = otvWebhookPayloadSchema.parse(body);
    } catch (error) {
      console.error("OTV Webhook validation error:", error);
      if (error instanceof ZodError) {
        return NextResponse.json(
          { 
            error: "Invalid payload format", 
            details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Payload validation failed" },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Determine if this is for an application or policy based on the ClientReference
    const clientReference = payload.Metadata.ClientReference;
    let isApplicationRelated = false;
    let isPolicyRelated = false;
    let applicationId: number | null = null;
    let policyId: number | null = null;
    let otvCheck: any = null;

    // Check if this is a policy-related OTV (prefixed with POLICY_)
    if (clientReference.startsWith("POLICY_")) {
      const policyIdFromReference = parseInt(clientReference.replace("POLICY_", ""));
      if (!isNaN(policyIdFromReference)) {
        // Look for OTV check with policy_id
        const { data: policyOtvCheck, error: policyOtvCheckError } = await supabase
          .from("otv_checks")
          .select("*, policy:policy_id(*)")
          .eq("pin_code", payload.PinCode)
          .eq("id_number", payload.IdNumber)
          .eq("policy_id", policyIdFromReference)
          .single();

        if (!policyOtvCheckError && policyOtvCheck) {
          isPolicyRelated = true;
          policyId = policyIdFromReference;
          console.log(`Processing OTV webhook for policy ${policyId}`);
        }
      }
    } else if (clientReference.startsWith("APPLICATION_")) {
      // Handle application-related OTV (prefixed with APPLICATION_)
      const applicationIdFromReference = parseInt(clientReference.replace("APPLICATION_", ""));
      if (!isNaN(applicationIdFromReference)) {
        // Look for OTV check with application_id
        const { data: applicationOtvCheck, error: applicationOtvCheckError } = await supabase
          .from("otv_checks")
          .select("*, application:applications(*)")
          .eq("pin_code", payload.PinCode)
          .eq("id_number", payload.IdNumber)
          .eq("application_id", applicationIdFromReference)
          .single();

        if (!applicationOtvCheckError && applicationOtvCheck) {
          isApplicationRelated = true;
          applicationId = applicationIdFromReference;
          otvCheck = applicationOtvCheck;
          console.log(`Processing OTV webhook for application ${applicationId}`);
        }
      }
    } else {
      // Fallback: Try to find an OTV check by pin code (for legacy or unprefixed references)
      const { data: applicationOtvCheck, error: applicationOtvCheckError } = await supabase
        .from("otv_checks")
        .select("*, application:applications(*)")
        .eq("pin_code", payload.PinCode)
        .eq("id_number", payload.IdNumber)
        .not("application_id", "is", null) // Ensure application_id is not null
        .single();

      if (!applicationOtvCheckError && applicationOtvCheck) {
        // This is application-related
        isApplicationRelated = true;
        applicationId = applicationOtvCheck.application_id;
        otvCheck = applicationOtvCheck;
        console.log(`Processing OTV webhook for application ${applicationId}`);
      } else {
        // Fallback: Check if ClientReference is a direct policy ID (for backward compatibility)
        const policyIdFromReference = parseInt(clientReference);
        if (!isNaN(policyIdFromReference)) {
          const { data: policy, error: policyError } = await supabase
            .from("policies")
            .select("*, policy_holder:policy_holder_id(*)")
            .eq("id", policyIdFromReference)
            .single();

          if (!policyError && policy) {
            // Verify the policy holder's ID number matches
            const policyHolder = policy.policy_holder as any;
            if (policyHolder && policyHolder.id_number === payload.IdNumber) {
              isPolicyRelated = true;
              policyId = policyIdFromReference;
              console.log(`Processing OTV webhook for policy ${policyId} (fallback)`);
            }
          }
        }
      }
    }

    if (!isApplicationRelated && !isPolicyRelated) {
      console.error("No matching application or policy found for OTV webhook");
      return NextResponse.json(
        { error: "No matching application or policy found for this verification" },
        { status: 404 }
      );
    }

    // Determine if the verification is finalized
    const isFinalized = ["VERIFIED_SYS_APRVD", "EXP_SYS_RJCTD"].includes(payload.OtvStatus.Code);
    const isPassed = payload.OtvStatus.Code === "VERIFIED_SYS_APRVD";
    const isFailed = payload.OtvStatus.Code === "EXP_SYS_RJCTD";
    const isPending = ["EXP_TO_REVIEW", "EXP_APRVD_UNVRFD"].includes(payload.OtvStatus.Code);

    // Determine API check status
    let apiCheckStatus: "passed" | "failed" | "pending";
    if (isPassed) {
      apiCheckStatus = "passed";
    } else if (isFailed) {
      apiCheckStatus = "failed";
    } else {
      apiCheckStatus = "pending";
    }

    // Save the OTV results to api_checks table
    const { error: apiCheckError } = await supabase
      .from("api_checks")
      .insert({
        id_number: payload.IdNumber,
        check_type: "dha_otv_facial",
        vendor: "WhoYou",
        status: apiCheckStatus,
        response_payload: payload,
        checked_at: new Date().toISOString(),
        profile_id: null, // api_checks doesn't have application_id/policy_id, only profile_id
      });

    if (apiCheckError) {
      console.error("Error saving OTV API check:", apiCheckError);
      return NextResponse.json(
        { error: "Failed to save verification results" },
        { status: 500 }
      );
    }

    // Update application status if verification is finalized and application-related
    if (isFinalized && isApplicationRelated && otvCheck) {
      const application = otvCheck.application as any;
      let newApplicationStatus = application.status;

      if (isPassed) {
        // If OTV passed, check if we need to move to the next step
        // This could be "in_review" or another appropriate status
        if (application.status === "pending_documents") {
          newApplicationStatus = "in_review";
        }
      } else if (isFailed) {
        // If OTV failed, decline the application
        newApplicationStatus = "declined";
      }

      if (newApplicationStatus !== application.status) {
        const { error: updateError } = await supabase
          .from("applications")
          .update({ 
            status: newApplicationStatus,
            updated_at: new Date().toISOString()
          })
          .eq("id", applicationId!);

        if (updateError) {
          console.error("Error updating application status:", updateError);
          // Don't fail the webhook if status update fails, but log it
        } else {
          console.log(`Application ${applicationId} status updated from ${application.status} to ${newApplicationStatus}`);
        }
      }
    }

    // Update policy status if verification is finalized and policy-related
    if (isFinalized && isPolicyRelated && policyId) {
      // For policies, we might want to update policy status or create additional records
      // This depends on your business logic for policy verification
      if (isPassed) {
        console.log(`Policy ${policyId} OTV verification passed`);
        // You might want to update policy status here
      } else if (isFailed) {
        console.log(`Policy ${policyId} OTV verification failed`);
        // Handle failed verification for policy
      }
    }

    // Log the webhook processing completion
    const entityType = isApplicationRelated ? 'application' : 'policy';
    const entityId = isApplicationRelated ? applicationId : policyId;
    
    console.log(`OTV webhook processed successfully for ${entityType} ${entityId}:`, {
      otvStatus: payload.OtvStatus.Code,
      isFinalized,
      apiCheckStatus,
      hanisResult: payload.HanisResult,
      isVerified: payload.IsVerified,
    });

    // Send SMS notification to admin about OTV status
    const adminSmsNumber = process.env.SMS_NUMBER;
    if (adminSmsNumber) {
      try {
        const statusMessage = isPassed ? 'PASSED ✅' : isFailed ? 'FAILED ❌' : 'PENDING ⏳';
        const smsMessage = `Liyana Finance - OTV Update:\n${entityType.toUpperCase()} #${entityId}\nStatus: ${statusMessage}\nID: ${payload.IdNumber}\nTime: ${new Date().toLocaleString('en-ZA')}`;
        
        await sendSms(adminSmsNumber, smsMessage);
        console.log(`Admin SMS notification sent for ${entityType} ${entityId} OTV status: ${payload.OtvStatus.Code}`);
      } catch (smsError) {
        console.error("Failed to send admin SMS notification:", smsError);
        // Don't fail the webhook if SMS fails, just log the error
      }
    } else {
      console.warn("SMS_NUMBER environment variable not set, skipping admin SMS notification");
    }

    return NextResponse.json({
      success: true,
      message: "OTV webhook processed successfully",
      entityType,
      entityId,
      otvStatus: payload.OtvStatus.Code,
      isFinalized,
      apiCheckStatus,
    });

  } catch (error) {
    console.error("OTV webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error processing OTV webhook" },
      { status: 500 }
    );
  }
}