"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface EmailRecord {
  id: number;
  resend_id: string;
  profile_id: string;
  application_id: number | null;
  loan_id: number | null;
  policy_id: number | null;
  created_at: string;
}

interface EmailHistoryProps {
  itemId: number;
  itemType: "application" | "loan" | "policy";
}

export function EmailHistory({ itemId, itemType }: EmailHistoryProps) {
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const response = await fetch(
          `/api/emails/history?${itemType}Id=${itemId}`
        );
        if (response.ok) {
          const data = await response.json();
          setEmails(data);
        }
      } catch (error) {
        console.error("Failed to fetch email history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
  }, [itemId, itemType]);

  if (loading) {
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
            Loading email history...
          </p>
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
            No emails have been sent for this {itemType} yet.
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
          {emails.map((email) => (
            <div
              key={email.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email sent via Resend</p>
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
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
