/**
 * Test script for the dynamic email content fetching functionality
 *
 * This script tests the new EmailHistory component that can fetch
 * email content from the Resend API on-demand using individual resend IDs.
 */

const testDynamicEmailFetch = async () => {
  console.log("🧪 Testing Dynamic Email Content Fetching\n");

  // Test the individual email details API endpoint
  const testResendIds = [
    // Add actual resend IDs from your database here for testing
    "test-resend-id-1",
    "test-resend-id-2",
  ];

  for (const resendId of testResendIds) {
    console.log(`📧 Testing email details fetch for: ${resendId}`);

    try {
      const response = await fetch(`/api/emails/details/${resendId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok) {
        console.log(`✅ Successfully fetched email details:`);
        console.log(`  - Subject: ${result.subject}`);
        console.log(`  - From: ${result.from}`);
        console.log(
          `  - To: ${Array.isArray(result.to) ? result.to.join(", ") : result.to}`
        );
        console.log(`  - Status: ${result.last_event}`);
        console.log(
          `  - Content: ${result.html ? "HTML available" : result.text ? "Text available" : "No content"}`
        );
      } else {
        console.log(`❌ Error fetching email details:`, result.error);
        if (result.details) {
          console.log(`   Details:`, result.details);
        }
      }
    } catch (error) {
      console.error(`❌ Network error:`, error);
    }

    console.log(""); // Empty line for readability
  }

  // Test component behavior simulation
  console.log("🎭 Simulating EmailHistory component behavior:");
  console.log("1. Component loads with basic email records");
  console.log("2. User clicks to expand an email");
  console.log("3. Component fetches details on-demand");
  console.log("4. Details are cached for future expansions");
  console.log("5. Loading states are shown during fetch");

  console.log("\n📊 Performance Benefits:");
  console.log("✨ Faster initial page load");
  console.log("🎯 Fetch only needed email content");
  console.log("💾 Cache details to avoid re-fetching");
  console.log("📱 Better mobile experience");
  console.log("🔄 Graceful error handling with retry");
};

// Function to test with real data from your database
const testWithRealData = async (entityType, entityId) => {
  console.log(`\n🔍 Testing with real ${entityType} data (ID: ${entityId})`);

  try {
    // First, get basic email records
    const historyResponse = await fetch(
      `/api/emails/history?${entityType}Id=${entityId}`
    );
    const emails = await historyResponse.json();

    if (historyResponse.ok && emails.length > 0) {
      console.log(
        `📋 Found ${emails.length} emails for ${entityType} ${entityId}`
      );

      // Test fetching details for the first email
      const firstEmail = emails[0];
      console.log(`🎯 Testing detail fetch for email: ${firstEmail.resend_id}`);

      const detailResponse = await fetch(
        `/api/emails/details/${firstEmail.resend_id}`
      );
      const details = await detailResponse.json();

      if (detailResponse.ok) {
        console.log(`✅ Successfully fetched details on-demand`);
        console.log(`  - Subject: ${details.subject}`);
        console.log(`  - Dynamic fetch working correctly!`);
      } else {
        console.log(`❌ Failed to fetch details:`, details.error);
      }
    } else {
      console.log(`ℹ️ No emails found for ${entityType} ${entityId}`);
    }
  } catch (error) {
    console.error(`❌ Error testing with real data:`, error);
  }
};

// Usage examples:
// testDynamicEmailFetch();
// testWithRealData('application', 1);
// testWithRealData('loan', 1);
// testWithRealData('policy', 1);

export { testDynamicEmailFetch, testWithRealData };
