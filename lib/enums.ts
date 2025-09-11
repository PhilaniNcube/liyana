import { z } from "zod";

// B. Gender
export const GENDERS = [
  { value: 1, description: "Male" },
  { value: 2, description: "Female" },
  { value: 3, description: "Unknown" },
] as const;
export const genderSchema = z.enum(GENDERS.map((g) => g.description) as [string, ...string[]]);

// C. ID Type
export const ID_TYPES = [
  { value: 1, description: "RSA Id" },
  { value: 2, description: "Passport" },
  { value: 3, description: "Date of Birth" },
  { value: 4, description: "Namibian ID" },
  { value: 5, description: "Business" },
  { value: 6, description: "Other" },
  { value: 12, description: "ID Document" },
] as const;
export const idTypeSchema = z.enum(ID_TYPES.map((i) => i.description) as [string, ...string[]]);

// D. Bank Account Type
export const BANK_ACCOUNT_TYPES = [
  { value: 0, description: "Other" },
  { value: 1, description: "Cheque" },
  { value: 2, description: "Savings" },
  { value: 3, description: "Transmission" },
  { value: 4, description: "Bond" },
  { value: 6, description: "Subscription Share" },
  { value: 7, description: "eWallet" },
  { value: 8, description: "Cash Access" },
] as const;
export const bankAccountTypeSchema = z.enum(
  BANK_ACCOUNT_TYPES.map((b) => b.description) as [string, ...string[]]
);

// E. Payment Frequency
export const PAYMENT_FREQUENCIES = [
  { value: "0", description: "By Schedule" },
  { value: "00", description: "Cycle" },
  { value: "1", description: "Weekly" },
  { value: "3", description: "Fortnightly" },
  { value: "4", description: "Monthly" },
  { value: "5", description: "Monthly By Rule" },
  { value: "6", description: "Quarterly" },
  { value: "7", description: "Bi Annually" },
  { value: "8", description: "Annually" },
] as const;
export const paymentFrequencySchema = z.enum(
  PAYMENT_FREQUENCIES.map((p) => p.description) as [string, ...string[]]
);

// F. Payment Move Direction
export const PAYMENT_MOVE_DIRECTIONS = [
  { value: 1, description: "Backward" },
  { value: 2, description: "Forward" },
  { value: 3, description: "Leave On" },
] as const;
export const paymentMoveDirectionSchema = z.enum(
  PAYMENT_MOVE_DIRECTIONS.map((p) => p.description) as [string, ...string[]]
);

// G. Payment Move Rule
export const PAYMENT_MOVE_RULES = [
  { value: 1, description: "Weekend" },
  { value: 2, description: "Sunday and Public Holidays" },
  { value: 3, description: "Leave On" },
] as const;
export const paymentMoveRuleSchema = z.enum(
  PAYMENT_MOVE_RULES.map((p) => p.description) as [string, ...string[]]
);

// H. Day Of Month Rule
export const DAY_OF_MONTH_RULES = [
  { value: "01", description: "Last Monday" },
  { value: "02", description: "Last Tuesday" },
  { value: "03", description: "Last Wednesday" },
  { value: "04", description: "Last Thursday" },
  { value: "05", description: "Last Friday" },
  { value: "06", description: "Last Saturday" },
  { value: "07", description: "First Monday" },
  { value: "08", description: "First Tuesday" },
  { value: "09", description: "First Thursday" },
  { value: "10", description: "First Friday" },
  { value: "11", description: "First Saturday" },
  { value: "12", description: "Last Day" },
  { value: "13", description: "2nd Last Sunday" },
  { value: "14", description: "Last Sunday" },
  { value: "15", description: "First Sunday" },
  { value: "16", description: "Second Monday" },
  { value: "17", description: "Second Tuesday" },
  { value: "18", description: "Second Thursday" },
  { value: "19", description: "Second Friday" },
  { value: "20", description: "Second Saturday" },
  { value: "21", description: "Second Sunday" },
  { value: "22", description: "Third Tuesday" },
  { value: "23", description: "Third Wednesday" },
  { value: "24", description: "Third Thursday" },
  { value: "25", description: "Third Friday" },
  { value: "26", description: "Third Sunday" },
  { value: "27", description: "Last Second Monday" },
  { value: "28", description: "Last Second Tuesday" },
  { value: "29", description: "Last Second Wednesday" },
  { value: "30", description: "Last Second Thursday" },
  { value: "31", description: "Last Second Friday" },
  { value: "32", description: "Last Second Saturday" },
  { value: "33", description: "Last Second Sunday" },
] as const;
export const dayOfMonthRuleSchema = z.enum(
  DAY_OF_MONTH_RULES.map((d) => d.description) as [string, ...string[]]
);

// I. File Type
export const FILE_TYPES = [
  { value: 1, description: "ID Document" },
  { value: 2, description: "Payslip" },
  { value: 33, description: "Other" },
  { value: 34, description: "Bank Statement" },
] as const;
export const fileTypeSchema = z.enum(
  FILE_TYPES.map((f) => f.description) as [string, ...string[]]
);

// J. Employer Status
export const EMPLOYER_STATUSES = [
  { value: 1, description: "Pending" },
  { value: 2, description: "Pre-Approved" },
  { value: 3, description: "Approved" },
  { value: 4, description: "Suspended" },
  { value: 5, description: "Closed" },
] as const;
export const employerStatusSchema = z.enum(
  EMPLOYER_STATUSES.map((e) => e.description) as [string, ...string[]]
);

// K. AVR Supported Banks
export const AVR_SUPPORTED_BANKS = [
  { bank: "African Bank", avsr: true },
  { bank: "ABSA", avsr: true },
  { bank: "Capitec", avsr: true },
  { bank: "Discovery Bank", avsr: false },
  { bank: "FNB", avsr: true },
  { bank: "Grindrod", avsr: true },
  { bank: "GroBank", avsr: false },
  { bank: "Investec", avsr: true },
  { bank: "Mercantile", avsr: false },
  { bank: "Nedbank", avsr: true },
  { bank: "Sasfin", avsr: true },
  { bank: "Standard Bank", avsr: true },
  { bank: "TymeBank", avsr: false },
  { bank: "Ubank", avsr: false },
] as const;
export const avrSupportedBanksSchema = z.enum(
  AVR_SUPPORTED_BANKS.map((b) => b.bank) as [string, ...string[]]
);
export const avrSupportedBanksWithAvsrSchema = z.enum(
  AVR_SUPPORTED_BANKS.filter((b) => b.avsr).map((b) => b.bank) as [string, ...string[]]
);
