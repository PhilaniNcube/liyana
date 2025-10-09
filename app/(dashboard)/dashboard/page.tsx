import { createClient } from "@/lib/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats } from "@/lib/queries";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: user, error: userError } = await supabase.auth.getUser();

  // Fetch dashboard statistics
  let stats: Awaited<ReturnType<typeof getDashboardStats>> | null = null;
  let statsError: string | null = null;
  try {
    stats = await getDashboardStats();
  } catch (e: any) {
    statsError = e.message || "Failed to load stats";
    console.error("[dashboard] getDashboardStats error", e);
  }

  const formatNumber = (n: number) => new Intl.NumberFormat("en-ZA").format(n);
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0,
    }).format(n || 0);

  const statCards = stats && typeof stats === 'object' && 'applications' in stats
    ? [
        {
          title: "Applications",
          value: formatNumber(stats.applications.total),
          sub: `${formatNumber(stats.applications.last30Days)} in last 30d`,
        },
        {
          title: "Approval Rate",
          value: `${stats.applications.approvalRate.toFixed(1)}%`,
          sub: `${formatNumber(stats.applications.approved)} approved`,
        },
        {
          title: "Avg Amount",
          value: formatCurrency(stats.applications.averageAmount),
          sub: `Approved: ${formatCurrency(stats.applications.approvedAmount)}`,
        },
        {
          title: "API Pass Rate",
          value: `${stats.apiChecks.passRate.toFixed(1)}%`,
          sub: `${formatNumber(stats.apiChecks.passed)}/${formatNumber(stats.apiChecks.total)} checks`,
        },
        {
          title: "Documents",
          value: formatNumber(stats.documents.total),
          sub: `${formatNumber(stats.documents.idDocuments)} IDs, ${formatNumber(stats.documents.bankStatements)} bank`,
        },
        {
          title: "Users",
          value: formatNumber(stats.users.total),
          sub: `${formatNumber(stats.users.customers)} customers`,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the Liyana Finance admin dashboard
        </p>
        {!user && (
          <p className="text-sm text-red-600 mt-2">
            No authenticated session detected. Check middleware and cookie
            propagation.
          </p>
        )}
      </div>

      {/* Stats summary cards */}
      {statsError && (
        <Card className="border-red-500/40">
          <CardHeader>
            <CardTitle className="text-red-600">
              Failed to load statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-500">{statsError}</p>
          </CardContent>
        </Card>
      )}
      {!statsError && (
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {statCards.map((c) => (
            <Card key={c.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{c.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{c.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
