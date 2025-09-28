-- Migration: Restrict getAllApplications to admin users only
-- Adds a SELECT policy on applications that allows only users whose profile.role = 'admin'
-- and (optionally) whose email matches your company domain.

-- Adjust domain check if necessary; currently using liyanafinance.co.za

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  /*
    Determines if the current authenticated user is an admin.
    Requirements (ALL must be true):
      1. Has a profile row with role = 'admin'
      2. Email (either from profile.email or JWT email claim) ends with @liyanafinance.co.za
  */
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and (
        (p.email is not null and right(lower(p.email), length('@liyanafinance.co.za')) = '@liyanafinance.co.za')
        or (right(lower(coalesce(auth.jwt()->>'email','')), length('@liyanafinance.co.za')) = '@liyanafinance.co.za')
      )
  );
$$;

-- Optional domain enhancer: require company email too (uncomment if desired)
-- create or replace function public.is_company_email() returns boolean language sql stable as $$
--   select (auth.jwt() ->> 'email') ilike '%@liyanafinance.co.za';
-- $$;

-- Drop existing broad admin email policy if you want to enforce role-based only.
-- (We only drop the previous email-based SELECT policy to avoid duplicate overlapping logic.)
DO $$
BEGIN
  IF EXISTS (
    select 1 from pg_policies where schemaname='public' and tablename='applications' and policyname='Admin can view all applications'
  ) THEN
    EXECUTE 'drop policy "Admin can view all applications" on public.applications';
  END IF;
END $$;

-- Create new policy combining role (and optional email domain) for SELECT
create policy "Admins (role) can view all applications"
  on public.applications
  for select
  to authenticated
  using ( public.is_admin() );

-- Ensure RLS is enabled (idempotent)
alter table public.applications enable row level security;
