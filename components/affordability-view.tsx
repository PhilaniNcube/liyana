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
  affordabilityData: AffordabilityData | null;
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

  // Calculate totals
  const totalIncome =
    affordabilityData.income?.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    ) || 0;
  const totalDeductions =
    affordabilityData.deductions?.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    ) || 0;
  const totalExpenses =
    affordabilityData.expenses?.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    ) || 0;

  const netIncome = totalIncome - totalDeductions;
  const disposableIncome = netIncome - totalExpenses;

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
          {/* Income Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h5 className="font-semibold text-green-600">Income Sources</h5>
            </div>
            <div className="space-y-3">
              {affordabilityData.income &&
              affordabilityData.income.length > 0 ? (
                affordabilityData.income
                  .filter((item) => item.amount > 0 || item.type.trim() !== "")
                  .map((item, index) => (
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
                  R{formatCurrency(totalIncome)}
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
              {affordabilityData.deductions &&
              affordabilityData.deductions.length > 0 ? (
                affordabilityData.deductions
                  .filter((item) => item.amount > 0 || item.type.trim() !== "")
                  .map((item, index) => (
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
                  R{formatCurrency(totalDeductions)}
                </span>
              </div>
            </div>
          </div>

          {/* Expenses Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h5 className="font-semibold text-red-600">Monthly Expenses</h5>
            </div>
            <div className="space-y-3">
              {affordabilityData.expenses &&
              affordabilityData.expenses.length > 0 ? (
                affordabilityData.expenses
                  .filter((item) => item.amount > 0 || item.type.trim() !== "")
                  .map((item, index) => (
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
                  R{formatCurrency(totalExpenses)}
                </span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-background rounded-lg p-4 space-y-2 border">
            <h5 className="font-semibold text-lg mb-3">Financial Summary</h5>
            <div className="flex justify-between">
              <span>Total Income:</span>
              <span className="font-semibold text-green-600">
                R{formatCurrency(totalIncome)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Deductions:</span>
              <span className="font-semibold text-orange-600">
                -R{formatCurrency(totalDeductions)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span>Net Income:</span>
              <span className="font-semibold">
                R{formatCurrency(netIncome)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Expenses:</span>
              <span className="font-semibold text-red-600">
                -R{formatCurrency(totalExpenses)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Disposable Income:</span>
              <span
                className={`font-bold text-lg ${
                  disposableIncome >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                R{formatCurrency(disposableIncome)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
