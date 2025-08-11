-- Make is_admin() SECURITY DEFINER so it can read profiles without triggering RLS permission errors
-- and grant execute to authenticated role.

create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
    and coalesce(auth.jwt()->>'email','') ilike '%@liyanafinance.co.za'
  );
end;
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
