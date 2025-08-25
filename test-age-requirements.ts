import FuneralCoverCalculator, { type ICalculationParams } from './lib/utils/funeralcover-calculator';

// Sample rate data with extended family rates
const rateData = [
  // Main Member Only
  { benefitOption: "Main Member Only", ageBand: "(18 - 65)", rate: 2.10 },
  { benefitOption: "Main Member Only", ageBand: "(66 - 75)", rate: 5.75 },
  
  // Main Member, Spouse and up to 6 Children
  { benefitOption: "Main Member, Spouse and up to 6 Children", ageBand: "(18 - 65)", rate: 5.03 },
  { benefitOption: "Main Member, Spouse and up to 6 Children", ageBand: "(66 - 75)", rate: 13.82 },
  
  // Extended family rates (age-dependent)
  { benefitOption: "Extended family", ageBand: "(0 - 17)", rate: 0.47 },
  { benefitOption: "Extended family", ageBand: "(18 - 65)", rate: 2.30 },
  { benefitOption: "Extended family", ageBand: "(66 - 75)", rate: 7.48 },
  { benefitOption: "Extended family", ageBand: "(76 - 80)", rate: 19.68 }
];

const calculator = new FuneralCoverCalculator(rateData);

console.log("=== Age Requirements Demonstration ===\n");

// Test 1: Show that children ages don't matter
console.log("1. Children ages don't affect pricing:");
const familyWithYoungChildren: ICalculationParams = {
  mainMemberAge: 35,
  coverAmount: 50000,
  additionalMembers: [
    { relationship: 'spouse' },  // No age needed
    { relationship: 'child' },   // No age needed
    { relationship: 'child' },   // No age needed
    { relationship: 'child' }    // No age needed
  ]
};

const result1 = calculator.calculateTotalPremium(familyWithYoungChildren);
console.log("Family with young children (ages not specified):");
console.log("Premium:", result1.totalPremium);
console.log("Benefit Option:", result1.benefitOptionUsed);

// Test 2: Show extended family age requirement
console.log("\n2. Extended family ages DO matter:");
const familyWithExtended: ICalculationParams = {
  mainMemberAge: 35,
  coverAmount: 50000,
  additionalMembers: [
    { relationship: 'spouse' },
    { relationship: 'child' },
    { age: 15, relationship: 'extended' },  // Young extended family
    { age: 70, relationship: 'extended' }   // Elderly extended family
  ]
};

const result2 = calculator.calculateTotalPremium(familyWithExtended);
console.log("Family with extended members (15 and 70 years old):");
console.log("Main Policy Premium:", result2.mainPolicyPremium);
console.log("Extended Family Premium:", result2.extendedFamilyPremium);
console.log("Total Premium:", result2.totalPremium);
console.log("Extended Family Breakdown:");
result2.breakdown.extendedFamily.forEach((member, index) => {
  console.log(`  Age ${member.age}: R${member.premium} per month`);
});

// Test 3: Show maximum children validation
console.log("\n3. Maximum children validation:");
try {
  const tooManyChildren: ICalculationParams = {
    mainMemberAge: 35,
    coverAmount: 50000,
    additionalMembers: [
      { relationship: 'child' },
      { relationship: 'child' },
      { relationship: 'child' },
      { relationship: 'child' },
      { relationship: 'child' },
      { relationship: 'child' },
      { relationship: 'child' }  // 7th child - should fail
    ]
  };
  
  calculator.calculateTotalPremium(tooManyChildren);
} catch (error) {
  console.log("Error with 7 children:", (error as Error).message);
}

// Test 4: Show extended family without age requirement
console.log("\n4. Extended family without age:");
try {
  const extendedWithoutAge: ICalculationParams = {
    mainMemberAge: 35,
    coverAmount: 50000,
    additionalMembers: [
      { relationship: 'extended' }  // No age specified - should fail
    ]
  };
  
  calculator.calculateTotalPremium(extendedWithoutAge);
} catch (error) {
  console.log("Error with extended family without age:", (error as Error).message);
}

console.log("\n=== Summary ===");
console.log("✓ Immediate family (spouse, children): Age optional, covered under main policy");
console.log("✓ Extended family: Age required, charged separately based on age");
console.log("✓ Maximum 6 children allowed under main policy");
console.log("✓ All family members get the same cover amount");
