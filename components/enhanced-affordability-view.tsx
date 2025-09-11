/**
 * Enhanced Affordability Display Component
 * Shows net income calculation with breakdown of income, deductions, and expenses
 */

"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  calculateAffordability,
  formatAffordabilityCalculation,
  type AffordabilityData,
  type AffordabilityCalculation,
} from "@/lib/utils/affordability-calculator";

interface EnhancedAffordabilityViewProps {
  monthlyIncome: number;
  affordabilityData: AffordabilityData | any;
  showBreakdown?: boolean;
}

export function EnhancedAffordabilityView({
  monthlyIncome,
  affordabilityData,
  showBreakdown = true,
}: EnhancedAffordabilityViewProps) {
  // Calculate affordability metrics
  const calculation = calculateAffordability(monthlyIncome, affordabilityData);
  const formatted = formatAffordabilityCalculation(calculation);

  // Helper function to determine if disposable income is healthy
  const getDisposableIncomeStatus = (disposableIncome: number) => {
    if (disposableIncome < 0)
      return { status: "negative", color: "destructive" };
    if (disposableIncome < 1000) return { status: "low", color: "secondary" };
    if (disposableIncome < 3000)
      return { status: "moderate", color: "outline" };
    return { status: "healthy", color: "default" };
  };

  const disposableStatus = getDisposableIncomeStatus(
    calculation.disposableIncome
  );

  return (
    <div className="space-y-6">
      {/* Main Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Net Income Calculation
            <Badge variant={disposableStatus.color as any}>
              {disposableStatus.status.charAt(0).toUpperCase() +
                disposableStatus.status.slice(1)}
            </Badge>
          </CardTitle>
          <CardDescription>
            Income calculation based on monthly salary plus affordability data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {formatted.totalGrossIncome}
              </div>
              <div className="text-sm text-green-700">Total Gross Income</div>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">
                {formatted.netIncome}
              </div>
              <div className="text-sm text-blue-700">
                Net Income (After Deductions)
              </div>
            </div>

            <div
              className={`text-center p-4 rounded-lg border ${
                calculation.disposableIncome >= 0
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div
                className={`text-2xl font-bold ${
                  calculation.disposableIncome >= 0
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {formatted.disposableIncome}
              </div>
              <div
                className={`text-sm ${
                  calculation.disposableIncome >= 0
                    ? "text-emerald-700"
                    : "text-red-700"
                }`}
              >
                Disposable Income
              </div>
            </div>
          </div>

          {showBreakdown && (
            <>
              <Separator />

              {/* Detailed Breakdown */}
              <div className="space-y-4">
                <h4 className="font-semibold">Income Breakdown</h4>

                {/* Income Sources */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Base Monthly Income:
                    </span>
                    <span className="font-semibold text-green-600">
                      {formatted.monthlyIncome}
                    </span>
                  </div>

                  {calculation.additionalIncome > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Additional Income:
                      </span>
                      <span className="font-semibold text-green-600">
                        + {formatted.additionalIncome}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="font-semibold">Total Gross Income:</span>
                    <span className="font-bold text-green-600">
                      {formatted.totalGrossIncome}
                    </span>
                  </div>
                </div>

                {/* Deductions */}
                {calculation.totalDeductions > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-semibold text-orange-600">
                      Deductions
                    </h5>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Total Deductions:
                      </span>
                      <span className="font-semibold text-orange-600">
                        - {formatted.totalDeductions}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2">
                      <span className="font-semibold">Net Income:</span>
                      <span className="font-bold text-blue-600">
                        {formatted.netIncome}
                      </span>
                    </div>
                  </div>
                )}

                {/* Expenses */}
                {calculation.totalExpenses > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-semibold text-red-600">
                      Monthly Expenses
                    </h5>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Total Expenses:
                      </span>
                      <span className="font-semibold text-red-600">
                        - {formatted.totalExpenses}
                      </span>
                    </div>
                  </div>
                )}

                {/* Final Result */}
                <div
                  className={`p-3 rounded-lg border-2 ${
                    calculation.disposableIncome >= 0
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Final Disposable Income:</span>
                    <span
                      className={`font-bold text-lg ${
                        calculation.disposableIncome >= 0
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatted.disposableIncome}
                    </span>
                  </div>
                  {calculation.disposableIncome < 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ Negative disposable income indicates potential
                      affordability concerns
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detailed Income, Deductions, and Expenses Lists */}
      {showBreakdown && affordabilityData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Additional Income Details */}
          {affordabilityData.income && affordabilityData.income.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-green-600">
                  Additional Income Sources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {affordabilityData.income
                  .filter((item: any) => item.amount > 0)
                  .map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span>{item.type}</span>
                      <span className="font-medium text-green-600">
                        R{item.amount.toLocaleString("en-ZA")}
                      </span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

          {/* Deductions Details */}
          {affordabilityData.deductions &&
            affordabilityData.deductions.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-orange-600">
                    Deductions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {affordabilityData.deductions
                    .filter((item: any) => item.amount > 0)
                    .map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span>{item.type}</span>
                        <span className="font-medium text-orange-600">
                          R{item.amount.toLocaleString("en-ZA")}
                        </span>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}

          {/* Expenses Details */}
          {affordabilityData.expenses &&
            affordabilityData.expenses.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-600">
                    Monthly Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {affordabilityData.expenses
                    .filter((item: any) => item.amount > 0)
                    .map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span>{item.type}</span>
                        <span className="font-medium text-red-600">
                          R{item.amount.toLocaleString("en-ZA")}
                        </span>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}
        </div>
      )}

      {/* Raw Data Debug (for development) */}
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          View Raw Calculation Data
        </summary>
        <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto mt-2">
          {JSON.stringify({ calculation, formatted }, null, 2)}
        </pre>
      </details>
    </div>
  );
}
