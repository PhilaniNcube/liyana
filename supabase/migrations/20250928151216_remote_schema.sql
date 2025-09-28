create type "public"."policy_document_type" as enum ('birth_certificate', 'death_certificate', 'marriage_certificate', 'identity_document', 'passport', 'third_party_document', 'proof_of_banking', 'payslip', 'drivers_license');

create type "public"."pre_application_status" as enum ('credit_passed', 'application_started', 'application_completed', 'abandoned', 'cancelled');

drop policy "Admin can delete all records from api_checks" on "public"."api_checks";

drop policy "Admin can update all records in api_checks" on "public"."api_checks";

drop policy "Admin can view all records in api_checks" on "public"."api_checks";

drop policy "Admins (role) can view all applications" on "public"."applications";

drop policy "LiyanaFinance staff can manage approved loans" on "public"."approved_loans";

drop policy "Users can view their own approved loans" on "public"."approved_loans";

drop policy "Enable insert for authenticated users only" on "public"."claim_payouts";

drop policy "Admin users can peform all actions" on "public"."claims";

drop policy "Enable insert for authenticated users only" on "public"."claims";

drop policy "Admin can delete all records from documents" on "public"."documents";

drop policy "Admin can insert records into documents" on "public"."documents";

drop policy "Admin can update all records in documents" on "public"."documents";

drop policy "Admin can view all documents" on "public"."documents";

drop policy "Users can delete their own documents" on "public"."documents";

drop policy "Users can insert their own documents" on "public"."documents";

drop policy "Users can update their own documents" on "public"."documents";

drop policy "Users can view their own documents" on "public"."documents";

drop policy "Admin users can perform all actions" on "public"."funeral_policies";

drop policy "Enable insert for authenticated users only" on "public"."funeral_policies";

drop policy "Admin users can perform all actions" on "public"."life_insurance_policies";

drop policy "Enable insert for authenticated users only" on "public"."life_insurance_policies";

drop policy "LiyanaFinance staff can manage loan payments" on "public"."loan_payments";

drop policy "Users can view their own loan payments" on "public"."loan_payments";

drop policy "Admin users can perform all actions" on "public"."otv_checks";

drop policy "Enable insert for authenticated users only" on "public"."otv_checks";

drop policy "Enable select for authenticated users only" on "public"."otv_checks";

drop policy "Admin users can perform all actions" on "public"."parties";

drop policy "Enable insert for authenticated users only" on "public"."parties";

drop policy "Admin users can perform all actions" on "public"."policies";

drop policy "Enable insert for authenticated users only" on "public"."policies";

drop policy "Admin users can perform all actions" on "public"."policy_beneficiaries";

drop policy "Enable insert for authenticated users only" on "public"."policy_beneficiaries";

drop policy "Admin users can perform all actions" on "public"."policy_versions";

drop policy "Enable insert for authenticated users only" on "public"."policy_versions";

drop policy "Admins Can Insert Documents" on "public"."profile_documents";

drop policy "Admins can delete" on "public"."profile_documents";

drop policy "Admins can select documents" on "public"."profile_documents";

drop policy "Users can read own profile" on "public"."profiles";

drop policy "Admin users can perform all actions" on "public"."transactions";

drop policy "Enable insert for authenticated users only" on "public"."transactions";

drop policy "Users can insert their own applications" on "public"."applications";

alter table "public"."funeral_policies" drop constraint "funeral_policies_policy_holder_id_fkey";

alter table "public"."life_insurance_policies" drop constraint "life_insurance_policies_payout_structure_check";

alter table "public"."life_insurance_policies" drop constraint "life_insurance_policies_policy_holder_id_fkey";

drop function if exists "public"."debug_list_policies"(target text);

drop function if exists "public"."debug_list_policies_all"();

alter table "public"."funeral_policies" drop constraint "funeral_policies_pkey";

alter table "public"."life_insurance_policies" drop constraint "life_insurance_policies_pkey";

drop index if exists "public"."funeral_policies_pkey";

drop index if exists "public"."life_insurance_policies_pkey";

drop table "public"."funeral_policies";

drop table "public"."life_insurance_policies";

alter type "public"."api_check_type" rename to "api_check_type__old_version_to_be_dropped";

create type "public"."api_check_type" as enum ('credit_bureau', 'fraud_check', 'bank_verification', 'dha_otv_facial', 'email_verification', 'employment_verification', 'address_verification', 'cellphone_verification', 'id_verification', 'deceased_status');

alter type "public"."document_type" rename to "document_type__old_version_to_be_dropped";

create type "public"."document_type" as enum ('id', 'bank_statement', 'payslip', 'proof_of_residence', 'contract', 'photo', 'credit_report', 'other', 'third_party_verification');

