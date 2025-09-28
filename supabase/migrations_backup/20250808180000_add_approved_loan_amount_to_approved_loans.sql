-- Add approved_loan_amount column to approved_loans table
ALTER TABLE public.approved_loans ADD COLUMN approved_loan_amount numeric(12,2);
