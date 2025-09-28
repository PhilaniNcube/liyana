-- Fix RLS policies for applications table
-- Allow users to view and manage their own applications

create policy "Users can view own applications"
on "public"."applications"
as permissive
for select
to authenticated
using ((user_id = auth.uid()) OR is_admin());

create policy "Users can insert own applications"
on "public"."applications"
as permissive
for insert
to authenticated
with check ((user_id = auth.uid()) OR is_admin());

create policy "Users can update own applications"
on "public"."applications"
as permissive
for update
to authenticated
using ((user_id = auth.uid()) OR is_admin())
with check ((user_id = auth.uid()) OR is_admin());

-- Additional policies for pre_applications table if needed
create policy "Admin full access on pre_applications"
on "public"."pre_applications"
as permissive
for all
to authenticated
using (is_admin())
with check (is_admin());

create policy "Users can view own pre_applications"
on "public"."pre_applications"
as permissive
for select
to authenticated
using ((user_id = auth.uid()) OR is_admin());

create policy "Users can insert own pre_applications"
on "public"."pre_applications"
as permissive
for insert
to authenticated
with check ((user_id = auth.uid()) OR is_admin());

create policy "Users can update own pre_applications"
on "public"."pre_applications"
as permissive
for update
to authenticated
using ((user_id = auth.uid()) OR is_admin())
with check ((user_id = auth.uid()) OR is_admin());
