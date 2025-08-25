/**
 * Represents a single row from the provided rate table.
 */
interface IRateEntry {
  benefitOption: string;
  ageBand: string;
  rate: number; // Office premium (per R1000)
}

/**
 * Represents a processed age band with numeric min/max ages.
 */
interface IProcessedRateBand {
  minAge: number;
  maxAge: number;
  rate: number;
}

/**
 * Defines the relationship types for additional family members.
 */
type RelationshipType = 'spouse' | 'child' | 'extended';

/**
 * Defines the parameters for an additional family member.
 */
interface IAdditionalFamilyMember {
  age?: number; // Optional - only needed for extended family members
  relationship: RelationshipType;
}

/**
 * Defines the main input for our premium calculation method.
 */
interface ICalculationParams {
  mainMemberAge: number;
  coverAmount: number; // Single cover amount for all members
  additionalMembers?: IAdditionalFamilyMember[];
}


class FuneralCoverCalculator {
  // A map to store the processed rates for efficient lookups.
  // The key is the benefit option string, e.g., "Main Member Only".
  // The value is an array of processed age bands with their rates.
  private processedRates: Map<string, IProcessedRateBand[]> = new Map();

  // Define constants for benefit option strings
  private readonly MAIN_MEMBER_ONLY = 'Main Member Only';
  private readonly MAIN_MEMBER_AND_SPOUSE = 'Main Member and Spouse';
  private readonly MAIN_MEMBER_AND_CHILDREN = 'Main Member and up to 6 Children';
  private readonly MAIN_MEMBER_SPOUSE_AND_CHILDREN = 'Main Member, Spouse and up to 6 Children';
  private readonly MAIN_MEMBER_AND_2_SPOUSES = 'Main Member and 2 Spouses';
  private readonly MAIN_MEMBER_2_SPOUSES_AND_CHILDREN = 'Main Member, 2 Spouses and up to 6 Children';
  private readonly EXTENDED_FAMILY = 'Extended family';

  /**
   * The constructor takes the raw rate data and processes it for internal use.
   * @param rateTable - An array of rate objects, matching the structure of the CSV.
   */
  constructor(rateTable: IRateEntry[]) {
    this._initializeRates(rateTable);
  }

  /**
   * Processes the raw rate table into a structured Map for efficient lookups.
   * @param rateTable The raw data from the spreadsheet.
   */
  private _initializeRates(rateTable: IRateEntry[]): void {
    for (const entry of rateTable) {
      // Normalize the benefit option key to handle inconsistencies
      const key = this._normalizeKey(entry.benefitOption);

      if (!this.processedRates.has(key)) {
        this.processedRates.set(key, []);
      }

      const [minAge, maxAge] = this._parseAgeBand(entry.ageBand);

      this.processedRates.get(key)!.push({
        minAge,
        maxAge,
        rate: entry.rate,
      });
    }

    // Sort each band by minAge to ensure correct lookups if needed
    for (const bands of this.processedRates.values()) {
        bands.sort((a, b) => a.minAge - b.minAge);
    }
  }

