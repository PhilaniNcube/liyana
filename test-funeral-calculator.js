// Test file for the updated funeral cover calculator
// This demonstrates how to use the calculator with the new pricing structure

// Sample rate data based on the provided table
const rateData = [
  // Main Member Only
  { benefitOption: "Main Member Only", ageBand: "(18 - 65)", rate: 2.1 },
  { benefitOption: "Main Member Only", ageBand: "(66 - 75)", rate: 5.75 },
  { benefitOption: "Main Member Only", ageBand: "(76 - 80)", rate: 14.07 },
  { benefitOption: "Main Member Only", ageBand: "(81 - 85)", rate: 20.67 },
  { benefitOption: "Main Member Only", ageBand: "(86 - 90)", rate: 30.1 },
  { benefitOption: "Main Member Only", ageBand: "(91 - 95)", rate: 42.85 },
  { benefitOption: "Main Member Only", ageBand: "(96 - 100)", rate: 57.83 },

  // Main Member and Spouse
  { benefitOption: "Main Member and Spouse", ageBand: "(18 - 65)", rate: 3.35 },
  { benefitOption: "Main Member and Spouse", ageBand: "(66 - 75)", rate: 9.22 },
  { benefitOption: "Main Member and Spouse", ageBand: "(76 - 80)", rate: 22.5 },
  {
    benefitOption: "Main Member and Spouse",
    ageBand: "(81 - 85)",
    rate: 33.07,
  },
  {
    benefitOption: "Main Member and Spouse",
    ageBand: "(86 - 90)",
    rate: 48.15,
  },
  {
    benefitOption: "Main Member and Spouse",
    ageBand: "(91 - 95)",
    rate: 68.57,
  },
  {
    benefitOption: "Main Member and Spouse",
    ageBand: "(96 - 100)",
    rate: 92.52,
  },

  // Main Member and up to 6 Children
  {
    benefitOption: "Main Member and up to 6 Children",
    ageBand: "(18 - 65)",
    rate: 3.15,
  },
  {
    benefitOption: "Main Member and up to 6 Children",
    ageBand: "(66 - 75)",
    rate: 8.63,
  },
  {
    benefitOption: "Main Member and up to 6 Children",
    ageBand: "(76 - 80)",
    rate: 21.1,
  },
  {
    benefitOption: "Main Member and up to 6 Children",
    ageBand: "(81 - 85)",
    rate: 31.0,
  },
  {
    benefitOption: "Main Member and up to 6 Children",
    ageBand: "(86 - 90)",
    rate: 45.15,
  },
  {
    benefitOption: "Main Member and up to 6 Children",
    ageBand: "(91 - 95)",
    rate: 64.28,
  },
  {
    benefitOption: "Main Member and up to 6 Children",
    ageBand: "(96 - 100)",
    rate: 86.73,
  },

  // Main Member, Spouse and up to 6 Children
  {
    benefitOption: "Main Member, Spouse and up to 6 Children",
    ageBand: "(18 - 65)",
    rate: 5.03,
  },
  {
    benefitOption: "Main Member, Spouse and up to 6 Children",
    ageBand: "(66 - 75)",
    rate: 13.82,
  },
  {
    benefitOption: "Main Member, Spouse and up to 6 Children",
    ageBand: "(76 - 80)",
    rate: 33.75,
  },
  {
    benefitOption: "Main Member, Spouse and up to 6 Children",
    ageBand: "(81 - 85)",
    rate: 49.6,
  },
  {
    benefitOption: "Main Member, Spouse and up to 6 Children",
    ageBand: "(86 - 90)",
    rate: 72.23,
  },
  {
    benefitOption: "Main Member, Spouse and up to 6 Children",
    ageBand: "(91 - 95)",
    rate: 102.85,
  },
  {
    benefitOption: "Main Member, Spouse and up to 6 Children",
    ageBand: "(96 - 100)",
    rate: 138.78,
  },

  // Extended family
  { benefitOption: "Extended family", ageBand: "(0 - 17)", rate: 0.47 },
  { benefitOption: "Extended family", ageBand: "(18 - 65)", rate: 2.3 },
  { benefitOption: "Extended family", ageBand: "(66 - 75)", rate: 7.48 },
  { benefitOption: "Extended family", ageBand: "(76 - 80)", rate: 19.68 },
  { benefitOption: "Extended family", ageBand: "(81 - 85)", rate: 31.0 },
  { benefitOption: "Extended family", ageBand: "(86 - 90)", rate: 45.15 },
  { benefitOption: "Extended family", ageBand: "(91 - 95)", rate: 64.28 },
  { benefitOption: "Extended family", ageBand: "(96 - 100)", rate: 86.73 },
];

console.log("=== Funeral Cover Calculator Test ===\n");

// Test cases
const testCases = [
  {
    name: "Main member only (35 years old, R50,000 cover)",
    params: {
      mainMemberAge: 35,
      mainMemberCoverAmount: 50000,
      additionalMembers: [],
    },
  },
  {
    name: "Main member + spouse (35 & 32 years old, R50,000 each)",
    params: {
      mainMemberAge: 35,
      mainMemberCoverAmount: 50000,
      additionalMembers: [
        { age: 32, coverAmount: 50000, relationship: "spouse" },
      ],
    },
  },
  {
    name: "Main member + 2 children (35 years old + kids 8 & 12, R50,000 + R25,000 each)",
    params: {
      mainMemberAge: 35,
      mainMemberCoverAmount: 50000,
      additionalMembers: [
        { age: 8, coverAmount: 25000, relationship: "child" },
        { age: 12, coverAmount: 25000, relationship: "child" },
      ],
    },
  },
  {
    name: "Full family + extended (35 & 32 years + 2 kids + grandmother 70)",
    params: {
      mainMemberAge: 35,
      mainMemberCoverAmount: 50000,
      additionalMembers: [
        { age: 32, coverAmount: 50000, relationship: "spouse" },
        { age: 8, coverAmount: 25000, relationship: "child" },
        { age: 12, coverAmount: 25000, relationship: "child" },
        { age: 70, coverAmount: 30000, relationship: "extended" },
      ],
    },
  },
];

// Note: Since this is a JS file and the calculator is in TypeScript,
// you would normally import it properly. This is just for demonstration.
console.log("Rate data loaded with", rateData.length, "entries");
console.log("\nTest cases defined:");
testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.name}`);
});

console.log("\n=== How to use the calculator ===");
console.log(`
// Import the calculator
import FuneralCoverCalculator from './lib/utils/funeralcover-calculator';

// Initialize with rate data
const calculator = new FuneralCoverCalculator(rateData);

// Calculate premium
const result = calculator.calculateTotalPremium({
  mainMemberAge: 35,
  mainMemberCoverAmount: 50000,
  additionalMembers: [
    { age: 32, coverAmount: 50000, relationship: 'spouse' },
    { age: 8, coverAmount: 25000, relationship: 'child' },
    { age: 70, coverAmount: 30000, relationship: 'extended' }
  ]
});

console.log('Total Premium:', result.totalPremium);
console.log('Benefit Option Used:', result.benefitOptionUsed);
console.log('Breakdown:', result.breakdown);
`);
