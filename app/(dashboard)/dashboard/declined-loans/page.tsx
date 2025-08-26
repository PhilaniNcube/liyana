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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

  // Split users into two groups for the tabs
  const declinedOnly = declinedUsersAndApplications.filter(
    (u) => u.application_status === "declined"
  );
  const idNoApp = declinedUsersAndApplications.filter(
    (u) => u.application_status === "no_application"
  );

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

      {/* Users Table with Tabs */}
      <Tabs defaultValue="declined" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="declined">Declined Loans</TabsTrigger>
          <TabsTrigger value="noapp">ID Number, No Application</TabsTrigger>
        </TabsList>
        <TabsContent value="declined">
          <Card>
            <CardHeader>
              <CardTitle>Declined Loans ({declinedOnly.length})</CardTitle>
            </CardHeader>
            <CardContent>
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
                  {declinedOnly.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center">
                        No declined loans found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    declinedOnly.map((profile) => {
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
                              Declined
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {profile.credit_score !== undefined &&
                            profile.credit_score !== null ? (
                              <span
                                className={
                                  profile.credit_score < 600
                                    ? "text-red-600 font-bold"
                                    : ""
                                }
                              >
                                {profile.credit_score}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
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
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="noapp">
          <Card>
            <CardHeader>
              <CardTitle>
                ID Number, No Application ({idNoApp.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                    <TableHead>Registered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {idNoApp.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    idNoApp.map((profile) => {
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
                              No Application
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {profile.credit_score !== undefined &&
                            profile.credit_score !== null ? (
                              <span
                                className={
                                  profile.credit_score < 600
                                    ? "text-red-600 font-bold"
                                    : ""
                                }
                              >
                                {profile.credit_score}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
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
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