alter type "public"."relation_type" rename to "relation_type__old_version_to_be_dropped";

create type "public"."relation_type" as enum ('spouse', 'child', 'parent', 'sibling', 'cousin', 'grandparent', 'in-law');

create table "public"."policy_documents" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "user_id" uuid not null default auth.uid(),
    "document_type" policy_document_type not null,
    "path" text not null,
    "policy_id" bigint not null,
    "claim_id" bigint
);


alter table "public"."policy_documents" enable row level security;

create table "public"."pre_applications" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp without time zone not null default now(),
    "expires_at" timestamp without time zone,
    "profile_id" uuid not null,
    "user_id" uuid not null,
    "id_number" text not null,
    "credit_check_id" bigint not null,
    "credit_score" bigint not null,
    "status" pre_application_status not null,
    "application_id" bigint
);


alter table "public"."pre_applications" enable row level security;

create table "public"."resend_emails" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "resend_id" text not null,
    "profile_id" uuid not null,
    "application_id" bigint,
    "loan_id" bigint,
    "policy_id" bigint
);


alter table "public"."resend_emails" enable row level security;

create table "public"."sms_logs" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "phone_number" text not null,
    "message" character varying not null,
    "profile_id" uuid not null
);


alter table "public"."sms_logs" enable row level security;

alter table "public"."api_checks" alter column check_type type "public"."api_check_type" using check_type::text::"public"."api_check_type";

alter table "public"."documents" alter column document_type type "public"."document_type" using document_type::text::"public"."document_type";

alter table "public"."policy_beneficiaries" alter column relation_type type "public"."relation_type" using relation_type::text::"public"."relation_type";

alter table "public"."profile_documents" alter column document_type type "public"."document_type" using document_type::text::"public"."document_type";

drop type "public"."api_check_type__old_version_to_be_dropped";

drop type "public"."document_type__old_version_to_be_dropped";

drop type "public"."relation_type__old_version_to_be_dropped";

alter table "public"."api_checks" add column "profile_id" uuid;

alter table "public"."applications" add column "max_money_id" text;

alter table "public"."applications" add column "salary_date" smallint;

alter table "public"."claims" add column "contact_details" jsonb;

alter table "public"."otv_checks" add column "policy_id" bigint;

alter table "public"."otv_checks" alter column "application_id" drop not null;

alter table "public"."policies" add column "coverage_amount" numeric;

alter table "public"."policies" add column "employment_details" jsonb;

alter table "public"."policies" add column "user_id" uuid not null default auth.uid();

CREATE INDEX idx_pre_applications_created_at ON public.pre_applications USING btree (created_at);

CREATE INDEX idx_pre_applications_expires_at ON public.pre_applications USING btree (expires_at);

CREATE INDEX idx_pre_applications_profile_id ON public.pre_applications USING btree (profile_id);

CREATE INDEX idx_pre_applications_status ON public.pre_applications USING btree (status);

CREATE INDEX idx_pre_applications_user_id ON public.pre_applications USING btree (user_id);

CREATE UNIQUE INDEX policies_id_key ON public.policies USING btree (id);

CREATE UNIQUE INDEX policy_documents_pkey ON public.policy_documents USING btree (id);

CREATE UNIQUE INDEX pre_applications_pkey ON public.pre_applications USING btree (id);

CREATE UNIQUE INDEX resend_emails_pkey ON public.resend_emails USING btree (id);

CREATE UNIQUE INDEX sms_logs_pkey ON public.sms_logs USING btree (id);

alter table "public"."policy_documents" add constraint "policy_documents_pkey" PRIMARY KEY using index "policy_documents_pkey";

alter table "public"."pre_applications" add constraint "pre_applications_pkey" PRIMARY KEY using index "pre_applications_pkey";

alter table "public"."resend_emails" add constraint "resend_emails_pkey" PRIMARY KEY using index "resend_emails_pkey";

alter table "public"."sms_logs" add constraint "sms_logs_pkey" PRIMARY KEY using index "sms_logs_pkey";

alter table "public"."api_checks" add constraint "api_checks_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) not valid;

alter table "public"."api_checks" validate constraint "api_checks_profile_id_fkey";

alter table "public"."otv_checks" add constraint "otv_checks_policy_id_fkey" FOREIGN KEY (policy_id) REFERENCES policies(id) not valid;

alter table "public"."otv_checks" validate constraint "otv_checks_policy_id_fkey";

alter table "public"."policies" add constraint "policies_id_key" UNIQUE using index "policies_id_key";

alter table "public"."policies" add constraint "policies_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."policies" validate constraint "policies_user_id_fkey";

