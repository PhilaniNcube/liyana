import FuneralCoverCalculator, { type ICalculationParams, type IAdditionalFamilyMember } from './lib/utils/funeralcover-calculator';

// Sample rate data based on the provided table (partial for demonstration)
const rateData = [
  // Main Member Only
  { benefitOption: "Main Member Only", ageBand: "(18 - 65)", rate: 2.10 },
  { benefitOption: "Main Member Only", ageBand: "(66 - 75)", rate: 5.75 },
  { benefitOption: "Main Member Only", ageBand: "(76 - 80)", rate: 14.07 },
  
  // Main Member and Spouse
  { benefitOption: "Main Member and Spouse", ageBand: "(18 - 65)", rate: 3.35 },
  { benefitOption: "Main Member and Spouse", ageBand: "(66 - 75)", rate: 9.22 },
  { benefitOption: "Main Member and Spouse", ageBand: "(76 - 80)", rate: 22.50 },
  
  // Main Member and up to 6 Children
  { benefitOption: "Main Member and up to 6 Children", ageBand: "(18 - 65)", rate: 3.15 },
  { benefitOption: "Main Member and up to 6 Children", ageBand: "(66 - 75)", rate: 8.63 },
  { benefitOption: "Main Member and up to 6 Children", ageBand: "(76 - 80)", rate: 21.10 },
  
  // Main Member, Spouse and up to 6 Children
  { benefitOption: "Main Member, Spouse and up to 6 Children", ageBand: "(18 - 65)", rate: 5.03 },
  { benefitOption: "Main Member, Spouse and up to 6 Children", ageBand: "(66 - 75)", rate: 13.82 },
  { benefitOption: "Main Member, Spouse and up to 6 Children", ageBand: "(76 - 80)", rate: 33.75 },
  
  // Extended family
  { benefitOption: "Extended family", ageBand: "(0 - 17)", rate: 0.47 },
  { benefitOption: "Extended family", ageBand: "(18 - 65)", rate: 2.30 },
  { benefitOption: "Extended family", ageBand: "(66 - 75)", rate: 7.48 },
  { benefitOption: "Extended family", ageBand: "(76 - 80)", rate: 19.68 }
];

// Initialize the calculator
const calculator = new FuneralCoverCalculator(rateData);

// Example 1: Main member only
console.log("=== Example 1: Main Member Only ===");
const example1: ICalculationParams = {
  mainMemberAge: 35,
  coverAmount: 50000
};

const result1 = calculator.calculateTotalPremium(example1);
console.log("Premium:", result1.totalPremium);
console.log("Benefit Option:", result1.benefitOptionUsed);
console.log("Breakdown:", JSON.stringify(result1.breakdown, null, 2));

// Example 2: Main member + spouse
console.log("\n=== Example 2: Main Member + Spouse ===");
const example2: ICalculationParams = {
  mainMemberAge: 35,
  coverAmount: 50000, // Same cover amount for both
  additionalMembers: [
    { relationship: 'spouse' } // Age not needed for immediate family
  ]
};

const result2 = calculator.calculateTotalPremium(example2);
console.log("Premium:", result2.totalPremium);
console.log("Benefit Option:", result2.benefitOptionUsed);
console.log("Breakdown:", JSON.stringify(result2.breakdown, null, 2));

// Example 3: Full family + extended member
console.log("\n=== Example 3: Full Family + Extended Member ===");
const example3: ICalculationParams = {
  mainMemberAge: 35,
  coverAmount: 50000, // Same cover amount for all
  additionalMembers: [
    { relationship: 'spouse' }, // Age not needed
    { relationship: 'child' },  // Age not needed
    { relationship: 'child' },  // Age not needed
    { age: 70, relationship: 'extended' } // Age required for extended family
  ]
};

const result3 = calculator.calculateTotalPremium(example3);
console.log("Premium:", result3.totalPremium);
console.log("Main Policy Premium:", result3.mainPolicyPremium);
console.log("Extended Family Premium:", result3.extendedFamilyPremium);
console.log("Benefit Option:", result3.benefitOptionUsed);
console.log("Breakdown:", JSON.stringify(result3.breakdown, null, 2));
