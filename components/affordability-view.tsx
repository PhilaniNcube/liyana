"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Helper function to format currency consistently
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-ZA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Type definitions for affordability data
interface AffordabilityItem {
  type: string;
  amount: number;
}

interface AffordabilityData {
  income: AffordabilityItem[];
  deductions: AffordabilityItem[];
  expenses: AffordabilityItem[];
}

interface AffordabilityViewProps {
  affordabilityData: AffordabilityData | any;
}

export function AffordabilityView({
  affordabilityData,
}: AffordabilityViewProps) {
  if (!affordabilityData) {
    return (
      <div>
        <h4 className="font-semibold mb-4">Affordability Assessment</h4>
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            No affordability data available for this application.
          </p>
        </div>
      </div>
    );
  }

  // Check if we have the expected structured format
  if (
    !affordabilityData.income &&
    !affordabilityData.deductions &&
    !affordabilityData.expenses
  ) {
    return (
      <div>
        <h4 className="font-semibold mb-4">Affordability Assessment</h4>
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-2">
            This affordability data is in an unexpected format.
          </p>
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              View Raw Data
            </summary>
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto mt-2">
              {JSON.stringify(affordabilityData, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    );
  }

  // Helper function to format affordability data into a consistent structure
  const formatAffordabilityIncomeStatement = (affordabilityData: any) => {
    if (!affordabilityData) return null;

    // Check if we have structured data
    if (
      affordabilityData.income ||
      affordabilityData.deductions ||
      affordabilityData.expenses
    ) {
      const totalIncome =
        affordabilityData.income?.reduce(
          (sum: number, item: any) => sum + (item.amount || 0),
          0
        ) || 0;
      const totalDeductions =
        affordabilityData.deductions?.reduce(
          (sum: number, item: any) => sum + (item.amount || 0),
          0
        ) || 0;
      const totalExpenses =
        affordabilityData.expenses?.reduce(
          (sum: number, item: any) => sum + (item.amount || 0),
          0
        ) || 0;

      return {
        structured: true,
        income: affordabilityData.income || [],
        deductions: affordabilityData.deductions || [],
        expenses: affordabilityData.expenses || [],
        totalIncome,
        totalDeductions,
        totalExpenses,
        netIncome: totalIncome - totalDeductions,
        disposableIncome: totalIncome - totalDeductions - totalExpenses,
      };
    }

    // Handle flat structure
    let grossIncome = 0;
    const deductions: { [key: string]: number } = {};
    const expenses: { [key: string]: number } = {};

    // Define patterns for categorizing fields
    const incomePatterns = [
      /^(gross_?|total_?)?income$/i,
      /^(gross_?|total_?)?salary$/i,
      /^(gross_?|total_?)?wage$/i,
      /^(gross_?|total_?)?pay$/i,
      /^(gross_?|total_?)?earning$/i,
      /^basic_?salary$/i,
      /^basic_?pay$/i,
      /^monthly_?income$/i,
      /^monthly_?salary$/i,
      /^net_?income$/i,
      /^net_?salary$/i,
      /^take_?home$/i,
      /^commission$/i,
      /^bonus$/i,
      /^overtime$/i,
      /^allowance$/i,
      /.*_?income$/i,
      /.*_?salary$/i,
      /.*_?pay$/i,
      /.*_?earning$/i,
    ];

    const deductionPatterns = [
      /^(total_?)?deductions?$/i,
      /^tax(es)?$/i,
      /^income_?tax$/i,
      /^paye$/i,
      /^uif$/i,
      /^medical_?aid$/i,
      /^pension$/i,
      /^provident_?fund$/i,
      /^retirement$/i,
      /^union_?fees?$/i,
      /^professional_?fees?$/i,
      /^garnishee$/i,
      /^court_?order$/i,
      /^deduction$/i,
      /.*_?tax$/i,
      /.*_?deduction$/i,
      /.*_?contribution$/i,
      /.*_?fee$/i,
      /.*_?dues?$/i,
    ];

    const expensePatterns = [
      /^(total_?)?expenses?$/i,
      /^rent$/i,
      /^mortgage$/i,
      /^bond$/i,
      /^utilities$/i,
      /^electricity$/i,
      /^water$/i,
      /^gas$/i,
      /^groceries$/i,
      /^food$/i,
      /^transport$/i,
      /^fuel$/i,
      /^petrol$/i,
      /^insurance$/i,
      /^medical_?insurance$/i,
      /^car_?insurance$/i,
      /^life_?insurance$/i,
      /^debt_?repayments?$/i,
      /^loan_?repayments?$/i,
      /^credit_?card$/i,
      /^clothing$/i,
      /^entertainment$/i,
      /^savings$/i,
      /^investments?$/i,
      /^education$/i,
      /^school_?fees?$/i,
      /^childcare$/i,
      /^maintenance$/i,
      /^domestic_?help$/i,
      /^gardening$/i,
      /^security$/i,
      /^internet$/i,
      /^phone$/i,
      /^cellphone$/i,
      /^mobile$/i,
      /^other_?expenses?$/i,
      /^miscellaneous$/i,
      /.*_?payment$/i,
      /.*_?expense$/i,
      /.*_?cost$/i,
      /.*_?bill$/i,
    ];

    // Helper function to categorize a key
    const categorizeKey = (key: string, value: any) => {
      const numValue = Number(value);
      if (isNaN(numValue) || numValue === 0) return null;

      // Check if it's an income key
      if (incomePatterns.some((pattern) => pattern.test(key))) {
        return { category: "income", value: numValue };
      }

      // Check if it's a deduction key
      if (deductionPatterns.some((pattern) => pattern.test(key))) {
        return { category: "deduction", value: numValue };
      }

      // Check if it's an expense key
      if (expensePatterns.some((pattern) => pattern.test(key))) {
        return { category: "expense", value: numValue };
      }

      // Default to expense if not clearly categorized
      return { category: "expense", value: numValue };
    };

    // Process all keys in the affordability object
    Object.entries(affordabilityData).forEach(([key, value]) => {
      // Skip null, undefined, and nested objects
      if (value === null || value === undefined || typeof value === "object") {
        return;
      }

      const categorized = categorizeKey(key, value);
      if (categorized) {
        switch (categorized.category) {
          case "income":
            // For income, we typically want the highest value if multiple income sources
            if (categorized.value > grossIncome) {
              grossIncome = categorized.value;
            }
            break;
          case "deduction":
            deductions[key] = categorized.value;
            break;
          case "expense":
            expenses[key] = categorized.value;
            break;
        }
      }
    });

    // If no income was found, try to find any positive numeric value that might be income
    if (grossIncome === 0) {
      const potentialIncome = Object.entries(affordabilityData).find(
        ([key, value]) => {
          const numValue = Number(value);
          return (
            !isNaN(numValue) &&
            numValue > 0 &&
            !deductions[key] &&
            !expenses[key]
          );
        }
      );
      if (potentialIncome) {
        grossIncome = Number(potentialIncome[1]) || 0;
      }
    }

    // Calculate totals for flat structure
    const totalDeductions = Object.values(deductions).reduce(
      (sum: number, value: any) => sum + (Number(value) || 0),
      0
    );
    const totalExpenses = Object.values(expenses).reduce(
      (sum: number, value: any) => sum + (Number(value) || 0),
      0
    );
    const netIncome = grossIncome - totalDeductions;
    const disposableIncome = netIncome - totalExpenses;

    return {
      structured: false,
      grossIncome,
      deductions,
      totalDeductions,
      netIncome,
      expenses,
      totalExpenses,
      disposableIncome,
    };
  };

  const incomeStatement = formatAffordabilityIncomeStatement(affordabilityData);

  if (!incomeStatement) {
    return (
      <div>
        <h4 className="font-semibold mb-4">Affordability Assessment</h4>
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            No valid affordability data available for this application.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h4 className="font-semibold mb-4">Affordability Assessment</h4>
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Financial Summary</CardTitle>
          <CardDescription>
            Monthly income sources, deductions, and expenses as provided
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {incomeStatement.structured ? (
            // Render structured format
            <>
              {/* Income Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-semibold text-green-600">
                    Income Sources
                  </h5>
                </div>
                <div className="space-y-3">
                  {incomeStatement.income &&
                  incomeStatement.income.length > 0 ? (
                    incomeStatement.income
                      .filter(
                        (item: any) =>
                          item.amount > 0 || item.type.trim() !== ""
                      )
                      .map((item: any, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between items-center py-2 border-b border-muted"
                        >
                          <span className="text-sm">
                            {item.type || "Unnamed Income"}
                          </span>
                          <span className="font-medium text-green-600">
                            R{formatCurrency(item.amount || 0)}
                          </span>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No income sources recorded
                    </p>
                  )}
                  <div className="flex justify-between border-t pt-3 mt-3">
                    <span className="font-semibold">Total Income:</span>
                    <span className="font-semibold text-green-600">
                      R{formatCurrency(incomeStatement.totalIncome)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-semibold text-orange-600">Deductions</h5>
                </div>
                <div className="space-y-3">
                  {incomeStatement.deductions &&
                  incomeStatement.deductions.length > 0 ? (
                    incomeStatement.deductions
                      .filter(
                        (item: any) =>
                          item.amount > 0 || item.type.trim() !== ""
                      )
                      .map((item: any, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between items-center py-2 border-b border-muted"
                        >
                          <span className="text-sm">
                            {item.type || "Unnamed Deduction"}
                          </span>
                          <span className="font-medium text-orange-600">
                            R{formatCurrency(item.amount || 0)}
                          </span>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No deductions recorded
                    </p>
                  )}
                  <div className="flex justify-between border-t pt-3 mt-3">
                    <span className="font-semibold">Total Deductions:</span>
                    <span className="font-semibold text-orange-600">
                      R{formatCurrency(incomeStatement.totalDeductions)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expenses Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-semibold text-red-600">
                    Monthly Expenses
                  </h5>
                </div>
                <div className="space-y-3">
                  {incomeStatement.expenses &&
                  incomeStatement.expenses.length > 0 ? (
                    incomeStatement.expenses
                      .filter(
                        (item: any) =>
                          item.amount > 0 || item.type.trim() !== ""
                      )
                      .map((item: any, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between items-center py-2 border-b border-muted"
                        >
                          <span className="text-sm">
                            {item.type || "Unnamed Expense"}
                          </span>
                          <span className="font-medium text-red-600">
                            R{formatCurrency(item.amount || 0)}
                          </span>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No expenses recorded
                    </p>
                  )}
                  <div className="flex justify-between border-t pt-3 mt-3">
                    <span className="font-semibold">Total Expenses:</span>
                    <span className="font-semibold text-red-600">
                      R{formatCurrency(incomeStatement.totalExpenses)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Render flat format
            <>
              {/* Gross Income */}
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-green-800">
                    Gross Monthly Income
                  </span>
                  <span className="font-bold text-green-900">
                    R{formatCurrency(incomeStatement.grossIncome || 0)}
                  </span>
                </div>
              </div>

              {/* Deductions */}
              {Object.keys(incomeStatement.deductions || {}).length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-red-800 mb-2">
                    Deductions
                  </h5>
                  <div className="space-y-1">
                    {Object.entries(incomeStatement.deductions || {}).map(
                      ([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="capitalize text-red-700">
                            {key.replace(/_/g, " ")}
                          </span>
                          <span className="text-red-900">
                            R{formatCurrency(Number(value))}
                          </span>
                        </div>
                      )
                    )}
                    <div className="flex justify-between font-semibold text-red-800 pt-2 border-t border-red-200">
                      <span>Total Deductions</span>
                      <span>
                        R{formatCurrency(incomeStatement.totalDeductions || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Net Income */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-blue-800">
                    Net Monthly Income
                  </span>
                  <span className="font-bold text-blue-900">
                    R{formatCurrency(incomeStatement.netIncome || 0)}
                  </span>
                </div>
              </div>

              {/* Expenses */}
              {Object.keys(incomeStatement.expenses || {}).length > 0 && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-orange-800 mb-2">
                    Monthly Expenses
                  </h5>
                  <div className="space-y-1">
                    {Object.entries(incomeStatement.expenses || {}).map(
                      ([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="capitalize text-orange-700">
                            {key.replace(/_/g, " ")}
                          </span>
                          <span className="text-orange-900">
                            R{formatCurrency(Number(value))}
                          </span>
                        </div>
                      )
                    )}
                    <div className="flex justify-between font-semibold text-orange-800 pt-2 border-t border-orange-200">
                      <span>Total Expenses</span>
                      <span>
                        R{formatCurrency(incomeStatement.totalExpenses || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Disposable Income */}
              <div
                className={`p-4 rounded-lg ${
                  (incomeStatement.disposableIncome || 0) > 0
                    ? "bg-emerald-50 border-2 border-emerald-200"
                    : "bg-red-50 border-2 border-red-200"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`font-bold text-lg ${
                      (incomeStatement.disposableIncome || 0) > 0
                        ? "text-emerald-800"
                        : "text-red-800"
                    }`}
                  >
                    Final Disposable Income
                  </span>
                  <span
                    className={`font-bold text-xl ${
                      (incomeStatement.disposableIncome || 0) > 0
                        ? "text-emerald-900"
                        : "text-red-900"
                    }`}
                  >
                    R{formatCurrency(incomeStatement.disposableIncome || 0)}
                  </span>
                </div>
                {(incomeStatement.disposableIncome || 0) <= 0 && (
                  <p className="text-sm text-red-700 mt-2">
                    ⚠️ Negative disposable income indicates potential
                    affordability concerns
                  </p>
                )}
              </div>
            </>
          )}

          {/* Summary */}
          <div className="bg-background rounded-lg p-4 space-y-2 border">
            <h5 className="font-semibold text-lg mb-3">Financial Summary</h5>
            <div className="flex justify-between">
              <span>Total Income:</span>
              <span className="font-semibold text-green-600">
                R
                {formatCurrency(
                  incomeStatement.structured
                    ? incomeStatement.totalIncome
                    : incomeStatement.grossIncome
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Deductions:</span>
              <span className="font-semibold text-orange-600">
                -R{formatCurrency(incomeStatement.totalDeductions)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span>Net Income:</span>
              <span className="font-semibold">
                R{formatCurrency(incomeStatement.netIncome)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Expenses:</span>
              <span className="font-semibold text-red-600">
                -R{formatCurrency(incomeStatement.totalExpenses)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Disposable Income:</span>
              <span
                className={`font-bold text-lg ${
                  incomeStatement.disposableIncome >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                R{formatCurrency(incomeStatement.disposableIncome)}
              </span>
            </div>
          </div>

          {/* Raw Data Toggle */}
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              View Raw Affordability Data
            </summary>
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto mt-2">
              {JSON.stringify(affordabilityData, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}
