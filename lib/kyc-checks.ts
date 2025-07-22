// KYC Check Types
export interface KYCCheckResult {
  success: boolean;
  error?: string;
  message: string;
  data?: any;
}

export interface KYCResults {
  idVerification: KYCCheckResult | null;
  creditCheck: KYCCheckResult | null;
  debtReview: KYCCheckResult | null;
  fraudCheck: KYCCheckResult | null;
  overall: boolean;
  errors: string[];
}

// Individual KYC check functions
export async function performIdVerification(
  idNumber: string
): Promise<KYCCheckResult> {
  try {
    const response = await fetch("/api/kyc/id-verification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idNumber }),
    });

    if (!response.ok) {
      throw new Error("ID verification API request failed");
    }

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: "Network error",
      message: "Failed to connect to ID verification service",
    };
  }
}

export async function performCreditCheck(
  idNumber: string
): Promise<KYCCheckResult> {
  try {
    const response = await fetch("/api/kyc/credit-check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idNumber }),
    });

    if (!response.ok) {
      throw new Error("Credit check API request failed");
    }

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: "Network error",
      message: "Failed to connect to credit check service",
    };
  }
}

export async function performDebtReviewCheck(
  idNumber: string
): Promise<KYCCheckResult> {
  try {
    const response = await fetch("/api/kyc/debt-review", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idNumber }),
    });

    if (!response.ok) {
      throw new Error("Debt review API request failed");
    }

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: "Network error",
      message: "Failed to connect to debt review service",
    };
  }
}

export async function performFraudCheck(
  idNumber: string
): Promise<KYCCheckResult> {
  try {
    const response = await fetch("/api/kyc/fraud-check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idNumber }),
    });

    if (!response.ok) {
      throw new Error("Credit Check API request failed");
    }

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: "Network error",
      message: "Failed to connect to Credit Check service",
    };
  }
}

// Comprehensive KYC check function
export async function performKYCChecks(idNumber: string): Promise<KYCResults> {
  const results: KYCResults = {
    idVerification: null,
    creditCheck: null,
    debtReview: null,
    fraudCheck: null,
    overall: false,
    errors: [],
  };

  try {
    // Run all checks in parallel for better performance
    const [idVerification, creditCheck, debtReview, fraudCheck] =
      await Promise.all([
        performIdVerification(idNumber),
        performCreditCheck(idNumber),
        performDebtReviewCheck(idNumber),
        performFraudCheck(idNumber),
      ]);

    results.idVerification = idVerification;
    results.creditCheck = creditCheck;
    results.debtReview = debtReview;
    results.fraudCheck = fraudCheck;

    // Collect all errors
    if (!idVerification.success) {
      results.errors.push(idVerification.message);
    }
    if (!creditCheck.success) {
      results.errors.push(creditCheck.message);
    }
    if (!debtReview.success) {
      results.errors.push(debtReview.message);
    }
    if (!fraudCheck.success) {
      results.errors.push(fraudCheck.message);
    }

    // Overall result is successful only if ALL checks pass
    results.overall =
      idVerification.success &&
      creditCheck.success &&
      debtReview.success &&
      fraudCheck.success;
  } catch (error) {
    results.errors.push("Unexpected error during KYC checks");
  }

  return results;
}
