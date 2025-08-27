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
import { getDeclinedUsersAndApplicationsPaginated } from "@/lib/queries/user";
import { formatDistanceToNow } from "date-fns";
import { parseAsInteger, createSearchParamsCache } from "nuqs/server";
import { UsersPagination } from "@/components/users-pagination";
import {
  Users,
  UserCheck,
  AlertTriangle,
  TrendingDown,
  XCircle,
  UserX,
} from "lucide-react";
import { ExportUsersButton } from "@/components/export-users-button";
import Link from "next/link";

const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
});

export default async function DeclinedLoansPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { page } = searchParamsCache.parse(searchParams);

  const pageSize = 10;
  const {
    data: declinedUsersAndApplications,
    total,
    totalProfiles,
    usersWithDeclinedApplications,
    usersWithoutApplications,
    usersWithApplications,
    totalPages,
  } = await getDeclinedUsersAndApplicationsPaginated(page, pageSize);

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

  const getApplicationStatusVariant = (
    status: "declined" | "no_application"
  ) => {
    switch (status) {
      case "declined":
        return "destructive";
      case "no_application":
        return "secondary";
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
            <h1 className="md:text-3xl font-bold">
              Declined Loans & Non-Applicants
            </h1>
            <p className="text-xs md:text-basetext-muted-foreground">
              Users with declined applications or who haven't applied yet
            </p>
          </div>
          <ExportUsersButton
            users={declinedUsersAndApplications}
            totalUsersWithoutApplications={total}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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
              Active Applications
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
              Declined Applications
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {usersWithDeclinedApplications}
            </div>
            <p className="text-xs text-muted-foreground">
              Applications declined
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              No Applications
            </CardTitle>
            <UserX className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {usersWithoutApplications}
            </div>
            <p className="text-xs text-muted-foreground">Haven't applied yet</p>
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
              Declined & Non-Applicant Users ({total})
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} to{" "}
              {Math.min(page * pageSize, total)} of {total} users
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Users with declined loan applications or who haven't submitted any
            applications yet.
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
                All registered users have submitted successful applications.
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
                    <TableHead>ID Number</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Application Details</TableHead>
                    <TableHead>Registered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {declinedUsersAndApplications.map((profile) => {
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
                        <TableCell className="text-sm">
                          {profile.decrypted_id_number || "Not provided"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleVariant(profile.role)}>
                            {profile.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getApplicationStatusVariant(
                              profile.application_status!
                            )}
                          >
                            {profile.application_status === "declined"
                              ? "Declined"
                              : "No Application"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {profile.application_status === "declined" ? (
                            <div className="space-y-1">
                              {profile.latest_application_id && (
                                <Link
                                  href={`/dashboard/applications/${profile.latest_application_id}`}
                                  className="text-blue-600 hover:underline text-sm"
                                >
                                  #{profile.latest_application_id}
                                </Link>
                              )}
                              {profile.application_amount && (
                                <div className="text-sm text-muted-foreground">
                                  R{profile.application_amount.toLocaleString()}
                                </div>
                              )}
                              {profile.declined_at && (
                                <div className="text-xs text-red-600">
                                  Declined{" "}
                                  {formatDistanceToNow(
                                    new Date(profile.declined_at),
                                    { addSuffix: true }
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              No applications
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              {formatDistanceToNow(
                                new Date(profile.created_at),
                                {
                                  addSuffix: true,
                                }
                              )}
                            </div>
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
                          </div>
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
    </div>
  );
}
