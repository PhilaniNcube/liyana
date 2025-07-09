import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface Application {
  affordability: any;
  decline_reason: any;
}

interface AdditionalInfoCardProps {
  application: Application;
}

export function AdditionalInfoCard({ application }: AdditionalInfoCardProps) {
  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  };

  const formatAffordabilityIncomeStatement = (affordability: any) => {
    if (!affordability) return null;

    // Handle the structured format (income/deductions/expenses arrays)
    if (
      affordability.income ||
      affordability.deductions ||
      affordability.expenses
    ) {
      const totalIncome =
        affordability.income?.reduce(
          (sum: number, item: any) => sum + (item.amount || 0),
          0
        ) || 0;
      const totalDeductions =
        affordability.deductions?.reduce(
          (sum: number, item: any) => sum + (item.amount || 0),
          0
        ) || 0;
      const totalExpenses =
        affordability.expenses?.reduce(
          (sum: number, item: any) => sum + (item.amount || 0),
          0
        ) || 0;
      const netIncome = totalIncome - totalDeductions;
      const disposableIncome = netIncome - totalExpenses;

      return {
        structured: true,
        income: affordability.income || [],
        deductions: affordability.deductions || [],
        expenses: affordability.expenses || [],
        totalIncome,
        totalDeductions,
        totalExpenses,
        netIncome,
        disposableIncome,
      };
    }

    // Fallback for any other format - treat as raw data
    return {
      structured: false,
      rawData: affordability,
    };
  };

  // Don't render if there's no data
  if (!application.affordability && !application.decline_reason) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {application.affordability && (
          <div>
            <h4 className="font-semibold mb-4">Affordability Assessment</h4>
            {(() => {
              const incomeStatement = formatAffordabilityIncomeStatement(
                application.affordability
              );
              if (!incomeStatement) {
                return (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      No affordability data available for this application.
                    </p>
                  </div>
                );
              }

              // Render structured format (like in profile page)
              if (incomeStatement.structured) {
                return (
                  <Card className="bg-muted/50">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Financial Summary
                      </CardTitle>
                      <CardDescription>
                        Monthly income sources, deductions, and expenses as
                        provided
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
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
                                    {formatCurrency(item.amount || 0)
                                      ?.replace("ZAR", "")
                                      .trim()}
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
                              {formatCurrency(incomeStatement.totalIncome)
                                ?.replace("ZAR", "")
                                .trim()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Deductions Section */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="font-semibold text-orange-600">
                            Deductions
                          </h5>
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
                                    {formatCurrency(item.amount || 0)
                                      ?.replace("ZAR", "")
                                      .trim()}
                                  </span>
                                </div>
                              ))
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No deductions recorded
                            </p>
                          )}
                          <div className="flex justify-between border-t pt-3 mt-3">
                            <span className="font-semibold">
                              Total Deductions:
                            </span>
                            <span className="font-semibold text-orange-600">
                              {formatCurrency(incomeStatement.totalDeductions)
                                ?.replace("ZAR", "")
                                .trim()}
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
                                    {formatCurrency(item.amount || 0)
                                      ?.replace("ZAR", "")
                                      .trim()}
                                  </span>
                                </div>
                              ))
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No expenses recorded
                            </p>
                          )}
                          <div className="flex justify-between border-t pt-3 mt-3">
                            <span className="font-semibold">
                              Total Expenses:
                            </span>
                            <span className="font-semibold text-red-600">
                              {formatCurrency(incomeStatement.totalExpenses)
                                ?.replace("ZAR", "")
                                .trim()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="bg-background rounded-lg p-4 space-y-2 border">
                        <h5 className="font-semibold text-lg mb-3">
                          Financial Summary
                        </h5>
                        <div className="flex justify-between">
                          <span>Total Income:</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(incomeStatement.totalIncome)
                              ?.replace("ZAR", "")
                              .trim()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Deductions:</span>
                          <span className="font-semibold text-orange-600">
                            {formatCurrency(incomeStatement.totalDeductions)
                              ?.replace("ZAR", "")
                              .trim()}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span>Net Income:</span>
                          <span className="font-semibold">
                            {formatCurrency(incomeStatement.netIncome || 0)
                              ?.replace("ZAR", "")
                              .trim()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Expenses:</span>
                          <span className="font-semibold text-red-600">
                            {formatCurrency(incomeStatement.totalExpenses)
                              ?.replace("ZAR", "")
                              .trim()}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-semibold">
                            Disposable Income:
                          </span>
                          <span
                            className={`font-bold text-lg ${
                              (incomeStatement.disposableIncome || 0) >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatCurrency(
                              incomeStatement.disposableIncome || 0
                            )
                              ?.replace("ZAR", "")
                              .trim()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              // Render flat format (fallback)
              return (
                <div className="space-y-4">
                  {/* Raw Data */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold text-muted-foreground mb-2">
                      Raw Affordability Data
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      This affordability data is in an unexpected format.
                    </p>
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        View Raw Data
                      </summary>
                      <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto mt-2">
                        {JSON.stringify(application.affordability, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
        {application.decline_reason && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Decline Reason
            </p>
            <pre className="text-sm bg-red-50 p-2 rounded overflow-x-auto">
              {JSON.stringify(application.decline_reason, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
