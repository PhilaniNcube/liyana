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
import Link from "next/link";

const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
});

export default async function DeclinedLoansPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { page } = searchParamsCache.parse(searchParams);

  const pageSize = 50;
  const { data: declinedUsersAndApplications, totalPages } =
    await getDeclinedUsersAndApplicationsPaginated(page, pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Declined Loan Applications</h1>
        <p className="text-muted-foreground">
          A list of users with declined loan applications or low credit scores.
        </p>
      </div>
      <div className="border rounded-lg w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>ID Number</TableHead>
              <TableHead>Credit Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Application Amount</TableHead>
              <TableHead>Declined At</TableHead>
              <TableHead>Registered At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {declinedUsersAndApplications.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Link
                    href={`/dashboard/users/${user.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {user.full_name}
                  </Link>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.decrypted_id_number}</TableCell>
                <TableCell>{user.credit_score ?? "N/A"}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.application_status === "declined"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {user.application_status === "declined"
                      ? "Declined"
                      : "No Application"}
                  </span>
                </TableCell>
                <TableCell>
                  {user.application_amount
                    ? `R ${user.application_amount.toLocaleString()}`
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {user.declined_at
                    ? formatDistanceToNow(new Date(user.declined_at), {
                        addSuffix: true,
                      })
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(user.created_at), {
                    addSuffix: true,
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <UsersPagination totalPages={totalPages} currentPage={page} />
    </div>
  );
}
