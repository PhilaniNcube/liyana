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
import { getUsersWithoutApplicationsPaginated } from "@/lib/queries/user";
import { formatDistanceToNow } from "date-fns";
import { parseAsInteger, createSearchParamsCache } from "nuqs/server";
import { UsersPagination } from "@/components/users-pagination";
import { Users, UserCheck, AlertTriangle, TrendingDown } from "lucide-react";
import { ExportUsersButton } from "@/components/export-users-button";

const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
});

export default async function UsersWithoutApplicationsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { page } = searchParamsCache.parse(searchParams);

  const pageSize = 10;
  const {
    data: usersWithoutApplications,
    total,
    totalProfiles,
    usersWithApplications,
    totalPages,
  } = await getUsersWithoutApplicationsPaginated(page, pageSize);

  const getRoleVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "editor":
        return "secondary";
      case "customer":
        return "default";
      default:
        return "outline";
    }
  };

  const conversionRate =
    totalProfiles > 0
      ? ((usersWithApplications / totalProfiles) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Users Without Applications</h1>
            <p className="text-muted-foreground">
              Users who have registered but haven't submitted loan applications
              yet
            </p>
          </div>
          <ExportUsersButton
            users={usersWithoutApplications}
            totalUsersWithoutApplications={total}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProfiles}</div>
            <p className="text-xs text-muted-foreground">
              All registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              With Applications
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {usersWithApplications}
            </div>
            <p className="text-xs text-muted-foreground">
              Have submitted applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Without Applications
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{total}</div>
            <p className="text-xs text-muted-foreground">
              No applications submitted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {conversionRate}%
            </div>
            <p className="text-xs text-muted-foreground">Users who applied</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Users Without Applications ({total})
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} to{" "}
              {Math.min(page * pageSize, total)} of {total} users
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            These users have registered accounts but haven't submitted any loan
            applications. Consider reaching out to them with promotional offers
            or assistance.
          </p>
        </CardHeader>
        <CardContent>
          {total === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="mx-auto h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-green-700">
                Excellent!
              </h3>
              <p className="text-muted-foreground">
                All registered users have submitted at least one application.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Days Since Registration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersWithoutApplications.map((profile) => {
                    const daysSinceRegistration = Math.floor(
                      (new Date().getTime() -
                        new Date(profile.created_at).getTime()) /
                        (1000 * 60 * 60 * 24)
                    );

                    return (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium capitalize">
                          {profile.full_name || "No name"}
                        </TableCell>
                        <TableCell>{profile.email || "No email"}</TableCell>
                        <TableCell>
                          {profile.phone_number || "No phone"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleVariant(profile.role)}>
                            {profile.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(profile.created_at), {
                            addSuffix: true,
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              daysSinceRegistration > 30
                                ? "destructive"
                                : daysSinceRegistration > 7
                                  ? "secondary"
                                  : "default"
                            }
                          >
                            {daysSinceRegistration} days
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <UsersPagination currentPage={page} totalPages={totalPages} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Insights */}
      {total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Insights & Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">User Engagement</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    • {total} users (
                    {((total / totalProfiles) * 100).toFixed(1)}%) haven't
                    applied yet
                  </li>
                  <li>• Consider email campaigns to encourage applications</li>
                  <li>• Focus on users registered more than 7 days ago</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Action Items</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Send follow-up emails to recent registrations</li>
                  <li>• Offer incentives for first-time applicants</li>
                  <li>• Analyze registration vs application barriers</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
