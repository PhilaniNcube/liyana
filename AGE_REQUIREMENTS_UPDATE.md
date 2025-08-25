# Funeral Cover Calculator - Age Requirements Update

## Key Insight: Age Matters Only for Extended Family

The calculator has been updated to correctly reflect that **age only matters for extended family members**, not for immediate family (spouse and children).

## Updated Age Logic

### ✅ Immediate Family (Spouse & Children)
- **Age is optional** - can be omitted entirely
- Covered under main policy regardless of age
- Up to **6 children maximum** allowed
- All use the same rate based on main member's age
- Premium calculated once for the entire immediate family

### ✅ Extended Family Members  
- **Age is required** - must be specified
- Charged separately using "Extended family" rate table
- Each member's premium depends on their individual age
- Different age bands have different rates

## Example Usage

```typescript
const result = calculator.calculateTotalPremium({
  mainMemberAge: 35,
  coverAmount: 50000,
  additionalMembers: [
    { relationship: 'spouse' },                    // ✅ No age needed
    { relationship: 'child' },                     // ✅ No age needed  
    { relationship: 'child' },                     // ✅ No age needed
    { age: 70, relationship: 'extended' },         // ✅ Age required
    { age: 15, relationship: 'extended' }          // ✅ Age required
  ]
});
```

## Validation Rules

1. **Maximum 6 children** under main policy
2. **Extended family must have age** specified
3. **All members get same cover amount**
4. **Main member age determines immediate family rate**

## Test Results

From our comprehensive test:

- **Immediate family (4 people)**: R251.50/month (regardless of ages)
- **Extended family (age 15)**: R23.50/month  
- **Extended family (age 70)**: R374/month
- **Total premium**: R649/month

This demonstrates that:
- Children and spouse pricing is **age-independent**
- Extended family pricing is **age-dependent**
- Each extended family member is charged individually

## Error Handling

The calculator now properly validates:
- ❌ More than 6 children: "Maximum of 6 children can be covered under the main policy"
- ❌ Extended family without age: "Age is required for all extended family members"

This update makes the calculator much more accurate to how funeral insurance actually works!
