/**
 * Utility functions for calculating affordability metrics
 * Based on the application's monthly_income and affordability data structure
 */

export interface AffordabilityItem {
  type: string;
  amount: number;
}

export interface AffordabilityData {
  income: AffordabilityItem[];
  expenses: AffordabilityItem[];
  deductions: AffordabilityItem[];
}

export interface AffordabilityCalculation {
  monthlyIncome: number;
  additionalIncome: number;
  totalGrossIncome: number;
  totalDeductions: number;
  totalExpenses: number;
  netIncome: number;
  disposableIncome: number;
}

/**
 * Calculates net disposable income based on monthly income and affordability data
 * Formula: (monthly_income + additional_income) - deductions - expenses
 * 
 * @param monthlyIncome - Base monthly income from application
 * @param affordabilityData - Affordability data containing income, deductions, and expenses
 * @returns Calculated affordability metrics
 */
export function calculateAffordability(
  monthlyIncome: number = 0,
  affordabilityData: AffordabilityData | any = null
): AffordabilityCalculation {
  // Initialize with base monthly income
  const baseMonthlyIncome = Number(monthlyIncome) || 0;
  
  // Initialize totals
  let additionalIncome = 0;
  let totalDeductions = 0;
  let totalExpenses = 0;

  // Process affordability data if it exists
  if (affordabilityData) {
    // Calculate additional income from affordability data
    if (affordabilityData.income && Array.isArray(affordabilityData.income)) {
      additionalIncome = affordabilityData.income.reduce(
        (sum: number, item: AffordabilityItem) => sum + (Number(item.amount) || 0),
        0
      );
    }

    // Calculate total deductions
    if (affordabilityData.deductions && Array.isArray(affordabilityData.deductions)) {
      totalDeductions = affordabilityData.deductions.reduce(
        (sum: number, item: AffordabilityItem) => sum + (Number(item.amount) || 0),
        0
      );
    }

    // Calculate total expenses
    if (affordabilityData.expenses && Array.isArray(affordabilityData.expenses)) {
      totalExpenses = affordabilityData.expenses.reduce(
        (sum: number, item: AffordabilityItem) => sum + (Number(item.amount) || 0),
        0
      );
    }
  }

  // Calculate derived values
  const totalGrossIncome = baseMonthlyIncome + additionalIncome;
  const netIncome = totalGrossIncome - totalDeductions;
  const disposableIncome = netIncome - totalExpenses;

  return {
    monthlyIncome: baseMonthlyIncome,
    additionalIncome,
    totalGrossIncome,
    totalDeductions,
    totalExpenses,
    netIncome,
    disposableIncome,
  };
}

/**
 * Formats affordability calculation results for display
 * 
 * @param calculation - Result from calculateAffordability
 * @returns Formatted calculation with currency strings
 */
export function formatAffordabilityCalculation(calculation: AffordabilityCalculation) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return {
    monthlyIncome: formatCurrency(calculation.monthlyIncome),
    additionalIncome: formatCurrency(calculation.additionalIncome),
    totalGrossIncome: formatCurrency(calculation.totalGrossIncome),
    totalDeductions: formatCurrency(calculation.totalDeductions),
    totalExpenses: formatCurrency(calculation.totalExpenses),
    netIncome: formatCurrency(calculation.netIncome),
    disposableIncome: formatCurrency(calculation.disposableIncome),
    raw: calculation, // Include raw numbers for further calculations
  };
}

/**
 * Example usage with the provided affordability structure:
 * 
 * const affordabilityData = {
 *   "income": [
 *     {"type": "Bonus", "amount": 0},
 *     {"type": "Rental Income", "amount": 0},
 *     {"type": "Business Income", "amount": 0},
 *     {"type": "Maintenance/spousal support", "amount": 0},
 *     {"type": "Other", "amount": 0}
 *   ],
 *   "expenses": [
 *     {"type": "Levies", "amount": 200},
 *     {"type": "Municipal rates and taxes", "amount": 0},
 *     {"type": "Car repayment", "amount": 500},
 *     // ... more expenses
 *   ],
 *   "deductions": [
 *     {"type": "PAYE", "amount": 100},
 *     {"type": "UIF", "amount": 0},
 *     {"type": "SDL", "amount": 0},
 *     {"type": "Other", "amount": 200}
 *   ]
 * };
 * 
 * const calculation = calculateAffordability(25000, affordabilityData);
 * console.log(calculation);
 * // Output:
 * // {
 * //   monthlyIncome: 25000,
 * //   additionalIncome: 0,
 * //   totalGrossIncome: 25000,
 * //   totalDeductions: 300,
 * //   totalExpenses: 700,
 * //   netIncome: 24700,
 * //   disposableIncome: 24000
 * // }
 */
