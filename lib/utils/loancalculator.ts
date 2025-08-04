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
  /** The annual interest rate as a decimal (e.g., 0.05 for 5%). Defaults to 5%. */
  annualInterestRate?: number;
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
  private readonly annualInterestRate: number;
  private readonly latePaymentFee: number;

  // Constants based on your requirements
  private static readonly INITIATION_FEE_BASE = 165;
  private static readonly INITIATION_FEE_THRESHOLD = 1000;
  private static readonly INITIATION_FEE_PERCENTAGE = 0.1; // 10%
  private static readonly MONTHLY_SERVICE_FEE = 65;
  private static readonly DAYS_IN_YEAR = 365;
  private static readonly DAYS_IN_MONTH_FOR_FEE = 30;

  /**
   * Creates an instance of the PaydayLoanCalculator.
   * @param {LoanParams} params - The parameters for the loan.
   */
  constructor(params: LoanParams) {
    this.principal = params.principal;
    this.termInDays = params.termInDays;
    this.loanStartDate = params.loanStartDate;

    // Set default values for optional parameters
    this.annualInterestRate = params.annualInterestRate ?? 0.05; // Default to 5%
    this.latePaymentFee = params.latePaymentFee ?? 0;
  }

  // --- Private Helper Methods for Fee Calculation ---

  private calculateInitiationFee(): number {
    let additionalFee = 0;
    if (this.principal > PaydayLoanCalculator.INITIATION_FEE_THRESHOLD) {
      additionalFee =
        (this.principal - PaydayLoanCalculator.INITIATION_FEE_THRESHOLD) *
        PaydayLoanCalculator.INITIATION_FEE_PERCENTAGE;
    }
    return PaydayLoanCalculator.INITIATION_FEE_BASE + additionalFee;
  }

  private calculateServiceFee(days: number): number {
    const numberOfMonths = days / PaydayLoanCalculator.DAYS_IN_MONTH_FOR_FEE;
    return numberOfMonths * PaydayLoanCalculator.MONTHLY_SERVICE_FEE;
  }

  private calculateInterest(days: number): number {
    const dailyRate =
      this.annualInterestRate / PaydayLoanCalculator.DAYS_IN_YEAR;
    return this.principal * dailyRate * days;
  }

  // --- Public Methods for Repayment Calculation ---

  /**
   * Calculates the total amount to be repaid at the end of the full loan term.
   * @returns {number} The total repayment amount (Principal + All Fees + Full Interest).
   */
  public getTotalRepayment(): number {
    const initiationFee = this.calculateInitiationFee();
    const totalServiceFee = this.calculateServiceFee(this.termInDays);
    const totalInterest = this.calculateInterest(this.termInDays);

    return this.principal + initiationFee + totalServiceFee + totalInterest;
  }

  /**
   * Calculates the monthly repayment amount. Assumes 1 payment for terms <= 30 days,
   * and 2 payments for terms > 30 days.
   * @returns {number} The amount for each monthly installment.
   */
  public getMonthlyRepayment(): number {
    const totalRepayment = this.getTotalRepayment();
    const numberOfPayments = Math.ceil(
      this.termInDays / PaydayLoanCalculator.DAYS_IN_MONTH_FOR_FEE
    );

    if (numberOfPayments === 0) {
      return totalRepayment; // Avoid division by zero
    }

    return totalRepayment / numberOfPayments;
  }

  /**
   * Calculates the settlement amount if the loan is paid off early.
   * Interest and Service Fees are pro-rated to the actual number of days the loan was active.
   * @param {Date} settlementDate - The date the customer wishes to settle the loan.
   * @param {number} previousPayments - The total amount of payments already made towards the loan. Defaults to 0.
   * @returns {number | string} The remaining amount to pay for early settlement, or an error message.
   */
  public getEarlySettlementAmount(
    settlementDate: Date,
    previousPayments: number = 0
  ): number | string {
    if (settlementDate < this.loanStartDate) {
      return "Settlement date cannot be before the loan start date.";
    }

    if (previousPayments < 0) {
      return "Previous payments cannot be negative.";
    }

    // Calculate the number of days the loan was held
    const timeDifference =
      settlementDate.getTime() - this.loanStartDate.getTime();
    const daysHeld = Math.ceil(timeDifference / (1000 * 3600 * 24));

    if (daysHeld > this.termInDays) {
      return "Settlement date is after the loan maturity. Use getTotalRepayment() instead.";
    }

    const initiationFee = this.calculateInitiationFee(); // This is always charged in full
    const proRatedServiceFee = this.calculateServiceFee(daysHeld);
    const proRatedInterest = this.calculateInterest(daysHeld);

    const totalAmountDue =
      this.principal + initiationFee + proRatedServiceFee + proRatedInterest;
    const remainingAmount = totalAmountDue - previousPayments;

    // Ensure the remaining amount is not negative
    return Math.max(0, remainingAmount);
  }

  /**
   * Returns the total repayment amount including the specified late fee.
   * @returns {number} The total repayment amount plus the late fee.
   */
  public getTotalWithLateFee(): number {
    return this.getTotalRepayment() + this.latePaymentFee;
  }

  /**
   * Calculates the outstanding amount remaining on the loan.
   * @param {Date} currentDate - The current date to calculate the outstanding amount as of.
   * @param {number} previousPayments - The total amount of payments already made towards the loan. Defaults to 0.
   * @returns {number | string} The outstanding amount, or an error message.
   */
  public getOutstandingAmount(
    currentDate: Date,
    previousPayments: number = 0
  ): number | string {
    if (currentDate < this.loanStartDate) {
      return "Current date cannot be before the loan start date.";
    }

    if (previousPayments < 0) {
      return "Previous payments cannot be negative.";
    }

    // Calculate the number of days the loan has been active
    const timeDifference = currentDate.getTime() - this.loanStartDate.getTime();
    const daysActive = Math.ceil(timeDifference / (1000 * 3600 * 24));

    // If the loan has matured, use full term calculations
    const effectiveDays = Math.min(daysActive, this.termInDays);

    const initiationFee = this.calculateInitiationFee();
    const serviceFeeDue = this.calculateServiceFee(effectiveDays);
    const interestDue = this.calculateInterest(effectiveDays);

    const totalAmountDue =
      this.principal + initiationFee + serviceFeeDue + interestDue;
    const outstandingAmount = totalAmountDue - previousPayments;

    return Math.max(0, outstandingAmount);
  }

  /**
   * Calculates the next payment amount based on the payment schedule.
   * @param {Date} currentDate - The current date to determine the next payment from.
   * @param {number} previousPayments - The total amount of payments already made towards the loan. Defaults to 0.
   * @returns {number | string} The next payment amount, or an error message.
   */
  public getNextPaymentAmount(
    currentDate: Date,
    previousPayments: number = 0
  ): number | string {
    if (currentDate < this.loanStartDate) {
      return "Current date cannot be before the loan start date.";
    }

    if (previousPayments < 0) {
      return "Previous payments cannot be negative.";
    }

    const outstandingAmount = this.getOutstandingAmount(
      currentDate,
      previousPayments
    );

    if (typeof outstandingAmount === "string") {
      return outstandingAmount; // Return error message
    }

    if (outstandingAmount === 0) {
      return 0; // Loan is fully paid
    }

    // Calculate the number of payments remaining
    const timeDifference = currentDate.getTime() - this.loanStartDate.getTime();
    const daysElapsed = Math.ceil(timeDifference / (1000 * 3600 * 24));
    const daysRemaining = Math.max(0, this.termInDays - daysElapsed);

    if (daysRemaining === 0) {
      // Loan has matured, full outstanding amount is due
      return outstandingAmount;
    }

    // Calculate remaining payment periods
    const remainingPaymentPeriods = Math.ceil(
      daysRemaining / PaydayLoanCalculator.DAYS_IN_MONTH_FOR_FEE
    );

    if (remainingPaymentPeriods === 0) {
      return outstandingAmount; // Avoid division by zero
    }

    // Divide the outstanding amount by the number of remaining payment periods
    return outstandingAmount / remainingPaymentPeriods;
  }
}
