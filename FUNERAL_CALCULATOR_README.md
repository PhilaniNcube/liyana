# Funeral Cover Calculator

## Overview

The Funeral Cover Calculator has been updated to correctly handle the pricing structure for funeral insurance policies. The calculator automatically determines the appropriate benefit option based on the family composition and calculates premiums accordingly.

## Key Features

- **Automatic Benefit Option Selection**: The calculator automatically selects the correct benefit option based on family composition
- **Relationship-Based Pricing**: Different pricing for immediate family members vs. extended family members
- **Detailed Breakdown**: Provides comprehensive breakdown of premiums by family member type
- **Flexible Family Structures**: Supports various family configurations including polygamous families

## Age Requirements and Pricing Logic

### Immediate Family (Spouse and Children)
- **Age is optional** - Does not affect pricing
- Covered under the main policy regardless of age
- Up to **6 children maximum** can be covered
- All immediate family members share the same premium rate based on main member's age

### Extended Family Members
- **Age is required** - Directly affects pricing
- Charged separately using "Extended family" rate table
- Each extended family member has their own premium based on their age
- All extended family members get the same cover amount

### Main Member
- Age determines the rate category for the main policy
- Main member's age affects the premium for all immediate family members

The calculator handles the following benefit options:

1. **Main Member Only** - Single person coverage
2. **Main Member and Spouse** - Covers main member and one spouse
3. **Main Member and up to 6 Children** - Covers main member and children
4. **Main Member, Spouse and up to 6 Children** - Full family coverage
5. **Main Member and 2 Spouses** - For polygamous families
6. **Main Member, 2 Spouses and up to 6 Children** - Extended polygamous family
7. **Extended Family** - Additional coverage for extended family members (charged separately)

## Usage

### Basic Setup

```typescript
import FuneralCoverCalculator, { type ICalculationParams } from './lib/utils/funeralcover-calculator';

// Initialize with rate data from your pricing table
const calculator = new FuneralCoverCalculator(rateData);
```

### Relationship Types

The calculator supports three relationship types:

- `'spouse'` - Immediate family (spouse/partner)
- `'child'` - Immediate family (children)
- `'extended'` - Extended family members (grandparents, siblings, etc.)

### Simple Example - Main Member Only

```typescript
const result = calculator.calculateTotalPremium({
  mainMemberAge: 35,
  coverAmount: 50000  // Single cover amount for all members
});

// Result: Uses "Main Member Only" benefit option
// Premium calculated as: (50000 / 1000) * 2.10 = R105.00
```

### Family Example - Main Member + Spouse + Children

```typescript
const result = calculator.calculateTotalPremium({
  mainMemberAge: 35,
  coverAmount: 50000,  // Same R50,000 cover for all family members
  additionalMembers: [
    { relationship: 'spouse' },   // Age not needed for immediate family
    { relationship: 'child' },    // Age not needed - up to 6 children allowed
    { relationship: 'child' }     // Age not needed
  ]
});

// Result: Uses "Main Member, Spouse and up to 6 Children" benefit option
// All family members get R50,000 cover under one premium rate
```

### Extended Family Example

```typescript
const result = calculator.calculateTotalPremium({
  mainMemberAge: 35,
  coverAmount: 50000,  // Same R50,000 cover for all
  additionalMembers: [
    { relationship: 'spouse' },                    // Age not needed
    { relationship: 'child' },                     // Age not needed
    { age: 70, relationship: 'extended' }          // Age REQUIRED for extended family
  ]
});

// Result: 
// - Main policy covers main member, spouse, and child (all R50,000 each)
// - Extended family member (grandmother) charged separately based on her age (70)
```

## API Reference

### `ICalculationParams`

```typescript
interface ICalculationParams {
  mainMemberAge: number;
  coverAmount: number;                 // Single cover amount for all members
  additionalMembers?: IAdditionalFamilyMember[];
}
```

### `IAdditionalFamilyMember`

```typescript
interface IAdditionalFamilyMember {
  age?: number;                        // Optional - only required for extended family
  relationship: 'spouse' | 'child' | 'extended';
  
  // Notes:
  // - Spouse and children: age is optional (doesn't affect pricing)
  // - Extended family: age is required (affects pricing)
  // - Maximum 6 children allowed under main policy
}
```

### `calculateTotalPremium()` Return Value

```typescript
{
  mainPolicyPremium: number;           // Premium for main policy (covers immediate family)
  extendedFamilyPremium: number;       // Premium for extended family members
  totalPremium: number;                // Total monthly premium
  benefitOptionUsed: string;           // Which benefit option was selected
  breakdown: {
    mainMember: {
      age: number;
      coverAmount: number;
      premium: number;
    };
    immediateFamily: Array<{
      relationship: string;
      age: number;
      coverAmount: number;
      premium: number;                 // Always 0 (included in main policy)
    }>;
    extendedFamily: Array<{
      age: number;
      coverAmount: number;
      premium: number;                 // Individual premium for extended member
    }>;
  }
}
```

## Rate Data Format

The calculator expects rate data in the following format:

```typescript
interface IRateEntry {
  benefitOption: string;  // e.g., "Main Member Only"
  ageBand: string;        // e.g., "(18 - 65)"
  rate: number;           // Rate per R1000 of cover
}
```

## How Benefit Option Selection Works

The calculator automatically selects the appropriate benefit option based on the family composition:

1. **No additional members**: "Main Member Only"
2. **Spouse only**: "Main Member and Spouse"
3. **Children only**: "Main Member and up to 6 Children"
4. **Spouse + Children**: "Main Member, Spouse and up to 6 Children"
5. **Multiple spouses**: "Main Member and 2 Spouses" or "Main Member, 2 Spouses and up to 6 Children"

Extended family members are always charged separately using the "Extended family" rates.

## Error Handling

The calculator will throw descriptive errors for:

- Invalid age bands in rate data
- Missing benefit options
- Ages outside available ranges
- Malformed input data

## Testing

Run the example file to see the calculator in action:

```bash
npx tsx example-funeral-calculator.ts
```
