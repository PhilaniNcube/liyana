/**
 * Test script to verify email content fetching from Resend API
 *
 * This script tests the new email fetching functionality that uses
 * email.resend_id to get email content from the Resend API.
 *
 * To run this test:
 * 1. Make sure you have a valid email in your resend_emails table
 * 2. Update the applicationId, loanId, or policyId below with a valid ID
 * 3. Run the test in your browser console or as a Node.js script
 */

const testEmailContentFetch = async () => {
  // Test data - update these with valid IDs from your database
  const testCases = [{ applicationId: 1 }, { loanId: 1 }, { policyId: 1 }];

  for (const testCase of testCases) {
    console.log(`\n🧪 Testing email history for:`, testCase);

    try {
      const params = new URLSearchParams(testCase);
      const response = await fetch(`/api/emails/history?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok) {
        console.log(`✅ Successfully fetched ${result.length} emails`);

        result.forEach((email, index) => {
          console.log(`\n📧 Email ${index + 1}:`);
          console.log(`  - Resend ID: ${email.resend_id}`);
          console.log(`  - Created: ${email.created_at}`);

          if (email.details) {
            console.log(`  - Subject: ${email.details.subject}`);
            console.log(`  - From: ${email.details.from}`);
            console.log(
              `  - To: ${Array.isArray(email.details.to) ? email.details.to.join(", ") : email.details.to}`
            );
            console.log(`  - Status: ${email.details.last_event || "sent"}`);
            console.log(
              `  - Content: ${email.details.html ? "HTML available" : email.details.text ? "Text available" : "No content"}`
            );
          } else {
            console.log(
              `  - ⚠️ Details not available (Resend API fetch failed)`
            );
          }
        });
      } else {
        console.log(`❌ Error fetching emails:`, result.error);
        if (result.details) {
          console.log(`   Details:`, result.details);
        }
      }
    } catch (error) {
      console.error(`❌ Network error:`, error);
    }
  }
};

// Usage example for testing in browser console:
// testEmailContentFetch();

export { testEmailContentFetch };
