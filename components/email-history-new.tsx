"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, User, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { EmailWithDetails } from "@/lib/queries/emails";

interface EmailHistoryProps {
  emails: EmailWithDetails[];
}

export function EmailHistory({ emails }: EmailHistoryProps) {
  const [expandedEmails, setExpandedEmails] = useState<Record<string, boolean>>(
    {}
  );

  const toggleEmailExpansion = (resendId: string) => {
    setExpandedEmails((prev) => ({
      ...prev,
      [resendId]: !prev[resendId],
    }));
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
            const details = email.details;
            const isExpanded = expandedEmails[email.resend_id];

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
                      {details ? (
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
                        <p className="text-sm text-muted-foreground">
                          Email details could not be loaded from Resend.
                        </p>
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
