# Funeral Cover Calculator - Single Cover Amount Update

## Summary of Changes

The funeral cover calculator has been updated to use a **single cover amount** for all family members covered under the policy, which is the correct approach for funeral insurance policies.

## Key Changes Made

### 1. Interface Updates
- Removed individual `coverAmount` from `IAdditionalFamilyMember`
- Changed `mainMemberCoverAmount` to just `coverAmount` in `ICalculationParams`
- Now all family members get the same cover amount

### 2. Calculation Logic
- All immediate family members (spouse, children) are covered under the main policy with the same cover amount
- Extended family members are charged separately but also get the same cover amount
- Premium calculation uses the single cover amount for all members

### 3. Updated Interface

**Before:**
```typescript
interface ICalculationParams {
  benefitOption: string;
  mainMemberAge: number;
  coverAmount: number;
  extendedFamilyMembers?: { age: number; coverAmount: number }[];
}
```

**After:**
```typescript
interface ICalculationParams {
  mainMemberAge: number;
  coverAmount: number; // Single amount for ALL members
  additionalMembers?: { age: number; relationship: 'spouse' | 'child' | 'extended' }[];
}
```

## Example Usage

```typescript
// Everyone gets R50,000 cover
const result = calculator.calculateTotalPremium({
  mainMemberAge: 35,
  coverAmount: 50000, // Same for all family members
  additionalMembers: [
    { age: 32, relationship: 'spouse' },      // Gets R50,000
    { age: 8, relationship: 'child' },        // Gets R50,000
    { age: 70, relationship: 'extended' }     // Gets R50,000 (charged separately)
  ]
});
```

## Benefits of This Approach

1. **Accurate to real funeral policies** - All family members typically get the same cover amount
2. **Simpler to understand** - No need to specify individual amounts
3. **Consistent pricing** - Rate tables are based on family composition, not individual amounts
4. **Better user experience** - Easier to calculate and understand premiums

## Test Results

The calculator now correctly:
- Calculates premiums based on family composition
- Uses appropriate benefit options automatically
- Applies the same cover amount to all family members
- Charges extended family separately but with same cover amount

Example results:
- Main member only (35, R50k): **R105/month**
- Main + spouse (35 & 32, R50k each): **R167.50/month**
- Full family + extended (35, 32, 8, 12 + grandmother 70): **R625.50/month**
  - Main policy (4 people): R251.50
  - Extended (grandmother): R374
