// Test script for the funeral policy email server action
// This can be used to test the sendFuneralPolicyDetailsEmail function

/**
 * Example usage in a React component or API endpoint:
 *
 * import { sendFuneralPolicyDetailsEmail } from '@/lib/actions/funeral-policy';
 *
 * // To send an email for a specific funeral policy (without attachments)
 * const handleSendEmail = async (policyId) => {
 *   const result = await sendFuneralPolicyDetailsEmail(policyId);
 *
 *   if (result.error) {
 *     console.error('Failed to send email:', result.message);
 *     if (result.details) {
 *       console.error('Details:', result.details);
 *     }
 *   } else {
 *     console.log('Email sent successfully!');
 *     console.log('Recipient:', result.recipient);
 *     console.log('Email ID:', result.emailId);
 *   }
 * };
 *
 * // To send an email with attachments (admin/editor only)
 * const handleSendEmailWithAttachments = async (policyId, attachments) => {
 *   const result = await sendFuneralPolicyDetailsEmail(policyId, attachments);
 *   // Handle result...
 * };
 *
 * // Example: Send email for policy ID 1
 * handleSendEmail(1);
 *
 * // Example with attachments:
 * const attachments = [
 *   {
 *     filename: "policy-document.pdf",
 *     data: "base64-encoded-content-here",
 *     content_type: "application/pdf"
 *   }
 * ];
 * handleSendEmailWithAttachments(1, attachments);
 */

// For testing in a browser console (if you have the environment set up):
const testFuneralPolicyEmail = async (policyId, attachments = []) => {
  try {
    // Note: This would need to be called from within your Next.js app context
    const response = await fetch("/api/test-funeral-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ policyId, attachments }),
    });

    const result = await response.json();

    if (result.error) {
      console.error("❌ Failed to send funeral policy email:", result.message);
      if (result.details) {
        console.error("Details:", result.details);
      }
    } else {
      console.log("✅ Funeral policy email sent successfully!");
      console.log("📧 Recipient:", result.recipient);
      console.log("📧 Email ID:", result.emailId);
      if (attachments.length > 0) {
        console.log(`📎 Sent with ${attachments.length} attachment(s)`);
      }
    }
  } catch (error) {
    console.error("❌ Error testing funeral policy email:", error);
  }
};

// Helper function to create a test attachment (for demo purposes)
const createTestAttachment = () => {
  // This is a minimal PDF in base64 (just for testing)
  const testPdfBase64 =
    "JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSA4IFRmCjUwIDc1MCBUZAooVGVzdCBQREYgRG9jdW1lbnQpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAowMDAwMDAwMjQ1IDAwMDAwIG4gCjAwMDAwMDAzMTMgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0MDUKJSVFT0Y=";

  return {
    filename: "test-document.pdf",
    data: testPdfBase64,
    content_type: "application/pdf",
  };
};

// Example usage:
// testFuneralPolicyEmail(1); // Without attachments
// testFuneralPolicyEmail(1, [createTestAttachment()]); // With test attachment

console.log(
  "Test script loaded. Use testFuneralPolicyEmail(policyId, attachments) to test the email functionality."
);
console.log("Functions available:");
console.log(
  "- testFuneralPolicyEmail(policyId) - Send email without attachments"
);
console.log(
  "- testFuneralPolicyEmail(policyId, attachments) - Send email with attachments"
);
console.log("- createTestAttachment() - Create a test PDF attachment");
console.log("");
console.log("Make sure to:");
console.log("1. Set the LINAR_EMAIL_ADDRESS environment variable");
console.log("2. Ensure RESEND_API_KEY is configured");
console.log("3. Have a valid funeral policy in your database");
console.log("4. Have admin/editor role to send attachments");
