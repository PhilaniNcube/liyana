"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TestBraveLenderPage() {
  const [applicationId, setApplicationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!applicationId.trim()) {
      setError("Please enter an application ID");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`/api/bravelender/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ applicationId: applicationId.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit to BraveLender");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>BraveLender Integration Test</CardTitle>
          <CardDescription>
            Test the submission of loan applications to BraveLender API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label
              htmlFor="applicationId"
              className="block text-sm font-medium mb-2"
            >
              Application ID
            </label>
            <Input
              id="applicationId"
              type="text"
              placeholder="Enter application ID"
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !applicationId.trim()}
            className="w-full"
          >
            {loading ? "Submitting..." : "Submit to BraveLender"}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <p>
                    <strong>Success!</strong>
                  </p>
                  <p>
                    <strong>Status:</strong> {result.status}
                  </p>
                  <p>
                    <strong>Message:</strong> {result.message}
                  </p>
                  {result.bravelenderResponse && (
                    <details className="mt-4">
                      <summary className="cursor-pointer font-medium">
                        BraveLender Response
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(result.bravelenderResponse, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600">
          <ol className="list-decimal list-inside space-y-2">
            <li>Enter the ID of an existing loan application</li>
            <li>Click "Submit to BraveLender" to test the integration</li>
            <li>
              The API will fetch the application data and submit it to
              BraveLender
            </li>
            <li>View the response to see if the submission was successful</li>
          </ol>
          <p className="mt-4 text-xs text-gray-500">
            Note: This will make an actual API call to BraveLender if
            configured. Make sure you have the correct API credentials in your
            environment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