  /**
   * Normalizes a string key by trimming whitespace and removing quotes.
   * @param key The raw benefit option string.
   * @returns A cleaned-up key.
   */
  private _normalizeKey(key: string): string {
    return key.replace(/"/g, '').replace(/\n/g, ' ').trim();
  }

  /**
   * Parses an age band string like "(18 - 65)" into numeric min and max ages.
   * @param ageBandString The string from the spreadsheet.
   * @returns A tuple [minAge, maxAge].
   */
  private _parseAgeBand(ageBandString: string): [number, number] {
    const matches = ageBandString.match(/(\d+)\s*-\s*(\d+)/);
    if (matches && matches.length === 3) {
      return [parseInt(matches[1], 10), parseInt(matches[2], 10)];
    }
    throw new Error(`Invalid age band format: ${ageBandString}`);
  }

  /**
   * Finds the correct rate for a given benefit option and age.
   * @param benefitOption The type of cover.
   * @param age The age of the person.
   * @returns The rate per R1000 of cover.
   */
  private _findRateForAge(benefitOption: string, age: number): number {
    const normalizedOption = this._normalizeKey(benefitOption);
    const rateBands = this.processedRates.get(normalizedOption);

    if (!rateBands) {
      throw new Error(`Benefit option not found: "${benefitOption}"`);
    }

    const applicableBand = rateBands.find(
      (band) => age >= band.minAge && age <= band.maxAge
    );

    if (!applicableBand) {
      throw new Error(`No applicable age band found for age ${age} under option "${benefitOption}"`);
    }

    return applicableBand.rate;
  }

  /**
   * Calculates the premium based on the cover amount and the rate.
   * The formula is: Premium = (Cover Amount / 1000) * Rate
   * @param coverAmount The desired amount of cover.
   * @param rate The rate per R1000.
   * @returns The calculated premium.
   */
  private _calculate(coverAmount: number, rate: number): number {
    return (coverAmount / 1000) * rate;
  }

  /**
   * Determines the appropriate benefit option based on the family composition.
   * @param hasSpouse Whether there is a spouse to be covered.
   * @param hasChildren Whether there are children to be covered.
   * @param spouseCount Number of spouses (for polygamous families).
   * @returns The appropriate benefit option string.
   */
  private _determineBenefitOption(hasSpouse: boolean, hasChildren: boolean, spouseCount: number = 0): string {
    if (spouseCount > 1) {
      return hasChildren ? this.MAIN_MEMBER_2_SPOUSES_AND_CHILDREN : this.MAIN_MEMBER_AND_2_SPOUSES;
    }
    
    if (hasSpouse && hasChildren) {
      return this.MAIN_MEMBER_SPOUSE_AND_CHILDREN;
    }
    
    if (hasSpouse) {
      return this.MAIN_MEMBER_AND_SPOUSE;
    }
    
    if (hasChildren) {
      return this.MAIN_MEMBER_AND_CHILDREN;
    }
    
    return this.MAIN_MEMBER_ONLY;
  }

  /**
   * Analyzes the family composition from additional members.
   * @param additionalMembers Array of additional family members.
   * @returns Object containing family composition details.
   */
  private _analyzeFamilyComposition(additionalMembers: IAdditionalFamilyMember[] = []) {
    const spouses = additionalMembers.filter(member => member.relationship === 'spouse');
    const children = additionalMembers.filter(member => member.relationship === 'child');
    const extendedFamily = additionalMembers.filter(member => member.relationship === 'extended');

    // Validate children limit
    if (children.length > 6) {
      throw new Error('Maximum of 6 children can be covered under the main policy');
    }

    // Validate that extended family members have ages
    for (const member of extendedFamily) {
      if (member.age === undefined) {
        throw new Error('Age is required for all extended family members');
      }
    }

    return {
      hasSpouse: spouses.length > 0,
      hasChildren: children.length > 0,
      spouseCount: spouses.length,
      childrenCount: children.length,
      extendedFamilyCount: extendedFamily.length,
      spouses,
      children,
      extendedFamily
    };
  }

  /**
   * Public method to calculate the total monthly premium.
   * This includes the main policy and any additional family members.
   * @param params - An object containing all necessary details for the calculation.
   * @returns An object with the breakdown and total premium.
   */
  public calculateTotalPremium(params: ICalculationParams): { 
    mainPolicyPremium: number; 
    extendedFamilyPremium: number; 
    totalPremium: number;
    benefitOptionUsed: string;
    breakdown: {
      mainMember: { age: number; coverAmount: number; premium: number };
      immediateFamily: Array<{ relationship: string; age: number; coverAmount: number; premium: number }>;
      extendedFamily: Array<{ age: number; coverAmount: number; premium: number }>;
    }
  } {
    const composition = this._analyzeFamilyComposition(params.additionalMembers);
    
    // Determine the appropriate benefit option for the main policy
    const benefitOption = this._determineBenefitOption(
      composition.hasSpouse, 
      composition.hasChildren, 
      composition.spouseCount
    );

    // Calculate the main policy premium (covers main member and immediate family)
    const mainRate = this._findRateForAge(benefitOption, params.mainMemberAge);
    const mainPolicyPremium = this._calculate(params.coverAmount, mainRate);

    // Track immediate family members covered by main policy
    const immediateFamilyBreakdown: Array<{ relationship: string; age: number; coverAmount: number; premium: number }> = [];
    
    // Add spouses and children to immediate family breakdown (they're covered by main policy rate)
    [...composition.spouses, ...composition.children].forEach(member => {
      immediateFamilyBreakdown.push({
        relationship: member.relationship,
        age: member.age || 0, // Age doesn't matter for immediate family pricing
        coverAmount: params.coverAmount, // Same cover amount for all
        premium: 0 // They're included in the main policy premium
      });
    });

    // Calculate premiums for extended family members (charged separately)
    let extendedFamilyPremium = 0;
    const extendedFamilyBreakdown: Array<{ age: number; coverAmount: number; premium: number }> = [];
    
    if (composition.extendedFamily.length > 0) {
      for (const member of composition.extendedFamily) {
        // Extended family members must have an age specified
        if (member.age === undefined) {
          throw new Error('Age is required for extended family members');
        }
        
        const extendedRate = this._findRateForAge(this.EXTENDED_FAMILY, member.age);
        const memberPremium = this._calculate(params.coverAmount, extendedRate); // Same cover amount
        extendedFamilyPremium += memberPremium;
        
        extendedFamilyBreakdown.push({
          age: member.age,
          coverAmount: params.coverAmount, // Same cover amount for all
          premium: parseFloat(memberPremium.toFixed(2))
        });
      }
    }

    const totalPremium = mainPolicyPremium + extendedFamilyPremium;
    
    return {
      mainPolicyPremium: parseFloat(mainPolicyPremium.toFixed(2)),
      extendedFamilyPremium: parseFloat(extendedFamilyPremium.toFixed(2)),
      totalPremium: parseFloat(totalPremium.toFixed(2)),
      benefitOptionUsed: benefitOption,
      breakdown: {
        mainMember: {
          age: params.mainMemberAge,
          coverAmount: params.coverAmount, // Single cover amount
          premium: parseFloat(mainPolicyPremium.toFixed(2))
        },
        immediateFamily: immediateFamilyBreakdown,
        extendedFamily: extendedFamilyBreakdown
      }
    };
  }
}

export default FuneralCoverCalculator;
export type { ICalculationParams, IAdditionalFamilyMember, RelationshipType };