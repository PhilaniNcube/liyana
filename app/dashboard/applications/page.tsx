import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAllApplications,
  type ApplicationWithProfile,
} from "@/lib/queries/applications";

function getStatusBadge(status: string) {
  const statusConfig = {
    pre_qualifier: { label: "Pre-Qualifier", variant: "secondary" as const },
    pending_documents: {
      label: "Pending Docs",
      variant: "destructive" as const,
    },
    in_review: { label: "In Review", variant: "default" as const },
    approved: { label: "Approved", variant: "default" as const },
    declined: { label: "Declined", variant: "destructive" as const },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    variant: "secondary" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default async function ApplicationsPage() {
  const applications = await getAllApplications({ limit: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Applications</h1>
        <p className="text-muted-foreground">Manage loan applications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => {
                const profile = app.profile;
                const displayName = profile?.full_name || "Unknown User";

                return (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">#{app.id}</TableCell>
                    <TableCell>{displayName}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {app.user_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      R{app.application_amount?.toLocaleString() || "0"}
                    </TableCell>
                    <TableCell>{getStatusBadge(app.status)}</TableCell>
                    <TableCell>
                      {new Date(app.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
