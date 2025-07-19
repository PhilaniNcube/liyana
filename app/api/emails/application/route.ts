import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/server";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const requestSchema = z.object({
  applicationId: z.number().min(1, "Application ID must be a positive number"),
  message: z.string().min(1, "Message is required"),
  subject: z.string().min(1, "Subject is required").optional(),
  attachmentData: z.string().optional(), // Base64 string of the credit report ZIP
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const result = requestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { applicationId, message, subject, attachmentData } = result.data;

    const supabase = await createClient();

    console.log("attachmentData length:", attachmentData?.length || 0);

    // Check if user is authenticated and is admin/editor
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user has admin or editor role
    const { data: userProfile, error: userProfileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userProfileError || !userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    if (userProfile.role !== "admin" && userProfile.role !== "editor") {
      return NextResponse.json(
        { error: "Access denied. Admin or editor privileges required." },
        { status: 403 }
      );
    }

    // Fetch application details first
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Fetch user profile separately
    const { data: applicantProfile, error: applicantProfileError } =
      await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("id", application.user_id)
        .single();

    // Get user email from auth user (more reliable than profile table)
    const { data: applicationUser, error: authUserError } =
      await supabase.auth.admin.getUserById(application.user_id);

    let userEmail: string;
    let userName: string;

    if (authUserError || !applicationUser?.user?.email) {
      // Fallback to profile email if auth user fetch fails
      if (!applicantProfile?.email) {
        return NextResponse.json(
          { error: "User email not found for this application" },
          { status: 404 }
        );
      }
      userEmail = applicantProfile.email;
      userName = applicantProfile?.full_name || "Valued Customer";
    } else {
      userEmail = applicationUser.user.email;
      userName =
        applicantProfile?.full_name ||
        applicationUser.user.user_metadata?.full_name ||
        "Valued Customer";
    }

    // Send email using Resend
    const emailSubject =
      subject || `Update on your loan application #${applicationId}`;

    // Handle credit report attachment if provided
    const attachments: Array<{
      filename: string;
      content: Buffer | string;
      content_type?: string;
    }> = [];

    if (attachmentData && attachmentData.trim().length > 0) {
      try {
        // Use the provided Base64 string directly
        attachments.push({
          filename: `Credit_Report_${applicationId}_${new Date().toISOString().split("T")[0]}.zip`,
          content: attachmentData, // Base64 encoded ZIP file
          content_type: "application/zip",
        });

        console.log(
          `Credit report ZIP attached for application ${applicationId} (Base64: ${attachmentData.length} chars)`
        );
      } catch (attachmentError) {
        console.error(
          "Failed to process credit report attachment:",
          attachmentError
        );
        // Continue sending email without attachment rather than failing completely
      }
    }

    console.log(
      `Sending email to ${userEmail} with ${attachments.length} attachment(s)`
    );

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Liyana Finance <noreply@liyanafinance.co.za>",
      to: [userEmail],
      subject: emailSubject,
      attachments: attachments.length > 0 ? attachments : undefined,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <!-- Header -->
          <div style="background-color: #000000; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Liyana Finance</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">Your Financial Partner</p>
          </div>

          <!-- Content -->
          <div style="padding: 30px; background-color: #ffffff;">
            <h2 style="color: #333333; margin-bottom: 20px;">Hello ${userName},</h2>
            
            <p style="color: #666666; margin-bottom: 15px;">
              We hope this message finds you well. We're writing to provide you with an update regarding your loan application.
            </p>

            <!-- Application Details -->
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333333; margin: 0 0 10px 0; font-size: 16px;">Application Details:</h3>
              <p style="margin: 5px 0; color: #666666;"><strong>Application ID:</strong> #${applicationId}</p>
              <p style="margin: 5px 0; color: #666666;"><strong>Loan Amount:</strong> R${application.application_amount?.toLocaleString() || "N/A"}</p>
              <p style="margin: 5px 0; color: #666666;"><strong>Status:</strong> ${application.status?.replace("_", " ").toUpperCase() || "N/A"}</p>
            </div>

            <!-- Message -->
            <div style="background-color: #ffffff; border-left: 4px solid #000000; padding: 20px; margin: 20px 0;">
              <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 16px;">Message from Liyana Finance:</h3>
              <div style="color: #333333; white-space: pre-line;">${message}</div>
            </div>

            <p style="color: #666666; margin-top: 30px;">
              If you have any questions or need further assistance, please don't hesitate to contact us. We're here to help you every step of the way.
            </p>

            <!-- Call to Action -->
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #666666; margin-bottom: 15px;">View your application status online:</p>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://apply.liyanafinance.co.za"}/profile" 
                 style="background-color: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View Application
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="margin: 0; font-size: 14px; color: #666666;">Best regards,<br><strong>The Liyana Finance Team</strong></p>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #999999;">
              This is an automated message. Please do not reply directly to this email.
            </p>
          </div>

          <!-- Bottom Footer -->
          <div style="background-color: #000000; color: #d1d5db; padding: 20px; text-align: center; font-size: 14px;">
            <p style="margin: 0;">Thank you for choosing Liyana Finance</p>
            <p style="margin: 5px 0 0 0;">Your trusted financial partner</p>
          </div>
        </div>
      `,
    });

    if (emailError) {
      console.error("Failed to send email:", emailError);
      return NextResponse.json(
        { error: "Failed to send email", details: emailError.message },
        { status: 500 }
      );
    }

    console.log("Email sent successfully:", emailData);

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      emailId: emailData?.id,
      recipient: userEmail,
      applicationId: applicationId,
    });
  } catch (error) {
    console.error("Application email API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
