"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function TestSMSPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLastResult(null);

    try {
      const response = await fetch("/api/test-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setLastResult({
          success: true,
          message: "SMS sent successfully!",
          details: data,
        });
        toast.success("SMS sent successfully!");
        // Clear form on success
        setPhoneNumber("");
        setMessage("");
      } else {
        setLastResult({
          success: false,
          message: data.error || "Failed to send SMS",
          details: data,
        });
        toast.error(data.error || "Failed to send SMS");
      }
    } catch (error) {
      const errorMessage = "Network error occurred";
      setLastResult({
        success: false,
        message: errorMessage,
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    phoneNumber.trim().length > 0 && message.trim().length > 0;
  const remainingChars = 160 - message.length;

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">SMS Test Portal</h1>
          <p className="text-muted-foreground mt-2">
            Test the SMS functionality by sending a message to any South African
            phone number
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Send className="h-5 w-5 mr-2" />
              Send Test SMS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+27123456789 or 0123456789"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-sm text-muted-foreground">
                  Enter a South African phone number (+27xxxxxxxxx or
                  0xxxxxxxxx)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Enter your test message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isLoading}
                  maxLength={160}
                  rows={4}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Maximum 160 characters</span>
                  <span className={remainingChars < 0 ? "text-red-500" : ""}>
                    {remainingChars} characters remaining
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={!isFormValid || isLoading || remainingChars < 0}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending SMS...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send SMS
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {lastResult && (
          <Alert
            className={
              lastResult.success ? "border-green-500" : "border-red-500"
            }
          >
            <div className="flex items-center">
              {lastResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <AlertDescription className="ml-2">
                <div className="space-y-2">
                  <p className="font-medium">{lastResult.message}</p>
                  {lastResult.details && (
                    <details className="text-sm">
                      <summary className="cursor-pointer hover:underline">
                        View details
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(lastResult.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </div>
          </Alert>
        )}

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">Usage Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ul className="space-y-1">
              <li>• Phone numbers must be in South African format</li>
              <li>• Accepts both +27xxxxxxxxx and 0xxxxxxxxx formats</li>
              <li>• Messages are limited to 160 characters</li>
              <li>• Requires SMS Portal credentials to be configured</li>
              <li>• This is for testing purposes only</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">Example Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <strong>Phone Number:</strong> +27123456789 or 0123456789
            </div>
            <div>
              <strong>Message:</strong> Hello! This is a test message from
              Liyana.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
