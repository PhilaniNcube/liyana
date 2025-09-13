import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/server";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const requestSchema = z.object({
  profile_id: z.string().uuid("Profile ID must be a valid UUID"),
  message: z.string().min(1, "Message is required"),
  subject: z.string().min(1, "Subject is required"),
  attachments: z.array(z.object({
    filename: z.string(),
    data: z.string(), // Base64 string
  })).optional(),
  recipientEmail: z.string().email("Valid recipient email is required"),
  recipientName: z.string().min(1, "Recipient name is required"),
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

    const { profile_id, message, subject, attachments = [], recipientEmail, recipientName } = result.data;

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

    // Verify the profile_id exists
    const { data: targetProfile, error: targetProfileError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", profile_id)
      .single();

    if (targetProfileError || !targetProfile) {
      return NextResponse.json(
        { error: "Target profile not found" },
        { status: 404 }
      );
    }

    // Process attachments
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
                         attachment.filename.endsWith('.png') ? 'image/png' :
                         attachment.filename.endsWith('.jpg') || attachment.filename.endsWith('.jpeg') ? 'image/jpeg' :
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
      to: [recipientEmail],
      subject: subject,
      attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
      html: getEmailTemplate(recipientName, message),
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
    const emailRecord = {
      resend_id: emailData.id,
      profile_id: profile_id,
    };

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
      recipient: recipientEmail,
      profile_id: profile_id,
    });

  } catch (error) {
    console.error("User email API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function getEmailTemplate(recipientName: string, message: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 30px;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Liyana Finance</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Communication Update</p>
      </div>

      <!-- Content -->
      <div style="padding: 40px 30px; background: #ffffff;">
        <h2 style="color: #333; margin-bottom: 20px;">Hello ${recipientName},</h2>
        
        <div style="background: #f8fafc; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          ${message.replace(/\n/g, '<br>')}
        </div>

        <p style="color: #666; margin-top: 30px;">
          If you have any questions or need assistance, please don't hesitate to contact our support team.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://apply.liyanafinance.co.za" 
             style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            Visit Our Portal
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #f8fafc; text-align: center; padding: 30px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #666; font-size: 14px;">
          <strong>Liyana Finance</strong><br>
          Your trusted financial partner<br>
          <a href="mailto:info@liyanafinance.co.za" style="color: #667eea;">info@liyanafinance.co.za</a>
        </p>
      </div>
    </div>
  `;
}
