import { createClient } from "@/lib/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  FileText,
  CreditCard,
  TrendingUp,
  DollarSign,
  Clock,
} from "lucide-react";

async function getDashboardStats() {
  const supabase = await createClient();

  // Get total applications
  const { count: totalApplications } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true });

  // Get pending applications (pre_qualifier + pending_documents + in_review)
  const { count: pendingApplications } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .in("status", ["pre_qualifier", "pending_documents", "in_review"]);

  // Get approved applications
  const { count: approvedApplications } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");

  // Get total loan amount (sum of approved applications)
  const { data: approvedLoans } = await supabase
    .from("applications")
    .select("application_amount")
    .eq("status", "approved");

  const totalLoanAmount =
    approvedLoans?.reduce(
      (sum, loan) => sum + (loan.application_amount || 0),
      0
    ) || 0;

  return {
    totalApplications: totalApplications || 0,
    pendingApplications: pendingApplications || 0,
    approvedApplications: approvedApplications || 0,
    totalLoanAmount,
  };
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const statCards = [
    {
      title: "Total Applications",
      value: stats.totalApplications,
      icon: FileText,
      description: "All loan applications",
    },
    {
      title: "Pending Applications",
      value: stats.pendingApplications,
      icon: Clock,
      description: "Awaiting review",
    },
    {
      title: "Approved Applications",
      value: stats.approvedApplications,
      icon: CreditCard,
      description: "Successfully approved",
    },
    {
      title: "Total Loan Amount",
      value: `R${stats.totalLoanAmount.toLocaleString()}`,
      icon: DollarSign,
      description: "Total approved amount",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the Liyana Finance admin dashboard
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Recent loan applications will appear here
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">API Status</span>
                <span className="text-sm text-green-600">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <span className="text-sm text-green-600">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Credit Check API</span>
                <span className="text-sm text-green-600">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
