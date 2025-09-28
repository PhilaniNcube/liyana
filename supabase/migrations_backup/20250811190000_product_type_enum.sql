-- Create new enum for product types
do $$ begin
    create type "public"."product_type" as enum ('funeral_policy', 'life_insurance', 'payday_loan');
exception
    when duplicate_object then null;
end $$;

-- Add product_type column to policies (nullable for backfill)
alter table if exists "public"."policies"
    add column if not exists "product_type" "public"."product_type";

-- Backfill product_type from existing product_types table via name heuristics
-- This assumes product_types table exists and has a 'name' column
update "public"."policies" p
set product_type = case
    when pt.name ilike '%funeral%' then 'funeral_policy'::public.product_type
    when pt.name ilike '%life%' then 'life_insurance'::public.product_type
    when pt.name ilike '%payday%' then 'payday_loan'::public.product_type
    else p.product_type
end
from "public"."product_types" pt
where p.product_id is not null and pt.id = p.product_id
  and (p.product_type is null);

-- Optionally enforce not null after backfill (commented to avoid failures if some rows can't be mapped)
-- alter table "public"."policies" alter column "product_type" set not null;

-- Drop FKs to product_types in dependent tables before dropping the table
alter table if exists "public"."policies" drop constraint if exists "policies_product_id_fkey";
alter table if exists "public"."funeral_policies" drop constraint if exists "funeral_policies_product_id_fkey";
alter table if exists "public"."life_insurance_policies" drop constraint if exists "life_insurance_policies_product_id_fkey";

-- Drop product_id from policies now that product_type exists
alter table if exists "public"."policies" drop column if exists "product_id";

-- Finally drop the product_types table (and its sequence, policies, grants) if present
drop table if exists "public"."product_types" cascade;
