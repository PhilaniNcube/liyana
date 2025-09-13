/**
 * Dynamic Email History Component Example
 *
 * This example shows how to use the enhanced EmailHistory component
 * that can fetch email details on-demand from the Resend API.
 */

import { useState, useEffect } from "react";
import { EmailHistory } from "@/components/email-history-new";
import { getEmailsForApplication } from "@/lib/queries/emails";

// Example 1: Using with basic email records (details fetched on-demand)
export async function ApplicationEmailHistoryDynamic({
  applicationId,
}: {
  applicationId: number;
}) {
  // Fetch only basic email records (no details)
  const emails = await getEmailsForApplication(applicationId);

  return (
    <div>
      <h2>Email History (Dynamic Loading)</h2>
      {/* 
        EmailHistory will fetch details from Resend API when emails are expanded.
        This reduces initial page load time and API calls.
      */}
      <EmailHistory emails={emails} policyId={0} />
    </div>
  );
}

// Example 2: Using with pre-fetched details (traditional approach)
export async function ApplicationEmailHistoryPreloaded({
  applicationId,
}: {
  applicationId: number;
}) {
  // Fetch emails with details already included
  const { getEmailsForApplicationWithDetails } = await import(
    "@/lib/queries/emails"
  );
  const emails = await getEmailsForApplicationWithDetails(applicationId);

  return (
    <div>
      <h2>Email History (Pre-loaded)</h2>
      {/* 
        EmailHistory will use the pre-fetched details immediately.
        This shows content faster but requires more initial API calls.
      */}
      <EmailHistory emails={emails} policyId={0} />
    </div>
  );
}

// Example 3: Client-side usage with dynamic loading
export function ClientSideEmailHistory({
  applicationId,
}: {
  applicationId: number;
}) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/emails/history?applicationId=${applicationId}`)
      .then((res) => res.json())
      .then((data) => {
        // If using the old API that returns basic records, details will be fetched on-demand
        // If using the new API that returns full details, they'll be used immediately
        setEmails(data);
        setLoading(false);
      });
  }, [applicationId]);

  if (loading) {
    return <div>Loading email history...</div>;
  }

  return <EmailHistory emails={emails} policyId={0} />;
}

/**
 * Performance Comparison:
 *
 * 1. Dynamic Loading (New Approach):
 *    - Pros: Fast initial load, only fetches details when needed
 *    - Cons: Slight delay when expanding emails
 *    - Best for: Large email lists, mobile users, bandwidth-conscious scenarios
 *
 * 2. Pre-loaded Details (Traditional):
 *    - Pros: Instant content display when expanded
 *    - Cons: Slower initial load, more API calls upfront
 *    - Best for: Small email lists, desktop users, when immediate access is important
 */
