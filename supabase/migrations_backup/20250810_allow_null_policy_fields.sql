-- Make start_date and premium_amount nullable on policies to support lead capture without full policy details
alter table "public"."policies"
    alter column "start_date" drop not null,
    alter column "premium_amount" drop not null;

-- Note: frequency and policy_status remain required. Adjust later if needed.
