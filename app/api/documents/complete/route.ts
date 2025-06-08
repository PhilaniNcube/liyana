import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { applicationId } = await request.json();

    if (!applicationId) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Get the application details
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .eq("user_id", user.id)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Verify all documents are uploaded
    const { data: documents, error: docsError } = await supabase
      .from("documents")
      .select("*")
      .eq("application_id", applicationId);

    if (docsError) {
      return NextResponse.json(
        { error: "Failed to check documents" },
        { status: 500 }
      );
    }

    // Check if all required document types are present
    const requiredDocTypes = [
      "id",
      "bank_statement",
      "payslip",
      "proof_of_residence",
    ] as const;
    const uploadedDocTypes = documents.map((doc) => doc.document_type);
    const allDocumentsUploaded = requiredDocTypes.every((type) =>
      uploadedDocTypes.includes(type)
    );

    if (!allDocumentsUploaded) {
      return NextResponse.json(
        { error: "Not all required documents are uploaded" },
        { status: 400 }
      );
    }

    // Update application status to under_review
    const { error: updateError } = await supabase
      .from("applications")
      .update({
        status: "in_review",
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (updateError) {
      console.error("Failed to update application status:", updateError);
    }

    // Send email notification
    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: "Liyana Loans <noreply@liyana.co.za>",
        to: [user.email!],
        subject: "Documents Uploaded Successfully - Application Under Review",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #10b981; color: white; padding: 20px; text-align: center;">
              <img src="https://${
                process.env.VERCEL_URL
              }/logo.webp" alt="Liyana Loans" style="height: 40px; margin-bottom: 15px;" />
              <h1 style="margin: 0;">Documents Uploaded Successfully!</h1>
            </div>
            
            <div style="padding: 20px; background-color: #f9fafb;">
              <h2 style="color: #374151;">Dear ${
                user.user_metadata?.full_name || "Valued Customer"
              },</h2>
              
              <p style="color: #6b7280; line-height: 1.6;">
                We're pleased to confirm that all required documents for your loan application have been successfully uploaded.
              </p>
              
              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <h3 style="margin-top: 0; color: #059669;">Application Details:</h3>
                <ul style="color: #6b7280;">
                  <li><strong>Application ID:</strong> ${applicationId}</li>
                  <li><strong>Loan Amount:</strong> R${application.application_amount?.toLocaleString()}</li>
                  <li><strong>Status:</strong> Under Review</li>
                  <li><strong>Documents Uploaded:</strong> ${new Date().toLocaleDateString()}</li>
                </ul>
              </div>
              
              <h3 style="color: #374151;">What happens next?</h3>
              <ol style="color: #6b7280; line-height: 1.8;">
                <li>Our team will review your application and documents</li>
                <li>We may contact you if additional information is required</li>
                <li>You'll receive an email notification once the review is complete</li>
                <li>If approved, loan terms will be presented for your acceptance</li>
              </ol>
              
              <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #1e40af;">
                  <strong>Review Timeline:</strong> We typically complete our review within 24-48 hours during business days.
                </p>
              </div>
              
              <p style="color: #6b7280;">
                If you have any questions about your application, please don't hesitate to contact our support team.
              </p>
                <div style="text-align: center; margin: 30px 0;">
                <a href="https://${process.env.VERCEL_URL}/profile" 
                   style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View Application Status
                </a>
              </div>
            </div>
            
            <div style="background-color: #374151; color: #d1d5db; padding: 20px; text-align: center; font-size: 14px;">
              <p style="margin: 0;">Thank you for choosing Liyana Loans</p>
              <p style="margin: 5px 0 0 0;">This is an automated message, please do not reply.</p>
            </div>
          </div>
        `,
      });

      if (emailError) {
        console.error("Failed to send email:", emailError);
        // Don't fail the request if email sending fails
      }
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      // Don't fail the request if email sending fails
    }

    return NextResponse.json({
      success: true,
      message: "Documents upload completed and application updated",
    });
  } catch (error) {
    console.error("Documents completion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
