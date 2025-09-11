/**
 * Test file demonstrating the affordability calculation
 * Run this to see how the calculation works with your sample data
 */

import { calculateAffordability, formatAffordabilityCalculation } from './lib/utils/affordability-calculator';

// Sample data based on your requirements
const sampleAffordabilityData = {
  "income": [
    {"type": "Bonus", "amount": 0},
    {"type": "Rental Income", "amount": 0},
    {"type": "Business Income", "amount": 0},
    {"type": "Maintenance/spousal support", "amount": 0},
    {"type": "Other", "amount": 0}
  ],
  "expenses": [
    {"type": "Levies", "amount": 200},
    {"type": "Municipal rates and taxes", "amount": 0},
    {"type": "Car repayment", "amount": 500},
    {"type": "Mortgage", "amount": 0},
    {"type": "Rent", "amount": 300},
    {"type": "DSTV", "amount": 200},
    {"type": "School fees", "amount": 0},
    {"type": "Groceries", "amount": 0},
    {"type": "Fuel", "amount": 0},
    {"type": "Airtime/Cellphone contract", "amount": 0},
    {"type": "Medical Expenses", "amount": 0},
    {"type": "Insurance", "amount": 0},
    {"type": "Uniform", "amount": 0},
    {"type": "Domestic services", "amount": 0},
    {"type": "Other", "amount": 0}
  ],
  "deductions": [
    {"type": "PAYE", "amount": 100},
    {"type": "UIF", "amount": 0},
    {"type": "SDL", "amount": 0},
    {"type": "Other", "amount": 200}
  ]
};

// Sample monthly income from application
const sampleMonthlyIncome = 25000;

console.log('=== AFFORDABILITY CALCULATION TEST ===\n');

// Test the calculation
const result = calculateAffordability(sampleMonthlyIncome, sampleAffordabilityData);
const formatted = formatAffordabilityCalculation(result);

console.log('Input Data:');
console.log('- Monthly Income:', sampleMonthlyIncome);
console.log('- Affordability Data:', JSON.stringify(sampleAffordabilityData, null, 2));

console.log('\n=== CALCULATION RESULTS ===');
console.log('Raw Numbers:');
console.log('- Monthly Income:', result.monthlyIncome);
console.log('- Additional Income:', result.additionalIncome);
console.log('- Total Gross Income:', result.totalGrossIncome);
console.log('- Total Deductions:', result.totalDeductions);
console.log('- Total Expenses:', result.totalExpenses);
console.log('- Net Income (after deductions):', result.netIncome);
console.log('- Disposable Income (final):', result.disposableIncome);

console.log('\nFormatted for Display:');
console.log('- Monthly Income:', formatted.monthlyIncome);
console.log('- Additional Income:', formatted.additionalIncome);
console.log('- Total Gross Income:', formatted.totalGrossIncome);
console.log('- Total Deductions:', formatted.totalDeductions);
console.log('- Total Expenses:', formatted.totalExpenses);
console.log('- Net Income:', formatted.netIncome);
console.log('- Disposable Income:', formatted.disposableIncome);

console.log('\n=== BREAKDOWN ===');
console.log('Formula: (Monthly Income + Additional Income) - Deductions - Expenses');
console.log(`Calculation: (${result.monthlyIncome} + ${result.additionalIncome}) - ${result.totalDeductions} - ${result.totalExpenses} = ${result.disposableIncome}`);

// Test with additional income
console.log('\n=== TEST WITH ADDITIONAL INCOME ===');
const dataWithIncome = {
  ...sampleAffordabilityData,
  "income": [
    {"type": "Bonus", "amount": 2000},
    {"type": "Rental Income", "amount": 1500},
    {"type": "Business Income", "amount": 0},
    {"type": "Maintenance/spousal support", "amount": 0},
    {"type": "Other", "amount": 500}
  ]
};

const resultWithIncome = calculateAffordability(sampleMonthlyIncome, dataWithIncome);
const formattedWithIncome = formatAffordabilityCalculation(resultWithIncome);

console.log('With Additional Income:');
console.log('- Total Gross Income:', formattedWithIncome.totalGrossIncome);
console.log('- Disposable Income:', formattedWithIncome.disposableIncome);
console.log(`Calculation: (${resultWithIncome.monthlyIncome} + ${resultWithIncome.additionalIncome}) - ${resultWithIncome.totalDeductions} - ${resultWithIncome.totalExpenses} = ${resultWithIncome.disposableIncome}`);

export { result, formatted, resultWithIncome, formattedWithIncome };
