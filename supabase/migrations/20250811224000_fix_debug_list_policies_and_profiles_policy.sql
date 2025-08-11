-- Fix debug_list_policies function signature (remove default param) and add wrapper for all
-- Add self-select policy on profiles so users (and admin) can view their profile rows.

-- Drop old version if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.proname='debug_list_policies' AND p.pronargs=1
  ) THEN
    EXECUTE 'drop function public.debug_list_policies(text)';
  END IF;
END $$;

create or replace function public.debug_list_policies(target text)
returns table(
  policyname text,
  tablename text,
  roles text,
  cmd text,
  qual text,
  with_check text
)
language sql
security definer
set search_path = public
stable
as $$
  select 
    p.polname as policyname,
    c.relname as tablename,
    coalesce(
      array_to_string(
        array(select r.rolname from pg_roles r where r.oid = any(p.polroles) order by r.rolname),
        ','
      ),
      ''
    ) as roles,
    p.polcmd as cmd,
    pg_get_expr(p.polqual,  p.polrelid) as qual,
    pg_get_expr(p.polwithcheck, p.polrelid) as with_check
  from pg_policy p
  join pg_class c on c.oid = p.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and (target is null or c.relname = target)
  order by c.relname, p.polname;
$$;

create or replace function public.debug_list_policies_all()
returns table(
  policyname text,
  tablename text,
  roles text,
  cmd text,
  qual text,
  with_check text
)
language sql
security definer
set search_path = public
stable
as $$
  select * from public.debug_list_policies(null::text);
$$;

revoke all on function public.debug_list_policies(text) from public;
revoke all on function public.debug_list_policies_all() from public;
grant execute on function public.debug_list_policies(text) to authenticated;
grant execute on function public.debug_list_policies_all() to authenticated;

-- Profiles self-select policy (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can read own profile'
  ) THEN
    EXECUTE 'create policy "Users can read own profile" on public.profiles for select to authenticated using ( id = auth.uid() )';
  END IF;
END $$;
