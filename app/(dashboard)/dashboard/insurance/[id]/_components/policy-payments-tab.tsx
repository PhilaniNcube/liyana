import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "date-fns";

type PremiumPayment = {
  id: number;
  amount: number;
  payment_date: string;
  status: string;
  payment_method?: string;
};

function getStatusVariant(status: string) {
  switch (status.toLowerCase()) {
    case "paid":
    case "successful":
      return "default";
    case "pending":
    case "processing":
      return "secondary";
    case "failed":
    case "declined":
      return "destructive";
    default:
      return "outline";
  }
}

interface PolicyPaymentsTabProps {
  payments: PremiumPayment[];
  policy: {
    premium_amount: number | null;
    frequency: string | null;
    start_date: string | null;
  };
}

export default function PolicyPaymentsTab({
  payments,
  policy,
}: PolicyPaymentsTabProps) {
  const totalPaid = payments
    .filter(
      (p) =>
        p.status.toLowerCase() === "paid" ||
        p.status.toLowerCase() === "successful"
    )
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = payments
    .filter(
      (p) =>
        p.status.toLowerCase() === "pending" ||
        p.status.toLowerCase() === "processing"
    )
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4">
      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {formatCurrency(totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground">Total Paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {formatCurrency(pendingAmount)}
            </div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {policy.premium_amount
                ? formatCurrency(policy.premium_amount)
                : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              Premium ({policy.frequency || "—"})
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No payment history available for this policy.
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="font-medium">
                      {formatDate(payment.payment_date, "PP")}
                    </div>
                    {payment.payment_method && (
                      <div className="text-sm text-muted-foreground capitalize">
                        {payment.payment_method.replace(/_/g, " ")}
                      </div>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-medium">
                      {formatCurrency(payment.amount)}
                    </div>
                    <Badge variant={getStatusVariant(payment.status)}>
                      {payment.status.charAt(0).toUpperCase() +
                        payment.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
