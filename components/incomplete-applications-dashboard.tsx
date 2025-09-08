"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users,
  CreditCard,
  FileX,
  AlertTriangle,
  Calendar,
  Phone,
  Mail,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

interface PreApplicationDetails {
  id: number;
  user_id: string;
  profile_id: string | null;
  id_number: string;
  credit_score: number | null;
  status:
    | "credit_passed"
    | "application_started"
    | "application_completed"
    | "abandoned";
  created_at: string;
  expires_at: string | null;
  profile?: {
    id: string;
    full_name: string;
    email: string | null;
    phone_number: string | null;
    role: string;
    created_at: string;
  } | null;
  credit_check?: {
    id: number;
    check_type: string;
    status: string;
    checked_at: string;
    vendor: string;
  } | null;
}

interface PreApplicationStats {
  total: number;
  credit_passed: number;
  application_started: number;
  application_completed: number;
  abandoned: number;
  conversion_rate: number;
}

export function IncompleteApplicationsDashboard() {
  const [preApplications, setPreApplications] = useState<
    PreApplicationDetails[]
  >([]);
  const [stats, setStats] = useState<PreApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // 30 days ago
    toDate: new Date().toISOString().split("T")[0], // today
  });
  const [statusFilter, setStatusFilter] = useState<string>("credit_passed");

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch pre-applications
      const preAppResponse = await fetch(
        `/api/pre-applications?status=${statusFilter}&fromDate=${dateRange.fromDate}&toDate=${dateRange.toDate}&limit=50`
      );

      if (preAppResponse.ok) {
        const preAppData = await preAppResponse.json();
        setPreApplications(preAppData.data || []);
      }

      // Fetch stats
      const statsResponse = await fetch(
        `/api/pre-applications/stats?fromDate=${dateRange.fromDate}&toDate=${dateRange.toDate}`
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }
    } catch (error) {
      console.error("Error fetching pre-application data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "credit_passed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Credit Passed
          </Badge>
        );
      case "application_started":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Started
          </Badge>
        );
      case "application_completed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Completed
          </Badge>
        );
      case "abandoned":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            Abandoned
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const markAsAbandoned = async (preApplicationId: number) => {
    try {
      const response = await fetch(
        `/api/pre-applications/${preApplicationId}/abandon`,
        {
          method: "PATCH",
        }
      );

      if (response.ok) {
        // Refresh data
        fetchData();
      }
    } catch (error) {
      console.error("Error marking as abandoned:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Incomplete Applications</h1>
          <p className="text-muted-foreground">
            Track users who passed credit checks but haven't completed
            applications
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="fromDate">From Date</Label>
              <Input
                id="fromDate"
                type="date"
                value={dateRange.fromDate}
                onChange={(e) =>
                  setDateRange((prev) => ({
                    ...prev,
                    fromDate: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="toDate">To Date</Label>
              <Input
                id="toDate"
                type="date"
                value={dateRange.toDate}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, toDate: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="w-full p-2 border rounded"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="credit_passed">Credit Passed</option>
                <option value="application_started">Application Started</option>
                <option value="abandoned">Abandoned</option>
                <option value="">All Statuses</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Credit Passed
              </CardTitle>
              <CreditCard className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.credit_passed}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Started</CardTitle>
              <FileX className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.application_started}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CreditCard className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.application_completed}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Conversion Rate
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.conversion_rate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pre-Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>Pre-Applications ({preApplications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {preApplications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pre-applications found for the selected criteria.
              </div>
            ) : (
              preApplications.map((preApp) => (
                <Card key={preApp.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">
                            {preApp.profile?.full_name || "Unknown User"}
                          </h3>
                          {getStatusBadge(preApp.status)}
                          {preApp.credit_score && (
                            <Badge variant="outline">
                              Score: {preApp.credit_score}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Created:{" "}
                              {format(
                                new Date(preApp.created_at),
                                "MMM d, yyyy"
                              )}
                            </span>
                          </div>

                          {preApp.profile?.phone_number && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{preApp.profile.phone_number}</span>
                            </div>
                          )}

                          {preApp.profile?.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>{preApp.profile.email}</span>
                            </div>
                          )}
                        </div>

                        {preApp.credit_check && (
                          <div className="text-sm text-muted-foreground">
                            Credit Check: {preApp.credit_check.vendor} -{" "}
                            {preApp.credit_check.status} on{" "}
                            {format(
                              new Date(preApp.credit_check.checked_at),
                              "MMM d, yyyy HH:mm"
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {preApp.status === "credit_passed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsAbandoned(preApp.id)}
                          >
                            Mark Abandoned
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Navigate to user profile or create application
                            window.open(
                              `/dashboard/profiles/${preApp.profile_id}`,
                              "_blank"
                            );
                          }}
                        >
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
