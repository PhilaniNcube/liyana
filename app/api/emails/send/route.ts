import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/server";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const requestSchema = z.object({
  itemId: z.number().min(1, "Item ID must be a positive number"),
  itemType: z.enum(["application", "loan", "policy"]),
  message: z.string().min(1, "Message is required"),
  subject: z.string().min(1, "Subject is required"),
  attachments: z.array(z.object({
    filename: z.string(),
    data: z.string(), // Base64 string
  })).optional(),
  recipientEmail: z.string().email().optional(),
  recipientName: z.string().optional(),
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

    const { itemId, itemType, message, subject, attachments = [], recipientEmail, recipientName } = result.data;

    const supabase = await createClient();

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

    let userEmail: string;
    let userName: string;
    let profileId: string;

    // Fetch data based on item type
    if (itemType === "application") {
      // Fetch application details
      const { data: application, error: appError } = await supabase
        .from("applications")
        .select("*")
        .eq("id", itemId)
        .single();

      if (appError || !application) {
        return NextResponse.json(
          { error: "Application not found" },
          { status: 404 }
        );
      }

      // Fetch user profile
      const { data: applicantProfile, error: applicantProfileError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("id", application.user_id)
        .single();

      if (applicantProfileError || !applicantProfile) {
        return NextResponse.json(
          { error: "Applicant profile not found" },
          { status: 404 }
        );
      }

      // Get user email from auth user
      const { data: applicationUser, error: authUserError } = await supabase.auth.admin.getUserById(application.user_id);

      if (authUserError || !applicationUser?.user?.email) {
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
        userName = applicantProfile?.full_name || applicationUser.user.user_metadata?.full_name || "Valued Customer";
      }

      profileId = applicantProfile.id;

    } else if (itemType === "loan") {
      // Fetch loan details
      const { data: loan, error: loanError } = await supabase
        .from("approved_loans")
        .select("*, applications(*)")
        .eq("id", itemId)
        .single();

      if (loanError || !loan) {
        return NextResponse.json(
          { error: "Loan not found" },
          { status: 404 }
        );
      }

      if (!loan.profile_id) {
        return NextResponse.json(
          { error: "No profile associated with this loan" },
          { status: 404 }
        );
      }

      // Fetch user profile
      const { data: borrowerProfile, error: borrowerProfileError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("id", loan.profile_id)
        .single();

      if (borrowerProfileError || !borrowerProfile) {
        return NextResponse.json(
          { error: "Borrower profile not found" },
          { status: 404 }
        );
      }

      // Get user email from auth user
      const { data: loanUser, error: authUserError } = await supabase.auth.admin.getUserById(loan.profile_id);

      if (authUserError || !loanUser?.user?.email) {
        if (!borrowerProfile?.email) {
          return NextResponse.json(
            { error: "User email not found for this loan" },
            { status: 404 }
          );
        }
        userEmail = borrowerProfile.email;
        userName = borrowerProfile?.full_name || "Valued Customer";
      } else {
        userEmail = loanUser.user.email;
        userName = borrowerProfile?.full_name || loanUser.user.user_metadata?.full_name || "Valued Customer";
      }

      profileId = borrowerProfile.id;

    } else if (itemType === "policy") {
      // Fetch policy details
      const { data: policy, error: policyError } = await supabase
        .from("policies")
        .select("*")
        .eq("id", itemId)
        .single();

      if (policyError || !policy) {
        return NextResponse.json(
          { error: "Policy not found" },
          { status: 404 }
        );
      }

      if (!policy.user_id) {
        return NextResponse.json(
          { error: "No user associated with this policy" },
          { status: 404 }
        );
      }

      // Fetch user profile
      const { data: policyHolderProfile, error: policyHolderProfileError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("id", policy.user_id)
        .single();

      if (policyHolderProfileError || !policyHolderProfile) {
        return NextResponse.json(
          { error: "Policy holder profile not found" },
          { status: 404 }
        );
      }

      // Get user email from auth user
      const { data: policyUser, error: authUserError } = await supabase.auth.admin.getUserById(policy.user_id);

      if (authUserError || !policyUser?.user?.email) {
        if (!policyHolderProfile?.email) {
          return NextResponse.json(
            { error: "User email not found for this policy" },
            { status: 404 }
          );
        }
        userEmail = policyHolderProfile.email;
        userName = policyHolderProfile?.full_name || "Valued Customer";
      } else {
        userEmail = policyUser.user.email;
        userName = policyHolderProfile?.full_name || policyUser.user.user_metadata?.full_name || "Valued Customer";
      }

      profileId = policyHolderProfile.id;

    } else {
      return NextResponse.json(
        { error: "Invalid item type" },
        { status: 400 }
      );
    }

    // Use provided email/name if available, otherwise use fetched data
    const finalEmail = recipientEmail || userEmail;
    const finalName = recipientName || userName;

    // Handle attachments
    const emailAttachments: Array<{
      filename: string;
      content: Buffer | string;
      content_type?: string;
    }> = [];

    if (attachments && attachments.length > 0) {
      attachments.forEach((attachment) => {
        try {
          emailAttachments.push({
            filename: attachment.filename,
            content: attachment.data, // Base64 encoded content
            content_type: attachment.filename.endsWith('.pdf') ? 'application/pdf' : 
                         attachment.filename.endsWith('.zip') ? 'application/zip' : 
                         'application/octet-stream',
          });
        } catch (attachmentError) {
          console.error("Failed to process attachment:", attachmentError);
        }
      });
    }

    // Send email using Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Liyana Finance <noreply@liyanafinance.co.za>",
      to: [finalEmail],
      subject: subject,
      attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
      html: getEmailTemplate(itemType, itemId, finalName, message),
    });

    if (emailError) {
      console.error("Failed to send email:", emailError);
      return NextResponse.json(
        { error: "Failed to send email", details: emailError.message },
        { status: 500 }
      );
    }

    if (!emailData || !emailData.id) {
      return NextResponse.json(
        { error: "Email sent but no ID returned" },
        { status: 500 }
      );
    }

    // Save email record to resend_emails table
    const emailRecord: any = {
      resend_id: emailData.id,
      profile_id: profileId,
    };

    // Set the appropriate foreign key based on item type
    if (itemType === "application") {
      emailRecord.application_id = itemId;
    } else if (itemType === "loan") {
      emailRecord.loan_id = itemId;
    } else if (itemType === "policy") {
      emailRecord.policy_id = itemId;
    }

    const { error: saveError } = await supabase
      .from("resend_emails")
      .insert(emailRecord);

    if (saveError) {
      console.error("Failed to save email record:", saveError);
      // Don't fail the request if we can't save the record
    }

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      emailId: emailData.id,
      recipient: finalEmail,
      itemId: itemId,
      itemType: itemType,
    });

  } catch (error) {
    console.error("Email API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function getEmailTemplate(itemType: string, itemId: number, userName: string, message: string): string {
  const itemName = itemType === "application" ? "Application" : 
                   itemType === "loan" ? "Loan" : "Policy";
  
  const itemColor = itemType === "application" ? "#3b82f6" : 
                    itemType === "loan" ? "#10b981" : "#8b5cf6";

  return `
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
          We hope this message finds you well. We're writing to provide you with an update regarding your ${itemType}.
        </p>

        <!-- Item Details -->
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333333; margin: 0 0 10px 0; font-size: 16px;">${itemName} Details:</h3>
          <p style="margin: 5px 0; color: #666666;"><strong>${itemName} ID:</strong> #${itemId}</p>
        </div>

        <!-- Message -->
        <div style="background-color: #ffffff; border-left: 4px solid ${itemColor}; padding: 20px; margin: 20px 0;">
          <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 16px;">Message from Liyana Finance:</h3>
          <div style="color: #333333; white-space: pre-line;">${message}</div>
        </div>

        <p style="color: #666666; margin-top: 30px;">
          If you have any questions or need further assistance, please don't hesitate to contact us. We're here to help you every step of the way.
        </p>

        <!-- Call to Action -->
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #666666; margin-bottom: 15px;">Manage your ${itemType} online:</p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://apply.liyanafinance.co.za"}/profile" 
             style="background-color: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            View ${itemName}
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
  `;
}
