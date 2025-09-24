// Test file for Max Money Create Loan Application API endpoint
// This demonstrates how to use the create_loan_application endpoint

const testCreateLoanApplication = async () => {
  const testPayload = {
    application_id: 12345,
    client_number: "CLT123456", // This should be the client_number returned from create_client
    loan_product_id: 1, // Retrieved from loan_product_list endpoint
    cashbox_id: 1, // The cashbox you're logged into
    loan_purpose_id: 1, // Retrieved from loan_purpose_list endpoint (for NCR and SACRRA reporting)
    no_of_instalment: 12, // Number of loan installments
    loan_amount: 5000, // Total amount of the loan in ZAR
  };

  try {
    const response = await fetch("/api/max_money/create_loan_application", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("Loan application created successfully:", data);
      console.log("Loan ID:", data.loan_id);
      console.log("Loan Number:", data.loan_no);

      if (data.summary_data) {
        console.log("Loan Summary:");
        console.log("- Loan Amount:", data.summary_data.loan_amount);
        console.log("- Interest:", data.summary_data.interest);
        console.log("- Total Repayable:", data.summary_data.total_repayable);
        console.log("- Fees:", data.summary_data.fees);
        console.log(
          "- Instalment Amount:",
          data.summary_data.instalment_amount
        );
        console.log(
          "- Number of Instalments:",
          data.summary_data.no_of_instalments
        );
      }
    } else {
      console.error("Failed to create loan application:", data);
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

// Example of required data flow:
// 1. First create a client using /api/max_money/create_client
// 2. Get the client_number from the response
// 3. Get loan_product_id from loan_product_list
// 4. Get loan_purpose_id from loan_purpose_list
// 5. Then call this endpoint with the loan application data

export { testCreateLoanApplication };
