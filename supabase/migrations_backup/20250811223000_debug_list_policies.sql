-- Add debug_list_policies() helper to introspect current RLS policies in public schema
-- SECURITY DEFINER so normal authenticated users can call via RPC for diagnostics.

create or replace function public.debug_list_policies(target text default null)
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

revoke all on function public.debug_list_policies(text) from public;
grant execute on function public.debug_list_policies(text) to authenticated;
