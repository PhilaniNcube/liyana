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
  CheckCircle,
  Clock,
  FileText,
  Plus,
  ArrowRight,
  Settings,
  Shield,
  CreditCard,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResetPasswordComponent } from "@/components/reset-password-component";
import type { Database } from "@/lib/types";

interface ProfileOverviewClientProps {
  applications: Database["public"]["Tables"]["applications"]["Row"][] | null;
  loans: Database["public"]["Tables"]["approved_loans"]["Row"][] | null;
  policies: any[] | null;
  userEmail?: string;
  userFullName?: string;
}

export function ProfileOverviewClient({
  applications,
  loans,
  policies,
  userEmail,
  userFullName,
}: ProfileOverviewClientProps) {
  const hasApplications = applications && applications.length > 0;
  const hasLoans = loans && loans.length > 0;
  const hasPolicies = policies && policies.length > 0;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {userFullName || "User"}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your account and recent activity
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loans?.filter((loan) => loan.status === "active").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Current loans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Insurance Policies
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {policies?.filter((policy) => policy.status === "active")
                .length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Active policies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applications?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Total submitted</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              asChild
              className="justify-start h-auto p-4"
              variant="outline"
            >
              <Link href="/apply">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Apply for Loan</div>
                    <div className="text-sm text-muted-foreground">
                      Quick cash loans
                    </div>
                  </div>
                </div>
              </Link>
            </Button>

            <Button
              asChild
              className="justify-start h-auto p-4"
              variant="outline"
            >
              <Link href="/insurance/funeral">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Get Insurance</div>
                    <div className="text-sm text-muted-foreground">
                      Funeral cover
                    </div>
                  </div>
                </div>
              </Link>
            </Button>

            <Button
              asChild
              className="justify-start h-auto p-4"
              variant="outline"
            >
              <Link href="/profile/my-loans">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Manage Loans</div>
                    <div className="text-sm text-muted-foreground">
                      View & track loans
                    </div>
                  </div>
                </div>
              </Link>
            </Button>

            <Button
              asChild
              className="justify-start h-auto p-4"
              variant="outline"
            >
              <Link href="/profile/my-policies">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Manage Policies</div>
                    <div className="text-sm text-muted-foreground">
                      View coverage
                    </div>
                  </div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {(hasApplications || hasLoans || hasPolicies) && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest transactions and updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasLoans && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium">Active Loans</p>
                    <p className="text-sm text-muted-foreground">
                      You have{" "}
                      {loans?.filter((l) => l.status === "active").length}{" "}
                      active loan(s)
                    </p>
                  </div>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/profile/my-loans">
                    View All <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            )}

            {hasPolicies && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium">Insurance Coverage</p>
                    <p className="text-sm text-muted-foreground">
                      You have{" "}
                      {policies?.filter((p) => p.status === "active").length}{" "}
                      active policy(ies)
                    </p>
                  </div>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/profile/my-policies">
                    View All <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                Your account details and security settings
              </CardDescription>
            </div>
            <ResetPasswordComponent userEmail={userEmail} className="ml-auto" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Full Name</p>
              <p className="text-sm text-muted-foreground">
                {userFullName || "Not provided"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Email Address</p>
              <p className="text-sm text-muted-foreground">
                {userEmail || "Not provided"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Password</p>
              <p className="text-sm text-muted-foreground">••••••••••••</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
