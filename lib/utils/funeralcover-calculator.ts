import {
  FUNERAL_PACKAGES,
  getPackageById,
  getPackageByCoverAmount,
  type FuneralPackage,
  type FuneralPackageId,
  type FuneralPackageCover,
} from "../data/funeral-rates";

/**
 * Defines the main input for our premium lookup.
 * Now uses packageId to select a fixed package.
 */
interface ICalculationParams {
  packageId: FuneralPackageId;
}

/**
 * Result of looking up a funeral package premium.
 */
interface PremiumResult {
  packageId: FuneralPackageId;
  packageName: string;
  packageType: "family" | "single";
  monthlyPremium: number;
  cover: FuneralPackageCover;
}

/**
 * Looks up the premium and cover details for a given funeral package.
 */
function getPackagePremium(params: ICalculationParams): PremiumResult {
  const pkg = getPackageById(params.packageId);
  if (!pkg) {
    throw new Error(`Unknown package: "${params.packageId}"`);
  }

  return {
    packageId: pkg.id,
    packageName: pkg.name,
    packageType: pkg.type,
    monthlyPremium: pkg.monthlyPremium,
    cover: pkg.cover,
  };
}

/**
 * Looks up the premium for a given principal member cover amount.
 * Useful for backward compatibility with coverage_amount stored in DB.
 */
function getPremiumByCoverAmount(coverAmount: number): PremiumResult | null {
  const pkg = getPackageByCoverAmount(coverAmount);
  if (!pkg) return null;

  return {
    packageId: pkg.id,
    packageName: pkg.name,
    packageType: pkg.type,
    monthlyPremium: pkg.monthlyPremium,
    cover: pkg.cover,
  };
}

export { getPackagePremium, getPremiumByCoverAmount, FUNERAL_PACKAGES };
export type { ICalculationParams, PremiumResult, FuneralPackageId };