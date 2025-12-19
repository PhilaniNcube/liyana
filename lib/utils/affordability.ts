// Calculate minimum norms based on income bands
// These values represent the minimum living expenses required by law (NCA)
export const calculateMinimumNorms = (grossIncome: number) => {
  if (grossIncome <= 800) {
    return { fixedFactor: 0, percentageAbove: 0, threshold: 0 };
  } else if (grossIncome <= 6250) {
    return { fixedFactor: 800, percentageAbove: 0, threshold: 0 };
  } else if (grossIncome <= 25000) {
    return { fixedFactor: 1167.88, percentageAbove: 0, threshold: 0 };
  } else if (grossIncome <= 50000) {
    return { fixedFactor: 2855.38, percentageAbove: 0.082, threshold: 25000 };
  } else {
    // For income > 50000
    return { fixedFactor: 4905.38, percentageAbove: 0, threshold: 0 };
  }
};

export const calculateMinimumExpenses = (grossIncome: number): number => {
  const norms = calculateMinimumNorms(grossIncome);
  let minimumExpenses = norms.fixedFactor;
  
  if (norms.percentageAbove > 0 && grossIncome > norms.threshold) {
    minimumExpenses += (grossIncome - norms.threshold) * norms.percentageAbove;
  }
  
  return minimumExpenses;
};
