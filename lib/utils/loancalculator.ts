import {
  differenceInCalendarDays,
  eachMonthOfInterval,
  lastDayOfMonth,
} from "date-fns";

/**
 * @interface LoanParams
 * @description Defines the shape of the input parameters for a new loan calculation.
 */
interface LoanParams {
  /** The initial loan amount. */
  principal: number;
  /** The total term of the loan in days (e.g., 30, 60). */
  termInDays: number;
  /** The date the loan was initiated. */
  loanStartDate: Date;
  /** The monthly interest rate as a decimal (e.g., 0.01 for 1%). Defaults to 0.05 (5%). */
  monthlyInterestRate?: number;
  /** An optional late payment fee. Defaults to 0. */
  latePaymentFee?: number;
}

/**
 * @class PaydayLoanCalculator
 * @description Handles all calculations related to a payday loan based on a given set of parameters.
 */
export class PaydayLoanCalculator {
  private readonly principal: number;
  private readonly termInDays: number;
  private readonly loanStartDate: Date;
  private readonly monthlyInterestRate: number;
  private readonly latePaymentFee: number;

  // Constants based on your requirements
  private static readonly INITIATION_FEE_BASE = 165;
  private static readonly INITIATION_FEE_THRESHOLD = 1000;
  private static readonly INITIATION_FEE_PERCENTAGE = 0.1; // 10%
  private static readonly MONTHLY_SERVICE_FEE = 69;

  /**
   * Creates an instance of the PaydayLoanCalculator.
   * @param {LoanParams} params - The parameters for the loan.
   */
  constructor(params: LoanParams) {
    this.principal = params.principal;
    this.termInDays = params.termInDays;
    this.loanStartDate = params.loanStartDate;

    // Set default values for optional parameters
    this.monthlyInterestRate = params.monthlyInterestRate ?? 0.05; // Default to 5%
    this.latePaymentFee = params.latePaymentFee ?? 0;
  }

  // --- Private Helper Methods ---

  private getMaturityDate(): Date {
    const end = new Date(this.loanStartDate.getTime());
    end.setDate(end.getDate() + this.termInDays - 1);
    return end;
  }

  private calculateInitiationFee(): number {
    let additionalFee = 0;
    if (this.principal > PaydayLoanCalculator.INITIATION_FEE_THRESHOLD) {
      additionalFee =
        (this.principal - PaydayLoanCalculator.INITIATION_FEE_THRESHOLD) *
        PaydayLoanCalculator.INITIATION_FEE_PERCENTAGE;
    }
    return PaydayLoanCalculator.INITIATION_FEE_BASE + additionalFee;
  }

  private getActiveMonths(): { start: Date; end: Date }[] {
    const startDate = this.loanStartDate;
    const endDate = this.getMaturityDate();

    const monthAnchors = eachMonthOfInterval({
      start: new Date(startDate.getFullYear(), startDate.getMonth(), 1),
      end: new Date(endDate.getFullYear(), endDate.getMonth(), 1),
    });

    return monthAnchors.map((anchor, idx) => {
      const y = anchor.getFullYear();
      const m = anchor.getMonth();
      const monthStart = idx === 0 ? startDate : new Date(y, m, 1);
      const monthEnd = lastDayOfMonth(new Date(y, m, 1));
      const end = monthEnd < endDate ? monthEnd : endDate;
      return { start: monthStart, end };
    });
  }

  private calculateServiceFee(days: number): number {
    const months = this.getActiveMonths();
    let totalFee = 0;
    let daysRemaining = days;
    for (const { start, end } of months) {
      const daysInMonth = differenceInCalendarDays(end, start) + 1;
      const chargeableDays = Math.min(daysRemaining, daysInMonth);
      totalFee += (chargeableDays / daysInMonth) *
        PaydayLoanCalculator.MONTHLY_SERVICE_FEE;
      daysRemaining -= chargeableDays;
      if (daysRemaining <= 0) break;
    }
    return totalFee;
  }

  private calculateInterest(days: number): number {
    // Interest is calculated using the monthly rate, pro-rated by actual days in each active month
    const months = this.getActiveMonths();
    let totalInterest = 0;
    let daysRemaining = days;
    for (const { start, end } of months) {
      const daysInMonth = differenceInCalendarDays(end, start) + 1;
      const chargeableDays = Math.min(daysRemaining, daysInMonth);
      totalInterest += (chargeableDays / daysInMonth) *
        this.monthlyInterestRate * this.principal;
      daysRemaining -= chargeableDays;
      if (daysRemaining <= 0) break;
    }
    return totalInterest;
  }

  // --- Public Methods ---

  /**
   * Returns all scheduled repayment dates.
   * Payments occur only on the 25th/26th of a month, or the loan end date if it falls before those days in the final month.
   */
  public getPaymentScheduleDates(): Date[] {
    const schedule: Date[] = [];
    const startDate = this.loanStartDate;
    const endDate = this.getMaturityDate();

    const monthAnchors = eachMonthOfInterval({
      start: new Date(startDate.getFullYear(), startDate.getMonth(), 1),
      end: new Date(endDate.getFullYear(), endDate.getMonth(), 1),
    });

    monthAnchors.forEach((anchor, idx) => {
      const y = anchor.getFullYear();
      const m = anchor.getMonth();
      const monthStartCutoff = idx === 0 ? startDate : new Date(y, m, 1);
      const day25 = new Date(y, m, 25);
      const day26 = new Date(y, m, 26);
      const inLastMonth = y === endDate.getFullYear() &&
        m === endDate.getMonth();

      let picked: Date | null = null;
      if (day25 >= monthStartCutoff && day25 <= endDate) {
        picked = day25;
      } else if (day26 >= monthStartCutoff && day26 <= endDate) {
        picked = day26;
      } else if (inLastMonth && endDate < day25) {
        picked = new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate(),
        );
      }

      if (picked) schedule.push(picked);
    });

