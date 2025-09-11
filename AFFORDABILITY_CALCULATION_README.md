# Affordability Calculation System

## Overview

This system calculates the net disposable income based on the application's monthly income and affordability data structure. The calculation follows this formula:

```
Disposable Income = (Monthly Income + Additional Income) - Deductions - Expenses
```

## Files Created

1. **`lib/utils/affordability-calculator.ts`** - Core calculation utility functions
2. **`components/enhanced-affordability-view.tsx`** - React component for displaying affordability
3. **`test-affordability-calculation.ts`** - Test file with sample data
4. **`examples/affordability-integration-example.tsx`** - Integration examples

## Usage

### Basic Calculation

```typescript
import { calculateAffordability } from '@/lib/utils/affordability-calculator';

const monthlyIncome = 25000;
const affordabilityData = {
  "income": [
    {"type": "Bonus", "amount": 2000},
    {"type": "Rental Income", "amount": 1500}
  ],
  "expenses": [
    {"type": "Rent", "amount": 5000},
    {"type": "Car repayment", "amount": 3000}
  ],
  "deductions": [
    {"type": "PAYE", "amount": 4000},
    {"type": "UIF", "amount": 250}
  ]
};

const result = calculateAffordability(monthlyIncome, affordabilityData);
console.log(result.disposableIncome); // Final disposable income
```

### React Component Usage

```tsx
import { EnhancedAffordabilityView } from '@/components/enhanced-affordability-view';

export function MyComponent({ application }) {
  return (
    <EnhancedAffordabilityView
      monthlyIncome={application.monthly_income || 0}
      affordabilityData={application.affordability}
      showBreakdown={true}
    />
  );
}
```

## Affordability Data Structure

The affordability data should follow this structure:

```json
{
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
}
```

## Calculation Breakdown

Given the sample data above with a monthly income of 25,000:

1. **Monthly Income**: R25,000
2. **Additional Income**: R0 (from affordability.income)
3. **Total Gross Income**: R25,000
4. **Total Deductions**: R300 (PAYE: R100 + Other: R200)
5. **Net Income**: R24,700 (R25,000 - R300)
6. **Total Expenses**: R1,200 (Levies: R200 + Car: R500 + Rent: R300 + DSTV: R200)
7. **Disposable Income**: R23,500 (R24,700 - R1,200)

## Integration with Existing Code

The system has been integrated with the existing `AdditionalInfoCard` component to ensure consistency. The calculation utility can be used anywhere in the application where affordability calculations are needed.

## Testing

Run the test file to see the calculation in action:

```bash
# In your development environment
node test-affordability-calculation.ts
```

This will output the complete calculation breakdown with your sample data.

## Features

- **Consistent Calculations**: All affordability calculations use the same utility
- **Type Safety**: Full TypeScript support with proper interfaces
- **Currency Formatting**: South African Rand formatting
- **Flexible Display**: Component can show detailed breakdowns or summary only
- **Status Indicators**: Visual indicators for affordability health
- **Raw Data Access**: Debug view for development

## Future Enhancements

- Add minimum affordability thresholds
- Include affordability scoring/rating system
- Add export functionality for affordability reports
- Integration with loan approval workflows
