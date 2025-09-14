'use server';

import { revalidatePath } from 'next/cache';
import {createClaimSchema} from '../schemas'
import { createClient } from '../server';
import { getCurrentUser } from "../queries";
import { sendSms } from './sms';
import { Resend } from "resend";

export const createClaimAction = async (prevState:unknown, formData:FormData) => {

    const supabase = await createClient();

    // check if user is an admin, if not return an error
    const { data: isAdmin, error: userError } = await supabase.rpc('is_admin');
    if (userError || !isAdmin) {
        return {
            success: false,
            errors: { message: "User not authenticated" },
        };
    }

    // Extract and convert form data
    const rawData = {
        policy_id: parseInt(formData.get("policy_id") as string),
        claimant_party_id: formData.get("claimant_party_id") as string,
        claim_number: formData.get("claim_number") as string,
        status: formData.get("status") as string,
        date_filed: new Date(formData.get("date_filed") as string),
        date_of_incident: new Date(formData.get("date_of_incident") as string),
    };

    console.log("Raw data before validation:", rawData);

    const result = createClaimSchema.safeParse(rawData);

    if (!result.success) {
        console.log("Validation errors:", result.error.format());
        // Handle validation errors
        return {
            success: false,
            errors: result.error.format(),
        };
    }

    const claimData = result.data;

    const { error: insertError } = await supabase
        .from('claims')
        .insert({
            policy_id: claimData.policy_id,
            claimant_party_id: claimData.claimant_party_id,
            claim_number: claimData.claim_number,
            status: claimData.status,
            date_filed: claimData.date_filed.toISOString(),
            date_of_incident: claimData.date_of_incident.toISOString(),
        }).select('id');

    if (insertError) {
        console.error(insertError);
        return {
            success: false,
            errors: { message: "Failed to create claim" },
        };
    }

    revalidatePath(`/dashboard/insurance/${claimData.policy_id}`, 'layout');

    sendSms("+27817551279", `New claim filed: ${claimData.claim_number} for policy https://apply.liyanafinance.co.za/dashboard/insurance/${claimData.policy_id}`);

    return {
        success: true,
        data: claimData,
    };
}

