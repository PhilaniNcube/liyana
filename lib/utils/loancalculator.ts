import { differenceInCalendarDays } from "date-fns";

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
  /** Nominal monthly interest rate expressed as decimal (e.g. 0.05 for 5%). Defaults to 0.05. */
  interestRate?: number;
  /** Monthly service fee cap (maximum charged for service fees in a 30 day period). Defaults to 60. */
  monthlyServiceFeeCap?: number;
  /** Optional salary (repayment) date supplied by user. If omitted, maturity date is used. */
  salaryDate?: Date;
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
  private readonly interestRate: number; // monthly nominal rate
  private readonly monthlyServiceFeeCap: number;
  private readonly salaryDate?: Date;
  private readonly latePaymentFee: number;

  // Constants for initiation fee logic & insurance
  private static readonly INITIATION_FEE_BASE = 165;
  private static readonly INITIATION_FEE_THRESHOLD = 1000;
  private static readonly INITIATION_FEE_PERCENTAGE = 0.10; // 10%
  private static readonly INITIATION_FEE_MAX = 1050; // Absolute cap per rule
  private static readonly INSURANCE_RATE = 0.0055; // 0.55%

  /**
   * Creates an instance of the PaydayLoanCalculator.
   * @param {LoanParams} params - The parameters for the loan.
   */
  constructor(params: LoanParams) {
    this.principal = params.principal;
    this.termInDays = params.termInDays;
    this.loanStartDate = params.loanStartDate;
    this.interestRate = params.interestRate ?? 0.05; // monthly nominal rate (5%)
    this.monthlyServiceFeeCap = params.monthlyServiceFeeCap ?? 60; // cap at R60
    this.salaryDate = params.salaryDate;
    this.latePaymentFee = params.latePaymentFee ?? 0;
  }

  // --- Private Helper Methods ---

  private getMaturityDate(): Date {
    const end = new Date(this.loanStartDate.getTime());
    end.setDate(end.getDate() + this.termInDays - 1);
    return end;
  }

  private calculateInitiationFee(): number {
    // (loanamount > 1050) ? Math.min(165 + 0.10 * (loanamount - 1000), 1050) : loanamount * 0.15;
    if (this.principal > 1050) {
      return Math.min(
        PaydayLoanCalculator.INITIATION_FEE_BASE +
          PaydayLoanCalculator.INITIATION_FEE_PERCENTAGE *
            (this.principal - 1000),
        PaydayLoanCalculator.INITIATION_FEE_MAX,
      );
    }
    return this.principal * 0.15;
  }

  private calculateServiceFee(days: number): number {
    // prorated daily: (monthlyCap / 30) * days, capped at monthlyCap
    const dailyServiceFee = this.monthlyServiceFeeCap / 30;
    return Math.min(dailyServiceFee * days, this.monthlyServiceFeeCap);
  }

  private calculateInterest(days: number): number {
    // daily interest = (monthly interest rate / 30) * principal * days
    const dailyInterestRate = this.interestRate / 30;
    return this.principal * dailyInterestRate * days;
  }

  private calculateInsurance(interest: number, initiationFee: number, serviceFee: number): number {
    return (this.principal + initiationFee + serviceFee + interest) *
      PaydayLoanCalculator.INSURANCE_RATE;
  }

  // --- Public Methods ---

  /**
   * Returns all scheduled repayment dates.
   * Payments occur only on the 25th/26th of a month, or the loan end date if it falls before those days in the final month.
   */
  public getPaymentScheduleDates(): Date[] {
    // Business rule update: single repayment on the first salary date ON or AFTER loan start.
    // If salaryDate supplied is before loan start, roll forward month-by-month keeping day-of-month (falling back to last day if shorter month) until >= start.
    // If resulting date is after maturity, use maturity.
    const maturity = this.getMaturityDate();
    if (!this.salaryDate) return [maturity];

    const start = this.loanStartDate;
    const targetDay = this.salaryDate.getDate();
    let candidate = new Date(this.salaryDate.getTime());

    // If provided salary date is before loan start, roll forward.
    while (candidate < start) {
      const year = candidate.getFullYear();
      const month = candidate.getMonth() + 1; // next month
      // last day of next month
      const lastDayNextMonth = new Date(year, month + 1, 0).getDate();
      const day = Math.min(targetDay, lastDayNextMonth);
      candidate = new Date(year, month, day);
    }

    // Cap at maturity
    if (candidate > maturity) candidate = maturity;
    return [candidate];
  }

  /** Returns the initiation fee per the configured rules. */
  public getInitiationFee(): number {
    return this.calculateInitiationFee();
  }

  /** Returns the service fee for the full loan term (pro-rated using actual month lengths). */
  public getServiceFeeForTerm(): number { return this.calculateServiceFee(this.termInDays); }

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
    const serviceFee = this.calculateServiceFee(this.termInDays);
    const interest = this.calculateInterest(this.termInDays);
    const insurance = this.calculateInsurance(interest, initiationFee, serviceFee);
    return this.principal + initiationFee + serviceFee + interest + insurance;
  }

  /** Returns the insurance amount for full term. */
  public getInsurance(): number {
    const initiationFee = this.calculateInitiationFee();
    const serviceFee = this.calculateServiceFee(this.termInDays);
    const interest = this.calculateInterest(this.termInDays);
    return this.calculateInsurance(interest, initiationFee, serviceFee);
  }

  /** Returns the total cost of credit (excluding principal). */
  public getTotalCostOfCredit(): number {
    return this.getTotalRepayment() - this.principal;
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
  public getEarlySettlementAmount(settlementDate: Date, previousPayments: number = 0): number | string {
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
    const insurance = this.calculateInsurance(proRatedInterest, initiationFee, proRatedServiceFee);

    const totalAmountDue = this.principal + initiationFee + proRatedServiceFee + proRatedInterest + insurance;
    const remainingAmount = totalAmountDue - previousPayments;
    return Math.max(0, remainingAmount);
  }

  /** Returns the total repayment amount including the specified late fee. */
  public getTotalWithLateFee(): number {
    return this.getTotalRepayment() + this.latePaymentFee;
  }

  /** Calculates the outstanding amount remaining on the loan as of currentDate. */
  public getOutstandingAmount(currentDate: Date, previousPayments: number = 0): number | string {
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
    const insurance = this.calculateInsurance(interestDue, initiationFee, serviceFeeDue);

    const totalAmountDue = this.principal + initiationFee + serviceFeeDue + interestDue + insurance;
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
