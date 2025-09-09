"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type {
  EmailWithDetails,
  EmailDetails,
  EmailRecord,
} from "@/lib/queries/emails";

interface EmailHistoryProps {
  emails: EmailWithDetails[] | EmailRecord[];
}

export function EmailHistory({ emails }: EmailHistoryProps) {
  const [expandedEmails, setExpandedEmails] = useState<Record<string, boolean>>(
    {}
  );
  const [emailDetails, setEmailDetails] = useState<
    Record<string, EmailDetails | null>
  >({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>(
    {}
  );

  // Function to fetch email details from Resend API
  const fetchEmailDetails = async (resendId: string) => {
    if (emailDetails[resendId] !== undefined || loadingDetails[resendId]) {
      return; // Already fetched or currently fetching
    }

    setLoadingDetails((prev) => ({ ...prev, [resendId]: true }));

    try {
      const response = await fetch(`/api/emails/details/${resendId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const details = await response.json();
        setEmailDetails((prev) => ({ ...prev, [resendId]: details }));
      } else {
        console.error("Failed to fetch email details:", response.statusText);
        setEmailDetails((prev) => ({ ...prev, [resendId]: null }));
      }
    } catch (error) {
      console.error("Error fetching email details:", error);
      setEmailDetails((prev) => ({ ...prev, [resendId]: null }));
    } finally {
      setLoadingDetails((prev) => ({ ...prev, [resendId]: false }));
    }
  };

  const toggleEmailExpansion = async (resendId: string) => {
    setExpandedEmails((prev) => ({
      ...prev,
      [resendId]: !prev[resendId],
    }));

    // Fetch details when expanding if not already fetched
    if (!expandedEmails[resendId] && emailDetails[resendId] === undefined) {
      await fetchEmailDetails(resendId);
    }
  };

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
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email History ({emails.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {emails.map((email) => {
            // Use dynamically fetched details if available, otherwise fall back to email.details if it exists
            const details =
              emailDetails[email.resend_id] ||
              ("details" in email ? email.details : undefined);
            const isExpanded = expandedEmails[email.resend_id];
            const isLoadingDetails = loadingDetails[email.resend_id];

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
                          {details?.to && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <User className="h-3 w-3" />
                              To:{" "}
                              {Array.isArray(details.to)
                                ? details.to.join(", ")
                                : details.to}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          ID: {email.resend_id.slice(0, 8)}...
                        </Badge>
                        {isLoadingDetails && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
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
                      {isLoadingDetails ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">
                              Loading email details...
                            </span>
                          </div>
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
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground">
                            Email details could not be loaded from Resend.
                          </p>
                          <button
                            onClick={() => fetchEmailDetails(email.resend_id)}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            Retry loading details
                          </button>
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
