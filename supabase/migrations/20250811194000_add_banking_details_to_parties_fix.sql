-- Add banking_details JSONB column to public.parties (retry)
-- Structure: {account_name, bank_name, account_number, branch_code, account_type}

alter table "public"."parties"
  add column if not exists "banking_details" jsonb;

-- Add object-type check constraint if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE c.conname = 'parties_banking_details_is_object'
      AND t.relname = 'parties'
      AND n.nspname = 'public'
  ) THEN
    ALTER TABLE "public"."parties"
      ADD CONSTRAINT "parties_banking_details_is_object"
      CHECK (
        banking_details IS NULL
        OR jsonb_typeof(banking_details) = 'object'
      );
  END IF;
END $$;

COMMENT ON COLUMN "public"."parties"."banking_details" IS
  'Banking details JSON object: {account_name, bank_name, account_number, branch_code, account_type}';
