"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Send, MessageSquare, Clock, Phone, Edit } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useSmsHistory, useRefreshSmsHistory } from "@/hooks/use-sms-history";
import type { SmsLogRecord } from "@/lib/queries/sms";

interface SmsApplicationProps {
  applicationId: number;
  profileId: string;
  phoneNumber: string;
  applicantName: string;
}

export default function SmsApplication({
  applicationId,
  profileId,
  phoneNumber,
  applicantName,
}: SmsApplicationProps) {
  const [message, setMessage] = useState("");
  const [editablePhoneNumber, setEditablePhoneNumber] = useState(phoneNumber);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const refreshSmsHistory = useRefreshSmsHistory();

  // Use TanStack Query for SMS history
  const {
    data: smsHistory = [],
    isLoading,
    error,
  } = useSmsHistory({
    profileId,
    enabled: !!profileId,
  });

  // Update editable phone number when prop changes
  useEffect(() => {
    setEditablePhoneNumber(phoneNumber);
  }, [phoneNumber]);

  const handleSendSms = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (!editablePhoneNumber) {
      toast.error("No phone number available for this applicant");
      return;
    }

    if (!validatePhoneNumber(editablePhoneNumber)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setIsSending(true);

    try {
      // Send SMS using the API endpoint
      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileId,
          phoneNumber: editablePhoneNumber,
          message: message.trim(),
          applicationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error sending SMS:", data);
        toast.error(data.error || "Failed to send SMS");
        return;
      }

      toast.success("SMS sent successfully");
      setMessage("");

      // Refresh SMS history using TanStack Query
      refreshSmsHistory(profileId);
    } catch (error) {
      console.error("Error sending SMS:", error);
      toast.error("Failed to send SMS");
    } finally {
      setIsSending(false);
    }
  };
  const getSmsPreview = (msg: string) => {
    return msg.length > 100 ? msg.substring(0, 100) + "..." : msg;
  };

  const validatePhoneNumber = (phone: string) => {
    // Basic phone number validation - adjust regex based on your requirements
    const phoneRegex = /^(\+?27|0)?[0-9]{9}$/; // South African phone number format
    return phoneRegex.test(phone.replace(/\s+/g, ""));
  };

  return (
    <div className="space-y-6">
      {/* Send SMS Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send SMS
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>To: {applicantName}</span>
            {!isEditingPhone ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {editablePhoneNumber || "No phone number"}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingPhone(true)}
                  className="h-6 px-2"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  value={editablePhoneNumber}
                  onChange={(e) => setEditablePhoneNumber(e.target.value)}
                  placeholder="Enter phone number"
                  className="h-6 w-40 text-xs"
                  onBlur={() => setIsEditingPhone(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "Escape") {
                      setIsEditingPhone(false);
                    }
                  }}
                  autoFocus
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sms-message">Message</Label>
            <Textarea
              id="sms-message"
              placeholder={`Hi ${applicantName}, regarding your loan application #${applicationId}...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={160}
              className="resize-none"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Character limit: 160</span>
              <span>{message.length}/160</span>
            </div>
          </div>

          <Button
            onClick={handleSendSms}
            disabled={isSending || !message.trim() || !editablePhoneNumber}
            className="w-full"
          >
            {isSending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send SMS
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* SMS History Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS History
            {smsHistory.length > 0 && (
              <Badge variant="secondary">{smsHistory.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Failed to load SMS history</p>
              <p className="text-sm">
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
            </div>
          ) : smsHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No SMS messages sent yet</p>
              <p className="text-sm">Send your first SMS to {applicantName}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {smsHistory.map((sms) => (
                <div key={sms.id} className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm mb-2">
                        {getSmsPreview(sms.message)}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{sms.phone_number}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(sms.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>

                  {sms.message.length > 100 && (
                    <details className="mt-2">
                      <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                        Show full message
                      </summary>
                      <p className="text-sm mt-2 p-2 bg-background rounded border">
                        {sms.message}
                      </p>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
