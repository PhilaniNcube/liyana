// Test script for the application email API endpoint
// Run this in your browser console or as a Node.js script

const testEmailAPI = async () => {
  const testData = {
    applicationId: 1, // Replace with a valid application ID
    message:
      "Your loan application has been approved! Congratulations on taking this important step towards achieving your financial goals. Our team will be in touch with you soon to finalize the details.",
    subject: "Great News - Your Loan Application Has Been Approved!",
  };

  try {
    const response = await fetch("/api/emails/application", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    console.log("Response:", result);

    if (response.ok) {
      console.log("✅ Email sent successfully!");
      console.log("Email ID:", result.emailId);
      console.log("Recipient:", result.recipient);
    } else {
      console.log("❌ Error:", result.error);
      if (result.details) {
        console.log("Details:", result.details);
      }
    }
  } catch (error) {
    console.error("❌ Network error:", error);
  }
};

// Uncomment the line below to run the test
// testEmailAPI();

export { testEmailAPI };
