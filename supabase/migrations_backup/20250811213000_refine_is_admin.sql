-- Refine is_admin() to simplify domain check and reduce edge case failures
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  /*
    A user is admin if:
      - They have a profile row with role = 'admin'
      - Their JWT email ends with @liyanafinance.co.za (case-insensitive)
    Note: relies on auth.jwt() context, so must be executed under an authenticated session.
  */
  select (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    and coalesce(auth.jwt()->>'email','') ilike '%@liyanafinance.co.za'
  );
$$;
