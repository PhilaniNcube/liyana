// Fixed funeral plan packages

export type FuneralPackageId = "elula_air" | "ilifa" | "ukuthula" | "ilanga";

export interface FuneralPackageCover {
  principalMember: number;
  spouse?: number;
  stillBorn?: number;
  childrenUnder6?: number;
  children6to13?: number;
  children14to21?: number;
  studentChild21to25?: number;
}

export interface FuneralPackage {
  id: FuneralPackageId;
  name: string;
  monthlyPremium: number;
  type: "family" | "single";
  cover: FuneralPackageCover;
}

export const FUNERAL_PACKAGES: FuneralPackage[] = [
  {
    id: "elula_air",
    name: "Elula Air Family Funeral Plan",
    monthlyPremium: 132.90,
    type: "family",
    cover: {
      principalMember: 12000,
      spouse: 10000,
      stillBorn: 4000,
      childrenUnder6: 4000,
      children6to13: 6000,
      children14to21: 8000,
      studentChild21to25: 8000,
    },
  },
  {
    id: "ilifa",
    name: "Ilifa Family Funeral Plan",
    monthlyPremium: 203.60,
    type: "family",
    cover: {
      principalMember: 18500,
      spouse: 10000,
      stillBorn: 4000,
      childrenUnder6: 4000,
      children6to13: 8000,
      children14to21: 8000,
      studentChild21to25: 8000,
    },
  },
  {
    id: "ukuthula",
    name: "Ukuthula Single Member Funeral Plan",
    monthlyPremium: 67,
    type: "single",
    cover: {
      principalMember: 6000,
    },
  },
  {
    id: "ilanga",
    name: "Ilanga Single Member Funeral Plan",
    monthlyPremium: 139,
    type: "single",
    cover: {
      principalMember: 10000,
    },
  },
];

/** Look up a package by its ID */
export function getPackageById(id: FuneralPackageId): FuneralPackage | undefined {
  return FUNERAL_PACKAGES.find((pkg) => pkg.id === id);
}

/** Look up a package by its principal member cover amount (unique per package) */
export function getPackageByCoverAmount(coverAmount: number): FuneralPackage | undefined {
  return FUNERAL_PACKAGES.find((pkg) => pkg.cover.principalMember === coverAmount);
}