alter table "public"."policy_documents" add constraint "policy_documents_claim_id_fkey" FOREIGN KEY (claim_id) REFERENCES claims(id) not valid;

alter table "public"."policy_documents" validate constraint "policy_documents_claim_id_fkey";

alter table "public"."policy_documents" add constraint "policy_documents_policy_id_fkey" FOREIGN KEY (policy_id) REFERENCES policies(id) not valid;

alter table "public"."policy_documents" validate constraint "policy_documents_policy_id_fkey";

alter table "public"."policy_documents" add constraint "policy_documents_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."policy_documents" validate constraint "policy_documents_user_id_fkey";

alter table "public"."pre_applications" add constraint "pre_applications_application_id_fkey" FOREIGN KEY (application_id) REFERENCES applications(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."pre_applications" validate constraint "pre_applications_application_id_fkey";

alter table "public"."pre_applications" add constraint "pre_applications_credit_check_id_fkey" FOREIGN KEY (credit_check_id) REFERENCES api_checks(id) not valid;

alter table "public"."pre_applications" validate constraint "pre_applications_credit_check_id_fkey";

alter table "public"."pre_applications" add constraint "pre_applications_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."pre_applications" validate constraint "pre_applications_profile_id_fkey";

alter table "public"."pre_applications" add constraint "pre_applications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."pre_applications" validate constraint "pre_applications_user_id_fkey";

alter table "public"."resend_emails" add constraint "resend_emails_application_id_fkey" FOREIGN KEY (application_id) REFERENCES applications(id) not valid;

alter table "public"."resend_emails" validate constraint "resend_emails_application_id_fkey";

alter table "public"."resend_emails" add constraint "resend_emails_loan_id_fkey" FOREIGN KEY (loan_id) REFERENCES approved_loans(id) not valid;

alter table "public"."resend_emails" validate constraint "resend_emails_loan_id_fkey";

alter table "public"."resend_emails" add constraint "resend_emails_policy_id_fkey" FOREIGN KEY (policy_id) REFERENCES policies(id) not valid;

alter table "public"."resend_emails" validate constraint "resend_emails_policy_id_fkey";

alter table "public"."resend_emails" add constraint "resend_emails_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) not valid;

alter table "public"."resend_emails" validate constraint "resend_emails_profile_id_fkey";

alter table "public"."sms_logs" add constraint "sms_logs_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) not valid;

alter table "public"."sms_logs" validate constraint "sms_logs_profile_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_pre_applications_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  insert into public.profiles (id, full_name, email, phone_number)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'phone_number');
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user_signup(user_id uuid, user_full_name text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    user_email text;
BEGIN
    -- Get the email from auth.users table
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = user_id;
    
    -- Insert into profiles with the email
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (user_id, user_full_name, user_email, 'customer');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user_signup(user_id uuid, user_full_name text, phone_number text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    user_email text;
BEGIN
    -- Get the email from auth.users table
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = user_id;
    
    -- Insert into profiles with the email and phone number
    INSERT INTO public.profiles (id, full_name, email, phone_number, role)
    VALUES (user_id, user_full_name, user_email, phone_number, 'customer');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    user_role_value user_role;
    user_email text;
BEGIN
    -- Get the current user's ID from the JWT token
    IF auth.uid() IS NULL THEN
        RETURN false;
    END IF;
    
    -- Get the user's role and email from the profiles table
    SELECT role, email INTO user_role_value, user_email
    FROM profiles
    WHERE id = auth.uid();
    
    -- Check if user exists in profiles table
    IF user_role_value IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if user has admin role AND email ends with @liyanafinance.co.za
    RETURN (
        user_role_value = 'admin'::user_role 
        AND user_email IS NOT NULL 
        AND user_email LIKE '%@liyanafinance.co.za'
    );
END;
$function$
;

create policy "Admin full access on api_checks"
on "public"."api_checks"
as permissive
for all
to authenticated
using (is_admin())
with check (is_admin());


create policy "Select: profile view own checks"
on "public"."api_checks"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = profile_id));


create policy "Admin full access on applications"
on "public"."applications"
as permissive
for all
to authenticated
using (is_admin())
with check (is_admin());


create policy "Admin full access on approved_loans"
on "public"."approved_loans"
as permissive
for all
to authenticated
using (is_admin())
with check (is_admin());


create policy "User view own approved loans"
on "public"."approved_loans"
as permissive
for select
to authenticated
using (((profile_id = auth.uid()) OR is_admin()));


create policy "Admin full access on claim_payouts"
on "public"."claim_payouts"
as permissive
for all
to authenticated
using (is_admin())
with check (is_admin());


create policy "User read claim payouts"
on "public"."claim_payouts"
as permissive
for select
to authenticated
using (true);


create policy "Admin full access on claims"
on "public"."claims"
as permissive
for all
to authenticated
using (is_admin())
with check (is_admin());


create policy "User access on claims"
on "public"."claims"
as permissive
for all
to authenticated
using (true)
with check (true);


create policy "Admin full access on documents"
on "public"."documents"
as permissive
for all
to authenticated
using (is_admin())
with check (is_admin());


create policy "User access on documents"
on "public"."documents"
as permissive
for all
to authenticated
using (true)
with check (true);


create policy "Admin full access on loan_payments"
on "public"."loan_payments"
as permissive
for all
to authenticated
using (is_admin())
with check (is_admin());


create policy "User view loan payments"
on "public"."loan_payments"
as permissive
for select
to authenticated
using (true);


create policy "Admin full access on otv_checks"
on "public"."otv_checks"
as permissive
for all
to authenticated
using (is_admin())
with check (is_admin());


create policy "Admin full access on parties"
on "public"."parties"
as permissive
for all
to authenticated
using (is_admin())
with check (is_admin());


create policy "User own profile parties"
on "public"."parties"
as permissive
for all
to authenticated
using (((profile_id = auth.uid()) OR is_admin()))
with check (((profile_id = auth.uid()) OR is_admin()));


create policy "Admin full access on policies"
on "public"."policies"
as permissive
for all
to authenticated
using (is_admin())
with check (is_admin());


create policy "User access on policies"
on "public"."policies"
as permissive
for all
to authenticated
using (((user_id = auth.uid()) OR is_admin()))
with check (((user_id = auth.uid()) OR is_admin()));


create policy "Admin full access on policy_beneficiaries"
on "public"."policy_beneficiaries"
as permissive
for all
to authenticated
using (is_admin())
with check (is_admin());


create policy "User access on policy_beneficiaries"
on "public"."policy_beneficiaries"
as permissive
for all
to authenticated
using (true)
with check (true);


create policy "Admin full access on policy documents"
on "public"."policy_documents"
as permissive
for all
to authenticated
using (is_admin())
with check (is_admin());


create policy "User can perform actions on their own documents"
on "public"."policy_documents"
as permissive
for all
to authenticated
using (((user_id = auth.uid()) OR is_admin()))
with check (((user_id = auth.uid()) OR is_admin()));


create policy "Admin full access on policy_versions"
on "public"."policy_versions"
as permissive
for all
to authenticated
using (is_admin())
with check (is_admin());


create policy "User access on policy_versions"
on "public"."policy_versions"
as permissive
for all
to authenticated
using (true)
with check (true);


create policy "A User can view their own resource"
on "public"."pre_applications"
as permissive
for all
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "Admin Can perform Any Action"
on "public"."pre_applications"
as permissive
for all
to authenticated
using (is_admin())
with check (is_admin());


create policy "Admin full access on profile_documents"
on "public"."profile_documents"
as permissive
for all
to authenticated
using (is_admin())
with check (is_admin());


create policy "User own documents"
on "public"."profile_documents"
as permissive
for all
to authenticated
using (((profile_id = auth.uid()) OR is_admin()))
with check (((profile_id = auth.uid()) OR is_admin()));


create policy "Admin full access on profiles"
on "public"."profiles"
as permissive
for all
to authenticated
using (is_admin())
with check (is_admin());


create policy "User own profile"
on "public"."profiles"
as permissive
for all
to authenticated
using (((auth.uid() = id) OR is_admin()))
with check (((auth.uid() = id) OR is_admin()));


create policy "Admin Users can perform any action"
on "public"."resend_emails"
as permissive
for all
to public
using (is_admin())
with check (is_admin());


create policy "Save SMS History"
on "public"."sms_logs"
as permissive
for all
to authenticated
using (true)
with check (true);


create policy "Admin full access on transactions"
on "public"."transactions"
as permissive
for all
to authenticated
using (is_admin())
with check (is_admin());


create policy "User view transactions"
on "public"."transactions"
as permissive
for select
to authenticated
using (true);


create policy "Users can insert their own applications"
on "public"."applications"
as permissive
for insert
to authenticated
with check (true);


CREATE TRIGGER update_pre_applications_updated_at BEFORE UPDATE ON public.pre_applications FOR EACH ROW EXECUTE FUNCTION update_pre_applications_updated_at();



  create policy "Enable insert for authenticated users only"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (true);


-- Commented out storage function that doesn't exist in local environment
-- CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();

-- Commented out storage function triggers that don't exist in local environment
-- CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();

-- CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();

-- CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();

-- Commented out storage.prefixes triggers that reference missing table/functions
-- CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();

-- CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


