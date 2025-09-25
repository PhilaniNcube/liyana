// Test file demonstrating how to use the MaxMoney client search utilities
// Run this with: npm run test -- test-max-money-client-search.js

import {
  searchMaxMoneyClientByIdNumber,
  searchMaxMoneyClientByClientNumber,
} from "./lib/utils/max-money.js";

async function testMaxMoneyClientSearch() {
  try {
    console.log("Testing MaxMoney client search utilities...\n");

    // Test searching by ID number
    console.log("1. Testing search by ID number:");
    const testIdNumber = "9001010001088"; // Replace with a test ID number

    try {
      const searchByIdResult =
        await searchMaxMoneyClientByIdNumber(testIdNumber);
      console.log("✅ Search by ID number successful:");
      console.log("   - Return code:", searchByIdResult.return_code);
      console.log("   - Return reason:", searchByIdResult.return_reason);

      if (searchByIdResult.return_code === 0 && searchByIdResult.client_no) {
        console.log("   - Client found:", {
          client_no: searchByIdResult.client_no,
          client_name: searchByIdResult.client_name,
          client_surname: searchByIdResult.client_surname,
          client_id: searchByIdResult.client_id,
          cli_status: searchByIdResult.cli_status,
          employer_name: searchByIdResult.employer_name,
          budget_available_amount: searchByIdResult.budget_available_amount,
        });
      } else {
        console.log("   - No client found");
      }
    } catch (error) {
      console.log("❌ Search by ID number failed:", error.message);
    }

    console.log("\n2. Testing search by client number:");
    const testClientNumber = "12345"; // Replace with a test client number

    try {
      const searchByClientResult =
        await searchMaxMoneyClientByClientNumber(testClientNumber);
      console.log("✅ Search by client number successful:");
      console.log("   - Return code:", searchByClientResult.return_code);
      console.log("   - Return reason:", searchByClientResult.return_reason);

      if (
        searchByClientResult.return_code === 0 &&
        searchByClientResult.client_no
      ) {
        console.log("   - Client found:", {
          client_no: searchByClientResult.client_no,
          client_name: searchByClientResult.client_name,
          client_surname: searchByClientResult.client_surname,
          client_id: searchByClientResult.client_id,
          cli_status: searchByClientResult.cli_status,
          employer_name: searchByClientResult.employer_name,
          budget_available_amount: searchByClientResult.budget_available_amount,
        });
      } else {
        console.log("   - No client found");
      }
    } catch (error) {
      console.log("❌ Search by client number failed:", error.message);
    }

    console.log("\n3. Testing validation errors:");

    // Test empty ID number
    try {
      await searchMaxMoneyClientByIdNumber("");
      console.log("❌ Empty ID number should have failed");
    } catch (error) {
      console.log("✅ Empty ID number properly rejected:", error.message);
    }

    // Test empty client number
    try {
      await searchMaxMoneyClientByClientNumber("");
      console.log("❌ Empty client number should have failed");
    } catch (error) {
      console.log("✅ Empty client number properly rejected:", error.message);
    }

    console.log("\nTest completed!");
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
  }
}

// Run the test
testMaxMoneyClientSearch();
