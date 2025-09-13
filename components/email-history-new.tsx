"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { EmailWithDetails, EmailDetails } from "@/lib/queries/emails";

interface EmailHistoryProps {
  emails: EmailWithDetails[];
  policyId: number;
}

// Function to fetch emails for a policy from the API
async function fetchEmailsForPolicy(
  policyId: number
): Promise<EmailWithDetails[]> {
  const response = await fetch(`/api/emails/history?policyId=${policyId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result;
}

// Function to fetch email details from Resend API
async function fetchEmailByResendId(
  resendId: string
): Promise<EmailDetails | null> {
  try {
    const response = await fetch(`/api/emails/${resendId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error);
    }

    return result.data;
  } catch (error) {
    console.error("Error fetching email:", error);
    return null;
  }
}

export function EmailHistory({
  emails: initialEmails,
  policyId,
}: EmailHistoryProps) {
  // Use TanStack Query to fetch emails with initial data
  const {
    data: emails = [],
    isLoading: isEmailsLoading,
    error: emailsError,
    refetch: refetchEmails,
  } = useQuery({
    queryKey: ["emails", "policy", policyId],
    queryFn: () => fetchEmailsForPolicy(policyId),
    initialData: initialEmails,
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    refetchOnWindowFocus: false,
  });

  const [expandedEmails, setExpandedEmails] = useState<Record<string, boolean>>(
    {}
  );
  const [emailDetails, setEmailDetails] = useState<
    Record<string, EmailDetails | null>
  >({});
  const [loadingEmails, setLoadingEmails] = useState<Record<string, boolean>>(
    {}
  );
  const [refreshingAll, setRefreshingAll] = useState(false);

  const toggleEmailExpansion = async (resendId: string) => {
    const isCurrentlyExpanded = expandedEmails[resendId];

    setExpandedEmails((prev) => ({
      ...prev,
      [resendId]: !prev[resendId],
    }));

    // If expanding and we don't have details yet, fetch them
    if (!isCurrentlyExpanded && !emailDetails[resendId]) {
      await fetchEmailDetails(resendId);
    }
  };

  const fetchEmailDetails = async (resendId: string) => {
    setLoadingEmails((prev) => ({ ...prev, [resendId]: true }));

    try {
      const details = await fetchEmailByResendId(resendId);
      setEmailDetails((prev) => ({ ...prev, [resendId]: details }));
    } catch (error) {
      console.error(`Failed to fetch email details for ${resendId}:`, error);
      setEmailDetails((prev) => ({ ...prev, [resendId]: null }));
    } finally {
      setLoadingEmails((prev) => ({ ...prev, [resendId]: false }));
    }
  };

  const refreshAllEmails = async () => {
    setRefreshingAll(true);

    try {
      // Refetch the emails list first
      await refetchEmails();

      // Then fetch details for all emails
      const promises = emails.map((email) =>
        fetchEmailDetails(email.resend_id)
      );
      await Promise.all(promises);
    } catch (error) {
      console.error("Failed to refresh all emails:", error);
    } finally {
      setRefreshingAll(false);
    }
  };

  if (isEmailsLoading && !initialEmails.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading email history...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (emailsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-red-600 mb-4">
              Failed to load email history: {emailsError.message}
            </p>
            <Button onClick={() => refetchEmails()} variant="outline" size="sm">
              <RefreshCw className="h-3 w-3 mr-1" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (emails.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No emails have been sent for this policy yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email History ({emails.length})
          </CardTitle>
          <Button
            onClick={refreshAllEmails}
            disabled={refreshingAll || isEmailsLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshingAll || isEmailsLoading ? "animate-spin" : ""}`}
            />
            {refreshingAll ? "Refreshing..." : "Refresh All"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {emails.map((email) => {
            // Use fetched details if available, otherwise fall back to existing details
            const details = emailDetails[email.resend_id] || email.details;
            const isExpanded = expandedEmails[email.resend_id];
            const isLoading = loadingEmails[email.resend_id];

            return (
              <Collapsible
                key={email.id}
                open={isExpanded}
                onOpenChange={() => toggleEmailExpansion(email.resend_id)}
              >
                <div className="border rounded-lg">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {details?.subject || "Email sent via Resend"}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(email.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          ID: {email.resend_id.slice(0, 8)}...
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t p-3 bg-gray-50">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                          <span className="ml-2 text-sm text-muted-foreground">
                            Loading email details...
                          </span>
                        </div>
                      ) : details ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <label className="font-medium text-gray-700">
                                From:
                              </label>
                              <p className="text-gray-600">{details.from}</p>
                            </div>
                            <div>
                              <label className="font-medium text-gray-700">
                                Subject:
                              </label>
                              <p className="text-gray-600">{details.subject}</p>
                            </div>
                            <div>
                              <label className="font-medium text-gray-700">
                                Recipients:
                              </label>
                              <p className="text-gray-600">
                                {Array.isArray(details.to)
                                  ? details.to.join(", ")
                                  : details.to}
                              </p>
                            </div>
                            <div>
                              <label className="font-medium text-gray-700">
                                Status:
                              </label>
                              <p className="text-gray-600">
                                {details.last_event || "Sent"}
                              </p>
                            </div>
                          </div>

                          {details.html && (
                            <div>
                              <label className="font-medium text-gray-700 block mb-2">
                                Email Content:
                              </label>
                              <div
                                className="border rounded p-3 bg-white max-h-96 overflow-y-auto text-sm"
                                dangerouslySetInnerHTML={{
                                  __html: details.html,
                                }}
                              />
                            </div>
                          )}

                          {!details.html && details.text && (
                            <div>
                              <label className="font-medium text-gray-700 block mb-2">
                                Email Content (Text):
                              </label>
                              <div className="border rounded p-3 bg-white max-h-96 overflow-y-auto text-sm whitespace-pre-wrap">
                                {details.text}
                              </div>
                            </div>
                          )}

                          <div className="flex justify-end">
                            <Button
                              onClick={() => fetchEmailDetails(email.resend_id)}
                              variant="ghost"
                              size="sm"
                              disabled={isLoading}
                            >
                              <RefreshCw
                                className={`h-3 w-3 mr-1 ${isLoading ? "animate-spin" : ""}`}
                              />
                              Refresh
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-sm text-muted-foreground mb-4">
                            Email details could not be loaded from Resend.
                          </p>
                          <Button
                            onClick={() => fetchEmailDetails(email.resend_id)}
                            variant="outline"
                            size="sm"
                            disabled={isLoading}
                          >
                            <RefreshCw
                              className={`h-3 w-3 mr-1 ${isLoading ? "animate-spin" : ""}`}
                            />
                            Try Again
                          </Button>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