    return schedule;
  }

  /** Returns the initiation fee per the configured rules. */
  public getInitiationFee(): number {
    return this.calculateInitiationFee();
  }

  /** Returns the service fee for the full loan term (pro-rated using actual month lengths). */
  public getServiceFeeForTerm(): number {
    return this.calculateServiceFee(this.termInDays);
  }

  /** Returns the next scheduled payment date from a given date (defaults to loan start). */
  public getNextPaymentDate(fromDate: Date = this.loanStartDate): Date {
    const maturityDate = this.getMaturityDate();
    const schedule = this.getPaymentScheduleDates();
    const next = schedule.find((d) => d >= fromDate);
    return next ?? maturityDate;
  }

  /** Calculates the total amount to be repaid at the end of the full loan term. */
  public getTotalRepayment(): number {
    const initiationFee = this.calculateInitiationFee();
    const totalServiceFee = this.calculateServiceFee(this.termInDays);
    const totalInterest = this.calculateInterest(this.termInDays);
    return this.principal + initiationFee + totalServiceFee + totalInterest;
  }

  /** Returns the total interest for the full loan term. */
  public getTotalInterest(): number {
    return this.calculateInterest(this.termInDays);
  }

  /** Calculates the per-payment amount by dividing total by number of scheduled payments. */
  public getMonthlyRepayment(): number {
    const totalRepayment = this.getTotalRepayment();
    const numberOfPayments = this.getPaymentScheduleDates().length;
    if (numberOfPayments === 0) return totalRepayment;
    return totalRepayment / numberOfPayments;
  }

  /** Returns the number of repayments (one per scheduled payment date). */
  public getNumberOfRepayments(): number {
    return this.getPaymentScheduleDates().length;
  }

  /**
   * Calculates the settlement amount if the loan is paid off early.
   * Interest and Service Fees are pro-rated to the actual number of days the loan was active.
   */
  public getEarlySettlementAmount(
    settlementDate: Date,
    previousPayments: number = 0,
  ): number | string {
    if (settlementDate < this.loanStartDate) {
      return "Settlement date cannot be before the loan start date.";
    }
    if (previousPayments < 0) {
      return "Previous payments cannot be negative.";
    }

    const daysHeld = Math.ceil(
      (settlementDate.getTime() - this.loanStartDate.getTime()) /
        (1000 * 3600 * 24),
    );
    if (daysHeld > this.termInDays) {
      return "Settlement date is after the loan maturity. Use getTotalRepayment() instead.";
    }

    const initiationFee = this.calculateInitiationFee();
    const proRatedServiceFee = this.calculateServiceFee(daysHeld);
    const proRatedInterest = this.calculateInterest(daysHeld);

    const totalAmountDue = this.principal + initiationFee + proRatedServiceFee +
      proRatedInterest;
    const remainingAmount = totalAmountDue - previousPayments;
    return Math.max(0, remainingAmount);
  }

  /** Returns the total repayment amount including the specified late fee. */
  public getTotalWithLateFee(): number {
    return this.getTotalRepayment() + this.latePaymentFee;
  }

  /** Calculates the outstanding amount remaining on the loan as of currentDate. */
  public getOutstandingAmount(
    currentDate: Date,
    previousPayments: number = 0,
  ): number | string {
    if (currentDate < this.loanStartDate) {
      return "Current date cannot be before the loan start date.";
    }
    if (previousPayments < 0) {
      return "Previous payments cannot be negative.";
    }

    const daysActive = Math.ceil(
      (currentDate.getTime() - this.loanStartDate.getTime()) /
        (1000 * 3600 * 24),
    );
    const effectiveDays = Math.min(daysActive, this.termInDays);

    const initiationFee = this.calculateInitiationFee();
    const serviceFeeDue = this.calculateServiceFee(effectiveDays);
    const interestDue = this.calculateInterest(effectiveDays);

    const totalAmountDue = this.principal + initiationFee + serviceFeeDue +
      interestDue;
    const outstandingAmount = totalAmountDue - previousPayments;
    return Math.max(0, outstandingAmount);
  }

  /** Calculates the next payment amount based on payment schedule and outstanding amount. */
  public getNextPaymentAmount(
    currentDate: Date,
    previousPayments: number = 0,
  ): number | string {
    if (currentDate < this.loanStartDate) {
      return "Current date cannot be before the loan start date.";
    }
    if (previousPayments < 0) {
      return "Previous payments cannot be negative.";
    }

    const outstandingAmount = this.getOutstandingAmount(
      currentDate,
      previousPayments,
    );
    if (typeof outstandingAmount === "string") return outstandingAmount;
    if (outstandingAmount === 0) return 0;

    const remainingPaymentPeriods =
      this.getPaymentScheduleDates().filter((d) => d >= currentDate).length;
    if (remainingPaymentPeriods === 0) return outstandingAmount;

    return outstandingAmount / remainingPaymentPeriods;
  }
}
