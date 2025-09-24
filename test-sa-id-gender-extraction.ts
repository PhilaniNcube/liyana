/**
 * Test file to verify SA ID gender extraction functionality
 */

import { extractGenderFromSAID } from "@/lib/utils/sa-id";

console.log("🧪 Testing SA ID Gender Extraction...\n");

// Test cases: Array of [ID Number, Expected Gender, Description]
const testCases = [
  ["8001015009183", "F", "Female - 7th digit is 0 (0-4 = Female)"],
  ["8001014009183", "F", "Female - 7th digit is 4 (0-4 = Female)"],
  ["8001015509183", "M", "Male - 7th digit is 5 (5-9 = Male)"],
  ["8001019009183", "M", "Male - 7th digit is 9 (5-9 = Male)"],
  ["9501032523082", "M", "Male - Real example with 7th digit 5"],
  ["9501031523082", "F", "Female - Real example with 7th digit 1"],
  ["invalid", null, "Invalid ID - too short"],
  ["800101500918a", null, "Invalid ID - contains letters"],
  ["", null, "Invalid ID - empty string"],
];

let passedTests = 0;
let failedTests = 0;

testCases.forEach(([idNumber, expected, description], index) => {
  const result = extractGenderFromSAID(idNumber as string);
  const passed = result === expected;
  
  console.log(`Test ${index + 1}: ${description}`);
  console.log(`  ID: ${idNumber}`);
  console.log(`  Expected: ${expected}, Got: ${result}`);
  console.log(`  Status: ${passed ? "✅ PASS" : "❌ FAIL"}`);
  console.log("");
  
  if (passed) {
    passedTests++;
  } else {
    failedTests++;
  }
});

console.log(`\n📊 Test Results:`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`📈 Success Rate: ${((passedTests / testCases.length) * 100).toFixed(1)}%`);

if (failedTests === 0) {
  console.log("\n🎉 All tests passed! SA ID gender extraction is working correctly.");
} else {
  console.log("\n⚠️  Some tests failed. Please review the implementation.");
}