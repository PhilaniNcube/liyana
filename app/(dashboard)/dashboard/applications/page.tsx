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
import { getAllApplications } from "@/lib/queries/applications";
import Link from "next/link";

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
        <h1 className="text-3xl font-bold">Active Applications</h1>
        <p className="text-muted-foreground">
          Manage pending and approved loan applications
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>ID Number</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => {
                const profile = app.profile;
                const displayName = profile?.full_name || "Unknown User";
                const idDisplay = app.id_number_decrypted || "-";

                return (
                  <TableRow
                    key={app.id}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/applications/${app.id}`}
                        className="block"
                      >
                        #{app.id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/applications/${app.id}`}
                        className="block"
                      >
                        {displayName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <Link
                        href={`/dashboard/applications/${app.id}`}
                        className="block"
                      >
                        {idDisplay}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/applications/${app.id}`}
                        className="block"
                      >
                        R{app.application_amount?.toLocaleString() || "0"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/applications/${app.id}`}
                        className="block"
                      >
                        {getStatusBadge(app.status)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/applications/${app.id}`}
                        className="block"
                      >
                        {new Date(app.created_at).toLocaleDateString()}
                      </Link>
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
