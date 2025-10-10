"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle,
  Calendar,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PolicyWithHolder } from "@/lib/queries/policies";

interface Policy {
  id: string;
  coverage_amount?: number;
  premium_amount?: number;
  start_date?: string;
  end_date?: string;
  product_type?: string;
  status?: string;
}

interface MyPoliciesClientProps {
  policies: PolicyWithHolder[];
  userId: string;
}

// Helper function to get policy status color
const getPolicyStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200";
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    case "expired":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-blue-100 text-blue-800 border-blue-200";
  }
};

const getPolicyStatusIcon = (status: string) => {
  switch (status) {
    case "active":
      return <CheckCircle className="h-4 w-4" />;
    case "pending":
      return <Clock className="h-4 w-4" />;
    case "cancelled":
    case "expired":
      return <Shield className="h-4 w-4" />;
    default:
      return <Shield className="h-4 w-4" />;
  }
};

export function MyPoliciesClient({ policies, userId }: MyPoliciesClientProps) {
  const hasPolicies = policies && policies.length > 0;
  const activePolicies =
    policies?.filter((policy) => policy.policy_status === "active") || [];
  const pendingPolicies =
    policies?.filter((policy) => policy.policy_status === "pending") || [];
  const expiredPolicies =
    policies?.filter(
      (policy) =>
        policy.policy_status === "lapsed" ||
        policy.policy_status === "cancelled"
    ) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Policies</h1>
          <p className="text-muted-foreground mt-1">
            Manage your insurance policies and coverage
          </p>
        </div>
        <Button asChild className="bg-black text-white">
          <Link href="/insurance/funeral">
            <Plus className="h-4 w-4 mr-2" />
            New Policy
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Policies
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{policies?.length || 0}</div>
            <p className="text-xs text-muted-foreground">All policies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Policies
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activePolicies.length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Policies
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingPolicies.length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Coverage
            </CardTitle>
      
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R
              {activePolicies
                .reduce(
                  (total, policy) => total + (policy.coverage_amount || 0),
                  0
                )
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Active coverage</p>
          </CardContent>
        </Card>
      </div>

      {/* Policies List */}
      {hasPolicies ? (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Policy History</h2>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy ID</TableHead>
                    {/* <TableHead>Type</TableHead> */}
                    <TableHead>Status</TableHead>
                    <TableHead>Coverage Amount</TableHead>
                    <TableHead>Premium</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.map((policy) => (
                    <TableRow key={policy.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        #{policy.id}
                      </TableCell>
                      {/* <TableCell className="capitalize">
                        {policy.product_type?.replace("_", " ") || "N/A"}
                      </TableCell> */}
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getPolicyStatusColor(
                            policy.policy_status || "active"
                          )}
                        >
                          {getPolicyStatusIcon(
                            policy.policy_status || "active"
                          )}
                          <span className="ml-1">
                            {policy.policy_status || "active"}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        R{policy.coverage_amount?.toLocaleString() || "0"}
                      </TableCell>
                      <TableCell>
                        {policy.premium_amount
                          ? `R${policy.premium_amount.toLocaleString()}`
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {policy.start_date
                          ? new Date(policy.start_date).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {policy.end_date
                          ? new Date(policy.end_date).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/profile/policies/${policy.id}`}>
                            View Details
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No Insurance Policies
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              You don't have any insurance policies yet. Get protected today.
            </p>
            <Button asChild className="bg-black text-white">
              <Link href="/insurance/funeral">
                <Plus className="h-4 w-4 mr-2" />
                New Funeral Cover
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
