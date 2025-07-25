import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { decryptValue } from "@/lib/encryption";

// BraveLender API endpoint
const BRAVELENDER_API_URL =
  "https://integrations.bravelender.com/api/external/liyana_finance/loan/create";

interface BraveLenderLoanRequest {
  firstName: string;
  lastName: string;
  identificationType: "id" | "passport";
  idNumber?: string;
  passportNumber?: string;
  dateOfBirth: string;
  phoneNumber: string;
  email: string;
  gender: "male" | "female" | "rather not say" | "other";
  genderOther?: string;
  language: string;
  dependants: number;
  maritalStatus: string;
  nationality: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;

  employmentStatus: string;
  employer: string;
  employerAddress?: string;
  employerContactNumber?: string;
  jobTitle: string;
  monthlyIncome: string;
  workExperience: string;
  employmentEndDate?: string;

  loanAmount: string;
  loanPurpose: string;
  loanPurposeReason?: string;
  repaymentPeriod: string;

  nextOfKinName?: string;
  nextOfKinPhone?: string;
  nextOfKinEmail?: string;

  bankName: string;
  bankAccountHolder: string;
  bankAccountType: string;
  bankAccountNumber: string;
  branchCode: string;

  affordability?: {
    income: Array<{ type: string; amount: number }>;
    deductions: Array<{ type: string; amount: number }>;
    expenses: Array<{ type: string; amount: number }>;
  };
}

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

    // Fetch application data from database
    const { data: application, error: fetchError } = await supabase
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (fetchError || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Fetch user profile separately
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", application.user_id)
      .single();

    // Decrypt the ID number
    let decryptedIdNumber: string;
    try {
      decryptedIdNumber = decryptValue(application.id_number);
    } catch (error) {
      console.error("Failed to decrypt ID number:", error);
      return NextResponse.json(
        { error: "Failed to process application data" },
        { status: 500 }
      );
    }

    // Extract names from full_name or use fallback
    const fullName = profile?.full_name || "";
    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0] || "Unknown";
    const lastName = nameParts.slice(1).join(" ") || "Unknown";

    // Validate and format email
    const validateEmail = (email: string) => {
      // RFC 5322 compliant email regex (simplified but robust)
      const emailRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      return emailRegex.test(email) && email.length <= 254;
    };

    const formatEmail = (email: string | null | undefined) => {
      if (!email) return "";
      const trimmedEmail = email.trim().toLowerCase();
      // Remove any potential extra whitespace and ensure basic format
      const cleanEmail = trimmedEmail.replace(/\s+/g, "");
      return validateEmail(cleanEmail) ? cleanEmail : "";
    };

    // Map marital status to BraveLender format
    const mapMaritalStatus = (status: string | null) => {
      switch (status?.toLowerCase()) {
        case "single":
          return "single";
        case "married":
          return "married";
        case "divorced":
          return "divorced";
        case "widowed":
          return "widowed";
        default:
          return "single";
      }
    };

    // Map employment type to BraveLender format
    const mapEmploymentStatus = (type: string | null) => {
      switch (type?.toLowerCase()) {
        case "employed":
          return "employed";
        case "self_employed":
          return "self_employed";
        case "unemployed":
          return "unemployed";
        case "retired":
          return "retired";
        case "student":
          return "student";
        default:
          return "employed";
      }
    };

    // Map loan purpose to BraveLender format
    const mapLoanPurpose = (purpose: string | null) => {
      switch (purpose?.toLowerCase()) {
        case "debt_consolidation":
          return "debt_consolidation";
        case "home_improvement":
          return "home_improvement";
        case "medical_expenses":
          return "medical_expenses";
        case "education":
          return "education";
        case "vacation":
          return "vacation";
        case "business":
          return "business";
        case "emergency":
          return "emergency";
        case "other":
          return "other";
        default:
          return "other";
      }
    };

    // Map bank account type to BraveLender format
    const mapAccountType = (type: string | null) => {
      switch (type?.toLowerCase()) {
        case "savings":
          return "savings";
        case "current":
          return "current";
        case "transaction":
          return "current";
        case "business":
          return "current";
        case "cheque":
          return "current";
        default:
          return "savings";
      }
    };

    // Parse affordability data safely
    let affordabilityData: BraveLenderLoanRequest["affordability"] = undefined;
    if (
      application.affordability &&
      typeof application.affordability === "object"
    ) {
      try {
        affordabilityData = application.affordability as any;
      } catch (error) {
        console.warn("Failed to parse affordability data:", error);
      }
    }

    // Validate required fields before submission
    const validationErrors: string[] = [];

    if (!decryptedIdNumber) {
      validationErrors.push("ID number is required");
    }

    if (
      !application.application_amount ||
      application.application_amount <= 0
    ) {
      validationErrors.push("Valid loan amount is required");
    }

    if (!application.phone_number) {
      validationErrors.push("Phone number is required");
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationErrors.join(", "),
        },
        { status: 400 }
      );
    }

    // Prepare BraveLender request payload
    const braveLenderPayload: BraveLenderLoanRequest = {
      firstName: firstName || "Unknown",
      lastName: lastName || "Unknown",
      identificationType: "id", // Assuming SA ID numbers for now
      idNumber: decryptedIdNumber,
      dateOfBirth: application.date_of_birth || "1990-01-01",
      phoneNumber: application.phone_number || "",
      email: formatEmail(profile?.email) || "noreply@liyana.co.za", // Fallback email
      gender:
        application.gender === "other"
          ? "other"
          : (application.gender as any) || "rather not say",
      genderOther:
        application.gender === "other"
          ? application.gender_other || undefined
          : undefined,
      language: application.language || "English",
      dependants: application.dependants || 0,
      maritalStatus: mapMaritalStatus(application.marital_status),
      nationality: application.nationality || "South African",
      address: application.home_address || "",
      city: application.city || "",
      province: "Gauteng", // Default province since not captured in our form
      postalCode: application.postal_code || "0000",

      employmentStatus: mapEmploymentStatus(application.employment_type),
      employer: application.employer_name || "",
      employerAddress: application.employer_address || undefined,
      employerContactNumber: application.employer_contact_number || undefined,
      jobTitle: application.job_title || "",
      monthlyIncome: application.monthly_income?.toString() || "0",
      workExperience: "", // Default since not captured in our form
      employmentEndDate: application.employment_end_date || undefined,

      loanAmount: application.application_amount?.toString() || "",
      loanPurpose: mapLoanPurpose(application.loan_purpose),
      loanPurposeReason: application.loan_purpose_reason || undefined,
      repaymentPeriod: application.term?.toString() || "30",

      nextOfKinName: application.next_of_kin_name || undefined,
      nextOfKinPhone: application.next_of_kin_phone_number || undefined,
      nextOfKinEmail: application.next_of_kin_email || undefined,

      bankName: application.bank_name || "",
      bankAccountHolder: application.bank_account_holder || "",
      bankAccountType: mapAccountType(application.bank_account_type),
      bankAccountNumber: application.bank_account_number || "",
      branchCode: application.branch_code || "",

      affordability: affordabilityData,
    };

    // Log the payload for debugging (remove sensitive data)
    console.log("BraveLender payload (sanitized):", {
      ...braveLenderPayload,
      idNumber: decryptValue(application.id_number),
      bankAccountNumber: application.bank_account_number,
      email: braveLenderPayload.email,
    });

    // Send request to BraveLender
    const braveLenderResponse = await fetch(BRAVELENDER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "Liyana-Finance/1.0",
        "X-Request-ID": `liyana-${applicationId}-${Date.now()}`,
      },
      body: JSON.stringify(braveLenderPayload),
    });

    const braveLenderData = await braveLenderResponse.json();

    if (!braveLenderResponse.ok) {
      console.error("BraveLender API error:", {
        status: braveLenderResponse.status,
        statusText: braveLenderResponse.statusText,
        data: braveLenderData,
        url: BRAVELENDER_API_URL,
      });

      // Update application status to indicate submission failure
      await supabase
        .from("applications")
        .update({
          status: "submission_failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      return NextResponse.json(
        {
          error: "Failed to submit to BraveLender",
          details: braveLenderData?.message || braveLenderData,
          status: braveLenderResponse.status,
        },
        { status: braveLenderResponse.status }
      );
    }

    // Update application status to indicate successful submission
    await supabase
      .from("applications")
      .update({
        status: "submitted_to_lender",
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    return NextResponse.json({
      success: true,
      message: "Application successfully submitted to BraveLender",
      braveLenderResponse: braveLenderData,
      applicationId: applicationId,
    });
  } catch (error) {
    console.error("Error submitting to BraveLender:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "BraveLender Integration API",
      usage: "Send POST request with { applicationId } in body",
      endpoint: BRAVELENDER_API_URL,
      example: {
        applicationId: 123,
      },
    },
    { status: 200 }
  );
}