export async function sendClaimDetailsEmail(
  claimId: number,
  attachments?: Array<{
    filename: string;
    content: string; // Changed from 'data' to 'content' for Resend compatibility
    content_type?: string;
  }>,
  customSubject?: string
) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return {
        error: true,
        message: "You must be logged in to send claim details.",
      };
    }

    // Check if user has admin or editor role for document attachments
    const { data: userProfile, error: userProfileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userProfileError || !userProfile) {
      return {
        error: true,
        message: "User profile not found.",
        details: userProfileError?.message,
      };
    }

    if (attachments && attachments.length > 0 && userProfile.role !== "admin" && userProfile.role !== "editor") {
      return {
        error: true,
        message: "Only admin or editor users can send emails with attachments.",
      };
    }

    // Fetch the claim with policy and claimant details
    const { data: claim, error: claimError } = await supabase
      .from("claims")
      .select(`
        *,
        policy:policy_id(
          *,
          policy_holder:policy_holder_id(*)
        ),
        claimant:claimant_party_id(*)
      `)
      .eq("id", claimId)
      .single();

    if (claimError || !claim) {
      return {
        error: true,
        message: "Claim not found.",
        details: claimError?.message,
      };
    }

    // Fetch claim payouts with beneficiary details
    const { data: payouts, error: payoutsError } = await supabase
      .from("claim_payouts")
      .select(`
        *,
        beneficiary:beneficiary_party_id(*)
      `)
      .eq("claim_id", claimId);

    if (payoutsError) {
      console.error("Error fetching payouts:", payoutsError);
    }

    // Calculate total claim amount from payouts (since it's not stored directly)
    const totalPayoutAmount = payouts?.reduce((sum, payout) => sum + (payout.amount || 0), 0) || 0;

    // Get LINAR email address from environment
    const linarEmailAddress = process.env.LINAR_EMAIL_ADDRESS;
    if (!linarEmailAddress) {
      return {
        error: true,
        message: "LINAR email address not configured.",
      };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const policyUserId = claim.policy.user_id;

    // Format names
    const policyHolderName = `${claim.policy?.policy_holder?.first_name || ''} ${claim.policy?.policy_holder?.last_name || ''}`.trim();
    const claimantName = `${claim.claimant?.first_name || ''} ${claim.claimant?.last_name || ''}`.trim();
    
    // Format amounts
    const coverageAmount = claim.policy?.coverage_amount 
      ? new Intl.NumberFormat('en-ZA', {
          style: 'currency',
          currency: 'ZAR',
        }).format(claim.policy.coverage_amount)
      : 'N/A';

    // Format amounts (since claim doesn't have direct amount fields, use total payouts)
    const claimAmount = totalPayoutAmount > 0
      ? new Intl.NumberFormat('en-ZA', {
          style: 'currency',
          currency: 'ZAR',
        }).format(totalPayoutAmount)
      : 'Not calculated yet';

    // For this implementation, approved amount is the same as total payouts
    const approvedAmount = totalPayoutAmount > 0
      ? new Intl.NumberFormat('en-ZA', {
          style: 'currency',
          currency: 'ZAR',
        }).format(totalPayoutAmount)
      : 'Not approved yet';

    // Safely extract contact details
    const claimantContactDetails = claim.claimant?.contact_details as { phone?: string; email?: string } | null;
    const claimantPhone = claimantContactDetails?.phone || 'N/A';
    const claimantEmail = claimantContactDetails?.email || 'N/A';

    const policyHolderContactDetails = claim.policy?.policy_holder?.contact_details as { phone?: string; email?: string } | null;
    const policyHolderPhone = policyHolderContactDetails?.phone || 'N/A';
    const policyHolderEmail = policyHolderContactDetails?.email || 'N/A';

    // Format payouts list
    const payoutsList = payouts && payouts.length > 0
      ? payouts.map((payout, index) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${payout.beneficiary?.first_name || ''} ${payout.beneficiary?.last_name || ''}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(payout.amount || 0)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${new Date(payout.payout_date).toLocaleDateString()}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="4" style="padding: 8px; text-align: center; color: #6b7280;">No payouts processed yet</td></tr>';

    // Create email HTML content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #374151;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #000000 0%, #000000 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Insurance Claim Details</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Claim #${claim.claim_number}</p>
        </div>

        <!-- Claim Summary -->
        <div style="background: #ffffff; padding: 30px; ">
          <h2 style="margin: 0 0 20px 0;  font-size: 20px;">Claim Summary</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
            <div>
              <p style="margin: 0; font-weight: bold; color: #374151;">Covered Amount:</p>
              <p style="margin: 5px 0 15px 0; font-size: 18px;  font-weight: bold;">${coverageAmount}</p>
            </div>
         
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
            <div>
              <p style="margin: 0; font-weight: bold; color: #374151;">Claim Status:</p>
              <p style="margin: 5px 0 15px 0; text-transform: capitalize; font-weight: 500;">${claim.status || 'Pending'}</p>
            </div>
            <div>
              <p style="margin: 0; font-weight: bold; color: #374151;">Date Filed:</p>
              <p style="margin: 5px 0 15px 0; font-weight: 500;">${new Date(claim.date_filed).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <!-- Policy Information -->
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="margin: 0 0 20px 0; color: #374151; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Related Policy Information</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Policy ID:</p>
              <p style="margin: 5px 0 15px 0; color: #374151;">#${claim.policy_id}</p>
            </div>
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Policy Holder:</p>
              <p style="margin: 5px 0 15px 0; color: #374151;">${policyHolderName || 'N/A'}</p>
            </div>
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Coverage Amount:</p>
              <p style="margin: 5px 0 15px 0; color: #374151;">${coverageAmount}</p>
            </div>
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Policy Status:</p>
              <p style="margin: 5px 0 15px 0; color: #374151; text-transform: capitalize;">${claim.policy?.policy_status || 'N/A'}</p>
            </div>
          </div>
        </div>

        <!-- Claimant Information -->
        <div style="padding: 30px; background: white;">
          <h2 style="margin: 0 0 20px 0; color: #374151; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Claimant Information</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Full Name:</p>
              <p style="margin: 5px 0 15px 0; color: #374151;">${claimantName || 'N/A'}</p>
            </div>
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Date of Birth:</p>
              <p style="margin: 5px 0 15px 0; color: #374151;">${claim.claimant?.date_of_birth || 'N/A'}</p>
            </div>
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Phone Number:</p>
              <p style="margin: 5px 0 15px 0; color: #374151;">${claimantPhone}</p>
            </div>
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Email Address:</p>
              <p style="margin: 5px 0 15px 0; color: #374151;">${claimantEmail}</p>
            </div>
          </div>
        </div>

        <!-- Claim Details -->
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="margin: 0 0 20px 0; color: #374151; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Claim Details</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Date of Incident:</p>
              <p style="margin: 5px 0 15px 0; color: #374151;">${new Date(claim.date_of_incident).toLocaleDateString()}</p>
            </div>
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Date Filed:</p>
              <p style="margin: 5px 0 15px 0; color: #374151;">${new Date(claim.date_filed).toLocaleDateString()}</p>
            </div>
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Date Submitted:</p>
              <p style="margin: 5px 0 15px 0; color: #374151;">${new Date(claim.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Claim ID:</p>
              <p style="margin: 5px 0 15px 0; color: #374151;">#${claim.id}</p>
            </div>
          </div>
        </div>

        <!-- Payouts Section -->
        <div style="padding: 30px; background: white;">
          <h2 style="margin: 0 0 20px 0; color: #374151; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Claim Payouts</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: bold; color: #374151;">#</th>
                <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: bold; color: #374151;">Covered Person</th>
                <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: bold; color: #374151;">Amount</th>
                <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: bold; color: #374151;">Payout Date</th>
              </tr>
            </thead>
            <tbody>
              ${payoutsList}
            </tbody>
          </table>
        </div>

        <!-- Policy Holder Contact Info -->
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="margin: 0 0 20px 0; color: #374151; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Policy Holder Contact Information</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Phone Number:</p>
              <p style="margin: 5px 0 15px 0; color: #374151;">${policyHolderPhone}</p>
            </div>
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Email Address:</p>
              <p style="margin: 5px 0 15px 0; color: #374151;">${policyHolderEmail}</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #374151; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
          <p style="margin: 0; font-size: 14px; opacity: 0.8;">
            This email was generated automatically by Liyana Finance.
          </p>
          <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.6;">
            Generated on ${new Date().toLocaleString()}
          </p>
        </div>
      </div>
    `;

    // Send email
    const { data, error } = await resend.emails.send({
      from: 'Liyana Finance <noreply@liyanafinance.co.za>',
      to: [linarEmailAddress],
      subject: customSubject || `Insurance Claim Details - Claim #${claim.claim_number}`,
      html: emailHtml,
      attachments,
    });

    if (error || !data) {
      console.error('Email sending error:', error);
      return {
        error: true,
        message: 'Failed to send email',
        details: error?.message || 'No data returned',
      };
    }

    // Email sent successfully save to the resend_emails table
    const { error: logError } = await supabase.from('resend_emails').insert({
      resend_id: data.id,
      profile_id: policyUserId,
      policy_id: claim.policy_id,
    });

    console.log("Email sent successfully:", data, logError);

    return {
      error: false,
      message: 'Claim details sent successfully!',
      data,
    };

  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      error: true,
      message: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}