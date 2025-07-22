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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { getUserProfilesPaginated } from "@/lib/queries/user";
import { formatDistanceToNow } from "date-fns";
import { parseAsInteger, createSearchParamsCache } from "nuqs/server";
import { Suspense } from "react";
import { UsersPagination } from "@/components/users-pagination";
import Link from "next/link";

const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
});

export default async function UsersPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { page } = searchParamsCache.parse(searchParams);

  const pageSize = 10;
  const {
    data: profiles,
    total,
    totalPages,
  } = await getUserProfilesPaginated(page, pageSize);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">Manage user accounts</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>User Profiles ({total})</CardTitle>
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} to{" "}
              {Math.min(page * pageSize, total)} of {total} users
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium capitalize">
                    {profile.full_name || "No name"}
                  </TableCell>
                  <TableCell>{profile.email || "No email"}</TableCell>
                  <TableCell>{profile.phone_number || "No phone"}</TableCell>
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
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/users/${profile.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </Link>
                      {/* Add more actions as needed */}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <UsersPagination currentPage={page} totalPages={totalPages} />
        </div>
      )}
    </div>
  );
}
