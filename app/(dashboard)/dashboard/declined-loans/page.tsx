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
import { getApiChecksByType } from "@/lib/queries/api-checks";
import { formatDistanceToNow } from "date-fns";
import {
  parseAsInteger,
  parseAsString,
  createSearchParamsCache,
} from "nuqs/server";
import { UsersPagination } from "@/components/users-pagination";
import {
  Users,
  UserCheck,
  AlertTriangle,
  TrendingDown,
  XCircle,
  UserX,
  Calendar,
  Filter,
  X,
} from "lucide-react";
import { ExportUsersButton } from "@/components/export-users-button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  dateFrom: parseAsString,
  dateTo: parseAsString,
  sortBy: parseAsString.withDefault("application_date"),
  sortOrder: parseAsString.withDefault("desc"),
});

export default async function DeclinedLoansPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { page, dateFrom, dateTo, sortBy, sortOrder } =
    searchParamsCache.parse(searchParams);

  const pageSize = 50;
  const {
    data: declinedUsersAndApplications,
    total,
    totalProfiles,
    usersWithDeclinedApplications,
    usersWithoutApplications,
    usersWithApplications,
    totalPages,
  } = await getDeclinedUsersAndApplicationsPaginated(
    page,
    pageSize,
    dateFrom || undefined,
    dateTo || undefined,
    sortBy as "registration_date" | "application_date" | "name" | "status",
    sortOrder as "asc" | "desc"
  );

  // Fetch all credit_bureau api-checks for mapping
  const apiChecks = await getApiChecksByType("credit_bureau");
  // Map: id_number (decrypted) -> latest credit score
  const creditScoreMap = new Map();
  for (const check of apiChecks) {
    let idNum = check.id_number;
    if (idNum && typeof idNum === "string" && idNum.length > 13) {
      try {
        idNum = require("@/lib/encryption").decryptValue(idNum);
      } catch {}
    }
    if (!idNum) continue;
    if (!creditScoreMap.has(idNum)) {
      let score = null;
      const payload = check.response_payload;
      if (payload && typeof payload === "object" && !Array.isArray(payload)) {
        if ("score" in payload && typeof payload["score"] === "number") {
          score = payload["score"];
        } else if ("Score" in payload && typeof payload["Score"] === "number") {
          score = payload["Score"];
        } else if (
          "data" in payload &&
          payload["data"] &&
          typeof payload["data"] === "object" &&
          !Array.isArray(payload["data"])
        ) {
          const dataObj = payload["data"];
          if ("score" in dataObj && typeof dataObj["score"] === "number") {
            score = dataObj["score"];
          }
        }
      }
      if (score !== null && !isNaN(Number(score))) {
        creditScoreMap.set(idNum, Number(score));
      }
    }
  }

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
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div>
            <h1 className="text-xl md:text-3xl font-bold">
              Declined Loans & Low Credit Score Users
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Users with declined applications or credit report score below 600
              {(dateFrom || dateTo) && (
                <span className="block text-sm text-blue-600 mt-1">
                  Filtered by registration date
                  {dateFrom &&
                    ` from ${new Date(dateFrom).toLocaleDateString()}`}
                  {dateTo && ` to ${new Date(dateTo).toLocaleDateString()}`}
                </span>
              )}
              {(sortBy !== "application_date" || sortOrder !== "desc") && (
                <span className="block text-sm text-green-600 mt-1">
                  Sorted by {sortBy.replace("_", " ")} (
                  {sortOrder === "asc" ? "oldest first" : "newest first"})
                </span>
              )}
            </p>
          </div>
          <ExportUsersButton
            users={declinedUsersAndApplications}
            totalUsersWithoutApplications={total}
          />
        </div>
      </div>

      {/* Date Filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Date Filter
            {(dateFrom ||
              dateTo ||
              sortBy !== "application_date" ||
              sortOrder !== "desc") && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                Active
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <form method="GET" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="dateFrom" className="text-xs">
                  From Date (Registration)
                </Label>
                <TableHead>Credit Score</TableHead>
                <Input
                  id="dateFrom"
                  name="dateFrom"
                  type="date"
                  defaultValue={dateFrom || ""}
                  className="h-8"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo" className="text-xs">
                  To Date (Registration)
                </Label>
                <Input
                  id="dateTo"
                  name="dateTo"
                  type="date"
                  defaultValue={dateTo || ""}
                  className="h-8"
                />
              </div>
              <div className="">
                <Label htmlFor="sortBy" className="text-xs">
                  Sort By
                </Label>
                <Select name="sortBy" defaultValue={sortBy}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registration_date">
                      Registration Date
                    </SelectItem>
                    <SelectItem value="application_date">
                      Application Date
                    </SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="">
                <Label htmlFor="sortOrder" className="text-xs">
                  Order
                </Label>
                <Select name="sortOrder" defaultValue={sortOrder}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest First</SelectItem>
                    <SelectItem value="asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="h-8 flex-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  Apply
                </Button>
              </div>
              <div>
                {(dateFrom ||
                  dateTo ||
                  sortBy !== "application_date" ||
                  sortOrder !== "desc") && (
                  <Link
                    href="/dashboard/declined-loans"
                    className="inline-flex items-center justify-center rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 w-full"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Link>
                )}
              </div>
            </div>
            {(dateFrom ||
              dateTo ||
              sortBy !== "application_date" ||
              sortOrder !== "desc") && (
              <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                <strong>Active Filters:</strong>{" "}
                {dateFrom && `From ${new Date(dateFrom).toLocaleDateString()}`}
                {dateFrom && dateTo && " • "}
                {dateTo && `To ${new Date(dateTo).toLocaleDateString()}`}
                {(dateFrom || dateTo) &&
                  (sortBy !== "application_date" || sortOrder !== "desc") &&
                  " • "}
                {sortBy !== "application_date" &&
                  `Sort: ${sortBy.replace("_", " ")}`}
                {sortBy !== "application_date" && sortOrder !== "desc" && " • "}
                {sortOrder !== "desc" &&
                  `Order: ${sortOrder === "asc" ? "Oldest First" : "Newest First"}`}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

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
            <CardTitle className="flex flex-col md:flex-row md:items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Declined & Non-Applicant Users ({total})
              {(dateFrom || dateTo) && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  Filtered
                </span>
              )}
              {(sortBy !== "registration_date" || sortOrder !== "desc") && (
                <span className="text-xs text-center bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Sorted: {sortBy.replace("_", " ")} (
                  {sortOrder === "asc" ? "↑" : "↓"})
                </span>
              )}
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1} to{" "}
                {Math.min(page * pageSize, total)} of {total} users
              </div>
            </CardTitle>
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
                    <TableHead>Credit Score</TableHead>
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
                    // Find credit score by id_number
                    const creditScore = profile.decrypted_id_number
                      ? creditScoreMap.get(profile.decrypted_id_number)
                      : undefined;
                    return (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium capitalize">
                          {profile.full_name || "No name"}
                        </TableCell>
                        <TableCell>{profile.email || "No email"}</TableCell>
                        <TableCell>
                          {profile.phone_number || "No phone"}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
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
                          {creditScore !== undefined && creditScore !== null ? (
                            <span
                              className={
                                creditScore < 600
                                  ? "text-red-600 font-bold"
                                  : ""
                              }
                            >
                              {creditScore}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
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
