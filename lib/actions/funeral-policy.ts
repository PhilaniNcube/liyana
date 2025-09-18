"use server";


import { revalidatePath } from "next/cache";
import { createClient } from "../server";
import { getCurrentUser } from "../queries";
import { funeralPolicyLeadSchemaWithRefines as funeralPolicyLeadSchema, policyUpdateSchema, updatePolicyStatusSchema } from "../schemas";
import { encryptValue, decryptValue } from "../encryption";
import { sendSms } from "./sms";
import { Resend } from "resend";
import FuneralCoverCalculator, { type ICalculationParams, type IAdditionalFamilyMember } from "../utils/funeralcover-calculator";
import { FUNERAL_RATE_DATA } from "../data/funeral-rates";
import { calculateAgeFromSAID } from "../utils/sa-id";
import { requireAdminAuth } from "../utils/admin-auth";
import type { Database } from "@/lib/types";

export async function createFuneralPolicy(prevState: any, formData: FormData) {
  // Parse FormData entries
  const entries = Object.fromEntries(formData.entries());

  // Coerce checkbox values from strings to booleans (lead flow only)
  const parsed: any = {
    ...entries,
    terms_and_conditions:
      (entries as any).terms_and_conditions === "true" ||
      (entries as any).terms_and_conditions === true,
    privacy_policy:
      (entries as any).privacy_policy === "true" ||
      (entries as any).privacy_policy === true,
  };
  
  // Pass through product_type string for zod enum validation
  if ((entries as any).product_type) parsed.product_type = (entries as any).product_type;

  // For array fields like beneficiaries coming from form-data, attempt JSON parse if string
  if (typeof parsed.beneficiaries === "string") {
    try {
      parsed.beneficiaries = JSON.parse(parsed.beneficiaries as string);
    } catch {
      // leave as is; zod will catch invalid shape
    }
  }

  const validatedFields = funeralPolicyLeadSchema.safeParse(parsed);

  if (!validatedFields.success) {
    console.error("Validation failed:", validatedFields.error);
    return {
      error: true,
      message: "Invalid form data",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return {
      error: true,
      message: "You must be logged in to create a policy.",
    };
  }

  const { data: validatedData } = validatedFields;

  try {
    // Create policy holder party with banking_details (encrypt id_number)
    const { data: party, error: partyError } = await supabase
      .from("parties")
      .insert({
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        id_number: encryptValue(validatedData.id_number),
        date_of_birth: validatedData.date_of_birth,
        contact_details: { phone: validatedData.phone_number, email: validatedData.email },
        address_details:
          validatedData.residential_address || validatedData.city || validatedData.postal_code
            ? {
                physical: validatedData.residential_address ?? null,
                city: validatedData.city ?? null,
                postal_code: validatedData.postal_code ?? null,
              }
            : null,
        banking_details: {
          account_name: validatedData.account_name,
          bank_name: validatedData.bank_name,
          account_number: validatedData.account_number,
          branch_code: validatedData.branch_code,
          account_type: validatedData.account_type,
          payment_method: validatedData.payment_method,
          payment_date: validatedData.payment_date || null,
        },
        party_type: "individual",
        profile_id: user.id,
      })
      .select("id")
      .single();

    if (partyError || !party) {
      return {
        error: true,
        message: "Failed to create policy holder.",
        details: partyError?.message,
      };
    }

    // Calculate premium amount using FuneralCoverCalculator
    let calculatedPremium: number | null = null;
    try {
      // Calculate policy holder's age from date of birth
      const policyHolderAge = validatedData.date_of_birth 
        ? new Date().getFullYear() - new Date(validatedData.date_of_birth).getFullYear()
        : null;

      if (policyHolderAge && validatedData.coverage_amount) {
        // Map beneficiaries to calculator format
        const additionalMembers: IAdditionalFamilyMember[] = [];
        
        if (validatedData.beneficiaries && validatedData.beneficiaries.length > 0) {
          validatedData.beneficiaries.forEach((ben: any) => {
            const relationship = ben.relationship;
            
            // Map relationship types to calculator format
            if (relationship === 'spouse') {
              additionalMembers.push({ relationship: 'spouse' });
            } else if (relationship === 'child') {
              additionalMembers.push({ relationship: 'child' });
            } else if (relationship === 'parent' || relationship === 'sibling' || relationship === 'extended') {
              // Calculate actual age from ID number instead of estimating
              let actualAge: number | null = null;
              
              if (ben.id_number && ben.id_number.length === 13) {
                actualAge = calculateAgeFromSAID(ben.id_number);
              }
              
              // If we can't calculate age from ID, fall back to estimation
              if (actualAge === null) {
                if (relationship === 'parent') {
                  actualAge = (policyHolderAge || 30) + 25; // Estimate parent age
                } else if (relationship === 'sibling') {
                  actualAge = policyHolderAge || 30; // Assume similar age for siblings
                } else { // extended
                  actualAge = policyHolderAge || 40; // Default estimate for extended family
                }
              }
              
              additionalMembers.push({ 
                relationship: 'extended',
                age: actualAge
              });
            }
          });
        }

        // Initialize calculator and calculate premium
        const calculator = new FuneralCoverCalculator(FUNERAL_RATE_DATA);
        const calculationParams: ICalculationParams = {
          mainMemberAge: policyHolderAge,
          coverAmount: validatedData.coverage_amount,
          additionalMembers: additionalMembers
        };

        const result = calculator.calculateTotalPremium(calculationParams);
        calculatedPremium = result.totalPremium;
      }
    } catch (error) {
      console.error("Error calculating premium:", error);
      // Continue with null premium if calculation fails
    }

    // Create a base policy record first
    const { data: newPolicy, error: policyError } = await supabase
      .from("policies")
      .insert({
    
        policy_holder_id: party.id,
        frequency: "monthly",
        policy_status: "pending",
        premium_amount: calculatedPremium,
        coverage_amount: validatedData.coverage_amount,
        product_type: validatedData.product_type || "funeral_policy",
        start_date: validatedData.start_date || null,
        end_date: null,
        user_id: user.id,
        employment_details: {
          employment_type: validatedData.employment_type,
          employer_name: validatedData.employer_name,
          job_title: validatedData.job_title,
          monthly_income: validatedData.monthly_income,
          employer_address: validatedData.employer_address || null,
          employer_contact_number: validatedData.employer_contact_number || null,
          employment_end_date: validatedData.employment_end_date || null,
        },
      })
      .select("id")
      .single();

    if (policyError || !newPolicy) {
      return {
        error: true,
        message: "Failed to create policy record.",
        details: policyError?.message,
        partyId: party.id,
      };
    }

    // Create beneficiary parties and link in policy_beneficiaries
    // We will create minimal party rows for beneficiaries and then insert policy_beneficiaries with allocation_percentage and relation_type
    const beneficiaryInserts = validatedData.beneficiaries.map((b: any) => ({
      first_name: b.first_name,
      last_name: b.last_name,
      id_number: encryptValue(b.id_number),
      date_of_birth: null,
      contact_details: b.phone_number || b.email ? { phone: b.phone_number ?? null, email: b.email ?? null } : null,
      address_details: null,
      party_type: "individual" as const,
      profile_id: user.id,
    }));

    // Bulk insert beneficiary parties, returning ids in order
    const { data: beneficiaryParties, error: benPartyError } = await supabase
      .from("parties")
      .insert(beneficiaryInserts)
      .select("*");

    if (benPartyError || !beneficiaryParties || beneficiaryParties.length !== validatedData.beneficiaries.length) {
      return {
        error: true,
        message: "Failed to create beneficiary records.",
        details: benPartyError?.message,
        partyId: party.id,
        policyId: newPolicy.id,
      };
    }

    // Prepare policy_beneficiaries rows
    const policyBeneficiariesRows = validatedData.beneficiaries.map((b: any, idx: number) => ({
      policy_id: newPolicy.id,
      beneficiary_party_id: beneficiaryParties[idx].id,
      allocation_percentage: 0,
      relation_type: b.relationship,
    }));

    const { error: pbError } = await supabase
      .from("policy_beneficiaries")
      .insert(policyBeneficiariesRows);

    if (pbError) {
      console.error("Error linking beneficiaries to policy:", pbError);
      return {
        error: true,
        message: "Failed to link beneficiaries to the policy.",
        details: pbError.message,
        partyId: party.id,
        policyId: newPolicy.id,
      };
    }

    // Handle pending documents if provided
    if ((entries as any).pending_documents) {
      try {
        const pendingDocuments = JSON.parse((entries as any).pending_documents as string);
        
        if (Array.isArray(pendingDocuments) && pendingDocuments.length > 0) {
          const documentInserts = pendingDocuments.map((doc: any) => ({
            policy_id: newPolicy.id,
            document_type: doc.document_type,
            path: doc.file_path,
            user_id: user.id,
          }));

          const { error: docError } = await supabase
            .from("policy_documents")
            .insert(documentInserts);

          if (docError) {
            console.error("Error saving policy documents:", docError);
            // Don't fail the entire process for document errors, just log them
          }
        }
      } catch (parseError) {
        console.error("Error parsing pending documents:", parseError);
        // Don't fail the entire process for document parsing errors
      }
    }

    // Policy creation and linking completed successfully
    revalidatePath("/insurance/funeral");

    sendSms(`${process.env.SMS_NUMBER}`, `New funeral policy lead: Policy ID ${newPolicy.id} for ${validatedData.first_name} ${validatedData.last_name}. Review at https://apply.liyanafinance.co.za/dashboard/insurance/${newPolicy.id}`);

    return {
      error: false,
      message: "Application submitted. We'll follow up to complete policy details.",
      partyId: party.id,
    };
  } catch (error) {
    console.error("Error creating funeral policy:", error);
    return {
      error: true,
      message: "An unexpected error occurred while creating the policy.",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updatePolicy(prevState: any, formData: FormData) {
  // Parse FormData entries
  const entries = Object.fromEntries(formData.entries());

  // Convert string values to appropriate types
  const parsed: any = {
    ...entries,
    policy_id: parseInt(entries.policy_id as string),
    coverage_amount: parseFloat(entries.coverage_amount as string),
  };

  // Only include premium_amount if it was provided
  if (entries.premium_amount) {
    parsed.premium_amount = parseFloat(entries.premium_amount as string);
  }

  const validatedFields = policyUpdateSchema.safeParse(parsed);

  if (!validatedFields.success) {
    console.error("Validation failed:", validatedFields.error);
    return {
      error: true,
      message: "Invalid form data",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return {
      error: true,
      message: "You must be logged in to update a policy.",
    };
  }

  const { data: validatedData } = validatedFields;

  try {
    // First, verify that the policy exists and belongs to the user or is accessible
    const { data: existingPolicy, error: fetchError } = await supabase
      .from("policies")
      .select("id, policy_holder_id, policy_status")
      .eq("id", validatedData.policy_id)
      .single();

    if (fetchError || !existingPolicy) {
      return {
        error: true,
        message: "Policy not found or access denied.",
        details: fetchError?.message,
      };
    }

    // Prepare update object with only the fields that were provided
    const updateData: any = {
      coverage_amount: validatedData.coverage_amount,
    };

    // Only include optional fields if they were provided
    if (validatedData.premium_amount !== undefined) {
      updateData.premium_amount = validatedData.premium_amount;
    }
    if (validatedData.policy_status) {
      updateData.policy_status = validatedData.policy_status;
    }
    if (validatedData.start_date) {
      updateData.start_date = validatedData.start_date;
    }
    if (validatedData.end_date) {
      updateData.end_date = validatedData.end_date;
    }
    if (validatedData.frequency) {
      updateData.frequency = validatedData.frequency;
    }

    // Update the policy
    const { data: updatedPolicy, error: updateError } = await supabase
      .from("policies")
      .update(updateData)
      .eq("id", validatedData.policy_id)
      .select("id, coverage_amount, premium_amount, policy_status")
      .single();

    if (updateError || !updatedPolicy) {
      return {
        error: true,
        message: "Failed to update policy.",
        details: updateError?.message,
      };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard/insurance");
    revalidatePath(`/dashboard/insurance/${validatedData.policy_id}`);

    return {
      error: false,
      message: "Policy updated successfully.",
      data: updatedPolicy,
    };
  } catch (error) {
    console.error("Error updating policy:", error);
    return {
      error: true,
      message: "An unexpected error occurred while updating the policy.",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendFuneralPolicyDetailsEmail(
  policyId: number,
  attachments?: Array<{
    filename: string;
    content: string; // Changed from 'data' to 'content' for Resend compatibility
    content_type?: string;
  }>
) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return {
        error: true,
        message: "You must be logged in to send policy details.",
      };
    }

    // Check if user has admin or editor role for document attachments
    if (attachments && attachments.length > 0) {
      const authResult = await requireAdminAuth(true); // Allow editor for attachments
      if (!authResult.success) {
        return {
          error: true,
          message: "Only admin or editor users can send emails with attachments.",
          details: authResult.details,
        };
      }
    }

    // Fetch the policy with policy holder details
    const { data: policy, error: policyError } = await supabase
      .from("policies")
      .select(`
        *,
        policy_holder:policy_holder_id(*)
      `)
      .eq("id", policyId)
      .eq("product_type", "funeral_policy")
      .single();

    if (policyError || !policy) {
      return {
        error: true,
        message: "Funeral policy not found.",
        details: policyError?.message,
      };
    }

    // Fetch policy beneficiaries
    const { data: beneficiaries, error: beneficiariesError } = await supabase
      .from("policy_beneficiaries")
      .select(`
        *,
        beneficiary:beneficiary_party_id(*)
      `)
      .eq("policy_id", policyId);

    if (beneficiariesError) {
      console.error("Error fetching beneficiaries:", beneficiariesError);
    }

    // Get LINAR email address from environment
    const linarEmailAddress = process.env.LINAR_EMAIL_ADDRESS;
    if (!linarEmailAddress) {
      return {
        error: true,
        message: "LINAR email address not configured.",
      };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Format policy holder name
    const policyHolderName = `${policy.policy_holder?.first_name || ''} ${policy.policy_holder?.last_name || ''}`.trim();
    
    // Format coverage amount
    const coverageAmount = new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(policy.coverage_amount || 0);

    // Calculate premium amount if not already saved in database
    let calculatedPremium: number | null = null;
    let premiumCalculationError: string | null = null;
    let policyHolderAge: number | null = null;
    let additionalMembersCount = 0;
    
    if (!policy.premium_amount) {
      try {
        // Calculate policy holder's age from date of birth
        policyHolderAge = policy.policy_holder?.date_of_birth 
          ? new Date().getFullYear() - new Date(policy.policy_holder.date_of_birth).getFullYear()
          : null;

        if (policyHolderAge && policy.coverage_amount) {
          // Map beneficiaries to calculator format
          const additionalMembers: IAdditionalFamilyMember[] = [];
          
          if (beneficiaries && beneficiaries.length > 0) {
            beneficiaries.forEach((ben) => {
              const relationship = ben.relation_type;
              
              // Map relationship types to calculator format
              if (relationship === 'spouse') {
                additionalMembers.push({ relationship: 'spouse' });
              } else if (relationship === 'child') {
                additionalMembers.push({ relationship: 'child' });
              } else if (relationship === 'parent' || relationship === 'sibling') {
                // Calculate actual age from ID number instead of estimating
                let actualAge: number | null = null;
                
                if (ben.beneficiary?.id_number) {
                  try {
                    const decryptedIdNumber = decryptValue(ben.beneficiary.id_number);
                    if (decryptedIdNumber && decryptedIdNumber.length === 13) {
                      actualAge = calculateAgeFromSAID(decryptedIdNumber);
                    }
                  } catch (error) {
                    console.error("Error decrypting beneficiary ID number:", error);
                  }
                }
                
                // If we can't calculate age from ID, fall back to estimation
                if (actualAge === null) {
                  if (relationship === 'parent') {
                    actualAge = (policyHolderAge || 30) + 25; // Estimate parent age
                  } else { // sibling
                    actualAge = policyHolderAge || 30; // Assume similar age for siblings
                  }
                }
                
                additionalMembers.push({ 
                  relationship: 'extended',
                  age: actualAge
                });
              }
            });
          }

          additionalMembersCount = additionalMembers.length;

          // Initialize calculator and calculate premium
          const calculator = new FuneralCoverCalculator(FUNERAL_RATE_DATA);
          const calculationParams: ICalculationParams = {
            mainMemberAge: policyHolderAge,
            coverAmount: policy.coverage_amount,
            additionalMembers: additionalMembers
          };

          const result = calculator.calculateTotalPremium(calculationParams);
          calculatedPremium = result.totalPremium;
        }
      } catch (error) {
        console.error("Error calculating premium:", error);
        premiumCalculationError = error instanceof Error ? error.message : "Unknown error";
      }
    }

    // Format premium amount - use calculated value if available, otherwise database value
    const finalPremiumAmount = policy.premium_amount || calculatedPremium;
    const premiumAmount = finalPremiumAmount
      ? new Intl.NumberFormat('en-ZA', {
          style: 'currency',
          currency: 'ZAR',
        }).format(finalPremiumAmount)
      : 'Not calculated yet';

    // Add calculation indicator if premium was calculated
    const premiumAmountWithIndicator = calculatedPremium
      ? `${premiumAmount} (calculated)`
      : premiumAmount;

    // Safely extract contact details
    const contactDetails = policy.policy_holder?.contact_details as { phone?: string; email?: string } | null;
    const phoneNumber = contactDetails?.phone || 'N/A';
    const email = contactDetails?.email || 'N/A';

    // Safely extract employment details
    const employmentDetails = policy.employment_details as {
      employment_type?: string;
      employer_name?: string;
      job_title?: string;
      monthly_income?: number;
    } | null;

    // Safely extract banking details
    const bankingDetails = policy.policy_holder?.banking_details as {
      account_name?: string;
      bank_name?: string;
      account_number?: string;
      account_type?: string;
      payment_method?: string;
      payment_date?: string;
    } | null;

    // Format beneficiaries list - include policy holder first, then beneficiaries
    let beneficiariesList = '';
    
    // Add policy holder as first row
    beneficiariesList += `
      <tr style="background: #f3f4f6;">
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">1</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${policyHolderName || 'N/A'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #059669;">Policy Holder</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Self</td>
      </tr>
    `;
    
    // Add beneficiaries
    if (beneficiaries && beneficiaries.length > 0) {
      beneficiariesList += beneficiaries.map((ben, index) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${index + 2}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${ben.beneficiary?.first_name || ''} ${ben.beneficiary?.last_name || ''}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Covered Person</td>
          <td style="text-transform: capitalize; padding: 8px; border-bottom: 1px solid #e5e7eb;">${ben.relation_type || 'N/A'}</td>
        </tr>
      `).join('');
    }
    
    // If no beneficiaries exist (only policy holder), add a note
    if (!beneficiaries || beneficiaries.length === 0) {
      beneficiariesList += '<tr><td colspan="4" style="padding: 8px; text-align: center; color: #6b7280; font-style: italic;">No additional covered persons added yet</td></tr>';
    }

    // Create email HTML content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #374151;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Funeral Cover Policy Details</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Policy ID: #${policyId}</p>
        </div>

        <!-- Policy Summary -->
        <div style="background: #f9fafb; padding: 30px;">
          <h2 style="margin: 0 0 20px 0;  font-size: 20px;">Policy Summary</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <p style="margin: 0; font-weight: bold; color: #374151;">Coverage Amount:</p>
              <p style="margin: 5px 0 15px 0; font-size: 18px;  font-weight: bold;">${coverageAmount}</p>
            </div>
            <div>
              <p style="margin: 0; font-weight: bold; color: #374151;">Monthly Premium:</p>
              <p style="margin: 5px 0 15px 0; font-size: 18px; font-weight: bold;">${premiumAmountWithIndicator}</p>
              ${premiumCalculationError ? `<p style="margin: 0; font-size: 12px; color: #dc2626; font-style: italic;">Calculation error: ${premiumCalculationError}</p>` : ''}
              ${calculatedPremium ? `<p style="margin: 0; font-size: 12px; color: #059669; font-style: italic;">Premium calculated based on policy holder age (${policyHolderAge}) and ${additionalMembersCount} family member(s)</p>` : ''}
            </div>
            <div>
              <p style="margin: 0; font-weight: bold; color: #374151;">Policy Status:</p>
              <p style="margin: 5px 0 15px 0; text-transform: capitalize; font-weight: 500;">${policy.policy_status || 'Pending'}</p>
            </div>
            <div>
              <p style="margin: 0; font-weight: bold; color: #374151;">Payment Frequency:</p>
              <p style="margin: 5px 0 15px 0; text-transform: capitalize; font-weight: 500;">${policy.frequency || 'Monthly'}</p>
            </div>
          </div>
        </div>

        <!-- Policy Holder Information -->
        <div style="padding: 30px; background: white;">
          <h2 style="margin: 0 0 20px 0; color: #374151; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Policy Holder Information</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Full Name:</p>
              <p style="margin: 5px 0 15px 0; color: #374151;">${policyHolderName || 'N/A'}</p>
            </div>
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Date of Birth:</p>
              <p style="margin: 5px 0 15px 0; color: #374151;">${policy.policy_holder?.date_of_birth || 'N/A'}</p>
            </div>
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Phone Number:</p>
              <p style="margin: 5px 0 15px 0; color: #374151;">${phoneNumber}</p>
            </div>
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Email:</p>
              <p style="margin: 5px 0 15px 0; color: #374151;">${email}</p>
            </div>
          </div>
        </div>

        <!-- Employment Information -->
        ${employmentDetails ? `
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="margin: 0 0 20px 0; color: #374151; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Employment Information</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Employment Type:</p>
              <p style="margin: 5px 0 15px 0; color: #374151; text-transform: capitalize;">${employmentDetails.employment_type === 'employed' ? 'Permanent' : employmentDetails.employment_type}</p>
            </div>
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Employer:</p>
              <p style="margin: 5px 0 15px 0; color: #374151;">${employmentDetails.employer_name || 'N/A'}</p>
            </div>
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Job Title:</p>
              <p style="margin: 5px 0 15px 0; color: #374151;">${employmentDetails.job_title || 'N/A'}</p>
            </div>
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Monthly Income:</p>
              <p style="margin: 5px 0 15px 0; color: #374151;">${employmentDetails.monthly_income ? new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(employmentDetails.monthly_income) : 'N/A'}</p>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Banking Information -->
        ${bankingDetails ? `
        <div style="padding: 30px; background: white;">
          <h2 style="margin: 0 0 20px 0; color: #374151; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Banking Information</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Account Name:</p>
              <p style="margin: 5px 0 15px 0; color: #374151;">${bankingDetails.account_name || 'N/A'}</p>
            </div>
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Bank:</p>
              <p style="margin: 5px 0 15px 0; color: #374151;">${bankingDetails.bank_name || 'N/A'}</p>
            </div>
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Account Number:</p>
              <p style="margin: 5px 0 15px 0; color: #374151;">${bankingDetails.account_number || 'N/A'}</p>
            </div>
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Account Type:</p>
              <p style="margin: 5px 0 15px 0; color: #374151; text-transform: capitalize;">${bankingDetails.account_type || 'N/A'}</p>
            </div>
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Payment Method:</p>
              <p style="margin: 5px 0 15px 0; color: #374151; text-transform: capitalize;">${bankingDetails.payment_method ? bankingDetails.payment_method.replace(/_/g, ' ') : 'N/A'}</p>
            </div>
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Preferred Payment Date:</p>
              <p style="margin: 5px 0 15px 0; color: #374151;">${bankingDetails.payment_date || 'N/A'}</p>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Beneficiaries -->
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="margin: 0 0 20px 0; color: #374151; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Covered Persons</h2>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <thead>
                <tr style="background: #374151; color: white;">
                  <th style="padding: 12px 8px; text-align: left; font-weight: 600;">#</th>
                  <th style="padding: 12px 8px; text-align: left; font-weight: 600;">Full Name</th>
                  <th style="padding: 12px 8px; text-align: left; font-weight: 600;">Role</th>
                  <th style="padding: 12px 8px; text-align: left; font-weight: 600;">Relationship to Policy Holder</th>
                </tr>
              </thead>
              <tbody>
                ${beneficiariesList}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Policy Dates -->
        <div style="padding: 30px; background: white;">
          <h2 style="margin: 0 0 20px 0; color: #374151; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Policy Dates</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Created Date:</p>
              <p style="margin: 5px 0 15px 0; color: #374151;">${policy.created_at ? new Date(policy.created_at).toLocaleDateString('en-ZA') : 'N/A'}</p>
            </div>
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">Start Date:</p>
              <p style="margin: 5px 0 15px 0; color: #374151;">${policy.start_date ? new Date(policy.start_date).toLocaleDateString('en-ZA') : 'Not set'}</p>
            </div>
            <div>
              <p style="margin: 0; font-weight: bold; color: #6b7280;">End Date:</p>
              <p style="margin: 5px 0 15px 0; color: #374151;">${policy.end_date ? new Date(policy.end_date).toLocaleDateString('en-ZA') : 'No end date'}</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #374151; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
          <p style="margin: 0; font-size: 14px; opacity: 0.9; color: #d1d5db;">
            This is an automated notification from Liyana Finance
          </p>
          <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.7;">
            Generated on ${new Date().toLocaleDateString('en-ZA')} at ${new Date().toLocaleTimeString('en-ZA')}
          </p>
        </div>
      </div>
    `;

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
            content: attachment.content, // Base64 encoded content
            content_type: attachment.content_type || 
                         attachment.filename.endsWith('.pdf') ? 'application/pdf' : 
                         attachment.filename.endsWith('.zip') ? 'application/zip' : 
                         attachment.filename.endsWith('.doc') ? 'application/msword' :
                         attachment.filename.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                         attachment.filename.endsWith('.xls') ? 'application/vnd.ms-excel' :
                         attachment.filename.endsWith('.xlsx') ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                         attachment.filename.endsWith('.jpg') || attachment.filename.endsWith('.jpeg') ? 'image/jpeg' :
                         attachment.filename.endsWith('.png') ? 'image/png' :
                         'application/octet-stream',
          });
        } catch (attachmentError) {
          console.error("Failed to process attachment:", attachmentError);
        }
      });
    }

    // Send the email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Liyana Finance <noreply@liyanafinance.co.za>",
      to: [linarEmailAddress],
      subject: `Funeral Policy Details - ${policyHolderName} (Policy #${policyId})`,
      html: emailHtml,
      attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
    });

    if (emailError) {
      console.error("Failed to send funeral policy email:", emailError);
      return {
        error: true,
        message: "Failed to send policy details email.",
        details: emailError.message,
      };
    }

    // Save email record - only if emailData.id exists
    if (emailData?.id) {
      const { error: saveError } = await supabase
        .from("resend_emails")
        .insert({
          resend_id: emailData.id,
          profile_id: policy.user_id, // Use the customer's profile ID, not the admin's
          policy_id: policyId,
        });

      if (saveError) {
        console.error("Failed to save email record:", saveError);
        // Don't fail the request if we can't save the record
      }
    }

    return {
      error: false,
      message: "Funeral policy details sent successfully to LINAR email.",
      emailId: emailData?.id,
      recipient: linarEmailAddress,
    };

  } catch (error) {
    console.error("Error sending funeral policy details email:", error);
    return {
      error: true,
      message: "An unexpected error occurred while sending the email.",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}


export async function updatePolicyStatus(prevState:unknown, formData: FormData) {
  // Check admin authentication first
  const authResult = await requireAdminAuth();
  if (!authResult.success) {
    return {
      error: true,
      message: authResult.error!,
      details: authResult.details,
    };
  }

  const supabase = await createClient();

  // Basic validation
  const validatedFields = updatePolicyStatusSchema.safeParse({
    policy_id: formData.get("policy_id"),
    policy_status: formData.get("policy_status"),
  })

  if (!validatedFields.success) {
    console.error("Validation failed:", validatedFields.error);
    return {
      error: true,
      message: "Invalid input.",
      details: validatedFields.error.format(),
    };
  }

  const policyId = validatedFields.data.policy_id as number;
  const newStatus = validatedFields.data.policy_status;

  

  // Verify that the policy exists
  const { data: existingPolicy, error: fetchError } = await supabase.from("policies").select("id, policy_status").eq("id", policyId).single();

  if (fetchError || !existingPolicy) {
    return {
      error: true,
      message: "Policy not found.",
      details: fetchError?.message,
    };
  }

  const { data: updatedPolicy, error: updateError } = await supabase.from("policies").update({
    policy_status: newStatus,
  }).eq("id", policyId).select("id, policy_status").single();

  if (updateError || !updatedPolicy) {
    return {
      error: true,
      message: "Failed to update policy status.",
      details: updateError?.message,
    };
  }

  revalidatePath("/dashboard/insurance");
  revalidatePath(`/dashboard/insurance/${policyId}`);

  return {
    error: false,
    message: "Policy status updated successfully.",
    policy: updatedPolicy,
  };
}