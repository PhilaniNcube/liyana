"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Edit, Download, Search, Filter } from "lucide-react";
import Link from "next/link";
import { getAllClaims } from "@/lib/queries/claims";

interface ClaimsPageClientProps {
  initialClaims: Awaited<ReturnType<typeof getAllClaims>>;
}

export const ClaimsPageClient = ({ initialClaims }: ClaimsPageClientProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const claims = initialClaims || [];

  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      const matchesSearch =
        claim.claim_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.parties?.first_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        claim.parties?.last_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        claim.parties?.organization_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        claim.policy_id.toString().includes(searchTerm);

      const matchesStatus =
        statusFilter === "all" || claim.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [claims, searchTerm, statusFilter]);

  if (!claims || claims.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Funeral Claims Management
          </h1>
          <p className="text-gray-600 mt-2">
            View and manage all funeral insurance claims
          </p>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No claims found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status summary
  const statusSummary = claims.reduce(
    (acc, claim) => {
      const status = claim.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Get unique statuses for filter dropdown
  const uniqueStatuses = Array.from(
    new Set(claims.map((claim) => claim.status))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Funeral Claims Management
        </h1>
        <p className="text-gray-600 mt-2">
          View and manage all funeral insurance claims
        </p>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{claims.length}</div>
            <p className="text-xs text-muted-foreground">Total Claims</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {statusSummary.pending || 0}
            </div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {statusSummary.approved || 0}
            </div>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {statusSummary.rejected || 0}
            </div>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Controls */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by claim number, claimant name, or policy ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {uniqueStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Claims Overview</CardTitle>
          <p className="text-sm text-muted-foreground">
            Showing {filteredClaims.length} of {claims.length} claims
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Claim Number</TableHead>
                  <TableHead>Claimant</TableHead>
                  <TableHead>Policy ID</TableHead>
                  <TableHead>Date Filed</TableHead>
                  <TableHead>Date of Incident</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClaims.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">
                        No claims found matching your search criteria.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClaims.map((claim) => (
                    <TableRow key={claim.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="font-mono text-sm">
                          {claim.claim_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {claim.parties
                              ? `${claim.parties.first_name || ""} ${claim.parties.last_name || ""}`.trim() ||
                                claim.parties.organization_name ||
                                "N/A"
                              : "N/A"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {claim.policy_id}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(claim.date_filed)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(claim.date_of_incident)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(claim.status)}>
                          {claim.status.charAt(0).toUpperCase() +
                            claim.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link
                              href={`/dashboard/insurance/${claim.policy_id}?tab=claims`}
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-lg">
        <span>
          Showing {filteredClaims.length} of {claims.length} claims
          {searchTerm && ` matching "${searchTerm}"`}
          {statusFilter !== "all" && ` with status "${statusFilter}"`}
        </span>
        <span>
          Last updated:{" "}
          {new Date().toLocaleDateString("en-ZA", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
};
