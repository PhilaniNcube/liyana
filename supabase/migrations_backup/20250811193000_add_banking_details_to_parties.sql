-- Add banking_details JSONB column to public.parties
-- Structure (informal): {
--   account_name: text,
--   bank_name: text,
--   account_number: text,
--   branch_code: text,
--   account_type: text
-- }

begin;

alter table "public"."parties"
  add column if not exists "banking_details" jsonb;

-- Ensure the JSON is an object when present
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'parties_banking_details_is_object'
  ) then
    alter table "public"."parties"
      add constraint "parties_banking_details_is_object"
      check (
        banking_details is null
        or jsonb_typeof(banking_details) = 'object'
      );
  end if;
end $$;

comment on column "public"."parties"."banking_details" is
  'Banking details JSON object: {account_name, bank_name, account_number, branch_code, account_type}';

commit;
