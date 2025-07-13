import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoansPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Loans</h1>
        <p className="text-muted-foreground">Manage active loans</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Loans</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Loan management functionality will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
