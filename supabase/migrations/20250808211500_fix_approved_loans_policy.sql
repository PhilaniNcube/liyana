-- Fix RLS policy for approved_loans to allow LiyanaFinance staff (co.za domain)
-- Previous policy used an incorrect domain (@liyanafinance.com) and wrong suffix length,
-- causing inserts to fail for real admin users. We replace it with a robust LIKE check.

-- Drop the existing (incorrect) policy if present
DROP POLICY IF EXISTS "LiyanaFinance staff can manage approved loans" ON public.approved_loans;

-- Recreate the policy: allow staff (emails ending with @liyanafinance.co.za) to manage rows
-- Apply to ALL commands and include both USING and WITH CHECK for clarity and safety
CREATE POLICY "LiyanaFinance staff can manage approved loans"
ON public.approved_loans
AS PERMISSIVE
FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'email') LIKE '%@liyanafinance.co.za')
WITH CHECK ((auth.jwt() ->> 'email') LIKE '%@liyanafinance.co.za');
