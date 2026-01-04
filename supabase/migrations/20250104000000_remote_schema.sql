

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."api_check_status" AS ENUM (
    'passed',
    'failed',
    'pending'
);


ALTER TYPE "public"."api_check_status" OWNER TO "postgres";


CREATE TYPE "public"."api_check_type" AS ENUM (
    'credit_bureau',
    'fraud_check',
    'bank_verification',
    'dha_otv_facial',
    'email_verification',
    'employment_verification',
    'address_verification',
    'cellphone_verification',
    'id_verification',
    'deceased_status'
);


ALTER TYPE "public"."api_check_type" OWNER TO "postgres";


CREATE TYPE "public"."api_vendor" AS ENUM (
    'Experian',
    'WhoYou',
    'ThisIsMe'
);


ALTER TYPE "public"."api_vendor" OWNER TO "postgres";


CREATE TYPE "public"."application_status" AS ENUM (
    'pre_qualifier',
    'pending_documents',
    'in_review',
    'approved',
    'declined',
    'submitted_to_lender',
    'submission_failed'
);


ALTER TYPE "public"."application_status" OWNER TO "postgres";


CREATE TYPE "public"."bank_account_type" AS ENUM (
    'savings',
    'transaction',
    'current',
    'business'
);


ALTER TYPE "public"."bank_account_type" OWNER TO "postgres";


CREATE TYPE "public"."claim_status" AS ENUM (
    'submitted',
    'under_review',
    'approved',
    'denied',
    'paid'
);


ALTER TYPE "public"."claim_status" OWNER TO "postgres";


CREATE TYPE "public"."document_type" AS ENUM (
    'id',
    'bank_statement',
    'payslip',
    'proof_of_residence',
    'contract',
    'photo',
    'credit_report',
    'other',
    'third_party_verification'
);


ALTER TYPE "public"."document_type" OWNER TO "postgres";


CREATE TYPE "public"."employment_type" AS ENUM (
    'employed',
    'self_employed',
    'contract',
    'unemployed',
    'retired'
);


ALTER TYPE "public"."employment_type" OWNER TO "postgres";


CREATE TYPE "public"."frequency" AS ENUM (
    'monthly',
    'quarterly',
    'annually'
);


ALTER TYPE "public"."frequency" OWNER TO "postgres";


CREATE TYPE "public"."gender" AS ENUM (
    'male',
    'female',
    'rather not say',
    'other'
);


ALTER TYPE "public"."gender" OWNER TO "postgres";


CREATE TYPE "public"."marital_status" AS ENUM (
    'single',
    'married',
    'divorced',
    'widowed',
    'life_partner'
);


ALTER TYPE "public"."marital_status" OWNER TO "postgres";


CREATE TYPE "public"."party_type" AS ENUM (
    'individual',
    'organization'
);


ALTER TYPE "public"."party_type" OWNER TO "postgres";


CREATE TYPE "public"."policy_document_type" AS ENUM (
    'birth_certificate',
    'death_certificate',
    'marriage_certificate',
    'identity_document',
    'passport',
    'third_party_document',
    'proof_of_banking',
    'payslip',
    'drivers_license'
);


ALTER TYPE "public"."policy_document_type" OWNER TO "postgres";


CREATE TYPE "public"."policy_status" AS ENUM (
    'pending',
    'active',
    'lapsed',
    'cancelled'
);


ALTER TYPE "public"."policy_status" OWNER TO "postgres";


CREATE TYPE "public"."pre_application_status" AS ENUM (
    'credit_passed',
    'application_started',
    'application_completed',
    'abandoned',
    'cancelled'
);


ALTER TYPE "public"."pre_application_status" OWNER TO "postgres";


CREATE TYPE "public"."product_type" AS ENUM (
    'funeral_policy',
    'life_insurance',
    'payday_loan'
);


ALTER TYPE "public"."product_type" OWNER TO "postgres";


CREATE TYPE "public"."relation_type" AS ENUM (
    'spouse',
    'child',
    'parent',
    'sibling',
    'cousin',
    'grandparent',
    'in-law'
);


ALTER TYPE "public"."relation_type" OWNER TO "postgres";


CREATE TYPE "public"."transaction_status" AS ENUM (
    'pending',
    'completed',
    'failed'
);


ALTER TYPE "public"."transaction_status" OWNER TO "postgres";


CREATE TYPE "public"."transaction_type" AS ENUM (
    'premium_payment',
    'claim_payout',
    'loan_disbursement',
    'loan_repayment',
    'refund'
);


ALTER TYPE "public"."transaction_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'customer',
    'admin',
    'editor'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.profiles (id, full_name, email, phone_number)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'phone_number');
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_signup"("user_id" "uuid", "user_full_name" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_new_user_signup"("user_id" "uuid", "user_full_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_signup"("user_id" "uuid", "user_full_name" "text", "phone_number" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_new_user_signup"("user_id" "uuid", "user_full_name" "text", "phone_number" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_pre_applications_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_pre_applications_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."api_checks" (
    "id" bigint NOT NULL,
    "check_type" "public"."api_check_type" NOT NULL,
    "vendor" "public"."api_vendor" NOT NULL,
    "status" "public"."api_check_status" NOT NULL,
    "response_payload" "jsonb" NOT NULL,
    "checked_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_number" "text" NOT NULL,
    "profile_id" "uuid"
);


ALTER TABLE "public"."api_checks" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."api_checks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."api_checks_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."api_checks_id_seq" OWNED BY "public"."api_checks"."id";



CREATE TABLE IF NOT EXISTS "public"."applications" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "id_number" "text" NOT NULL,
    "date_of_birth" "date",
    "application_amount" numeric,
    "term" double precision NOT NULL,
    "status" "public"."application_status" NOT NULL,
    "decline_reason" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "monthly_income" numeric,
    "work_experience" "text",
    "employment_type" "public"."employment_type",
    "employer_name" "text",
    "employer_address" "text",
    "job_title" "text",
    "employer_contact_number" "text",
    "next_of_kin_name" "text",
    "next_of_kin_phone_number" "text",
    "next_of_kin_email" "text",
    "home_address" "text",
    "city" "text",
    "loan_purpose" "text",
    "bank_name" "text",
    "bank_account_number" "text",
    "branch_code" "text",
    "employment_end_date" "date",
    "loan_purpose_reason" "text",
    "bank_account_type" "public"."bank_account_type",
    "bank_account_holder" "text",
    "marital_status" "public"."marital_status",
    "dependants" integer,
    "nationality" "text",
    "language" "text",
    "gender" "public"."gender",
    "gender_other" "text",
    "affordability" "jsonb",
    "phone_number" "text",
    "postal_code" "text",
    "bravelender_application_id" "text",
    "salary_date" smallint,
    "max_money_id" "text"
);


ALTER TABLE "public"."applications" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."applications_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."applications_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."applications_id_seq" OWNED BY "public"."applications"."id";



CREATE TABLE IF NOT EXISTS "public"."approved_loans" (
    "id" bigint NOT NULL,
    "application_id" bigint NOT NULL,
    "loan_term_days" integer NOT NULL,
    "interest_rate" numeric(5,2) NOT NULL,
    "approved_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "total_repayment_amount" numeric(12,2) NOT NULL,
    "monthly_payment" numeric(12,2) NOT NULL,
    "next_payment_date" "date",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "profile_id" "uuid" NOT NULL,
    "initiation_fee" numeric NOT NULL,
    "service_fee" numeric NOT NULL,
    "approved_loan_amount" numeric(12,2),
    CONSTRAINT "approved_loans_interest_rate_check" CHECK (("interest_rate" >= (0)::numeric)),
    CONSTRAINT "approved_loans_loan_term_days_check" CHECK ((("loan_term_days" >= 5) AND ("loan_term_days" <= 60))),
    CONSTRAINT "approved_loans_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'paid_off'::"text", 'defaulted'::"text"])))
);


ALTER TABLE "public"."approved_loans" OWNER TO "postgres";


ALTER TABLE "public"."approved_loans" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."approved_loans_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."claim_payouts" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "claim_id" bigint NOT NULL,
    "beneficiary_party_id" "uuid" NOT NULL,
    "payout_date" timestamp with time zone NOT NULL,
    "amount" numeric NOT NULL
);


ALTER TABLE "public"."claim_payouts" OWNER TO "postgres";


ALTER TABLE "public"."claim_payouts" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."claim_payouts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."claims" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "policy_id" bigint NOT NULL,
    "claimant_party_id" "uuid" NOT NULL,
    "claim_number" "text" NOT NULL,
    "date_of_incident" "date" NOT NULL,
    "date_filed" timestamp with time zone NOT NULL,
    "status" "public"."claim_status" NOT NULL,
    "contact_details" "jsonb"
);


ALTER TABLE "public"."claims" OWNER TO "postgres";


ALTER TABLE "public"."claims" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."claims_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" bigint NOT NULL,
    "application_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "document_type" "public"."document_type" NOT NULL,
    "storage_path" "text" NOT NULL,
    "uploaded_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."documents_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."documents_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."documents_id_seq" OWNED BY "public"."documents"."id";



CREATE TABLE IF NOT EXISTS "public"."loan_payments" (
    "id" bigint NOT NULL,
    "approved_loan_id" bigint NOT NULL,
    "payment_amount" numeric(12,2) NOT NULL,
    "payment_date" timestamp with time zone DEFAULT "now"(),
    "payment_method" "text",
    "status" "text" DEFAULT 'completed'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "loan_payments_status_check" CHECK (("status" = ANY (ARRAY['completed'::"text", 'failed'::"text", 'pending'::"text"])))
);


ALTER TABLE "public"."loan_payments" OWNER TO "postgres";


ALTER TABLE "public"."loan_payments" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."loan_payments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."otv_checks" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "pin_code" "text" NOT NULL,
    "id_number" "text" NOT NULL,
    "application_id" bigint,
    "policy_id" bigint
);


ALTER TABLE "public"."otv_checks" OWNER TO "postgres";


ALTER TABLE "public"."otv_checks" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."otv_checks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."parties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "profile_id" "uuid",
    "party_type" "public"."party_type" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "organization_name" "text",
    "date_of_birth" "date",
    "id_number" "text",
    "contact_details" "jsonb",
    "address_details" "jsonb",
    "updated_at" timestamp without time zone,
    "banking_details" "jsonb",
    CONSTRAINT "parties_banking_details_is_object" CHECK ((("banking_details" IS NULL) OR ("jsonb_typeof"("banking_details") = 'object'::"text")))
);


ALTER TABLE "public"."parties" OWNER TO "postgres";


COMMENT ON COLUMN "public"."parties"."banking_details" IS 'Banking details JSON object: {account_name, bank_name, account_number, branch_code, account_type}';



CREATE TABLE IF NOT EXISTS "public"."policies" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "policy_holder_id" "uuid" NOT NULL,
    "policy_status" "public"."policy_status" NOT NULL,
    "start_date" "date" DEFAULT "now"(),
    "end_date" "date",
    "premium_amount" numeric,
    "frequency" "public"."frequency" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "product_type" "public"."product_type",
    "employment_details" "jsonb",
    "coverage_amount" numeric,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL
);


ALTER TABLE "public"."policies" OWNER TO "postgres";


ALTER TABLE "public"."policies" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."policies_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."policy_beneficiaries" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "policy_id" bigint NOT NULL,
    "beneficiary_party_id" "uuid" NOT NULL,
    "relation_type" "public"."relation_type" NOT NULL,
    "allocation_percentage" numeric NOT NULL
);


ALTER TABLE "public"."policy_beneficiaries" OWNER TO "postgres";


ALTER TABLE "public"."policy_beneficiaries" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."policy_beneficiaries_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."policy_documents" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "document_type" "public"."policy_document_type" NOT NULL,
    "path" "text" NOT NULL,
    "policy_id" bigint NOT NULL,
    "claim_id" bigint
);


ALTER TABLE "public"."policy_documents" OWNER TO "postgres";


ALTER TABLE "public"."policy_documents" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."policy_documents_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."policy_versions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "policy_id" bigint NOT NULL,
    "version_number" smallint NOT NULL,
    "policy_data" "jsonb" NOT NULL,
    "effective_from" timestamp with time zone NOT NULL,
    "reason_for_change" "text"
);


ALTER TABLE "public"."policy_versions" OWNER TO "postgres";


ALTER TABLE "public"."policy_versions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."policy_versions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."pre_applications" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp without time zone,
    "profile_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "id_number" "text" NOT NULL,
    "credit_check_id" bigint NOT NULL,
    "credit_score" bigint NOT NULL,
    "status" "public"."pre_application_status" NOT NULL,
    "application_id" bigint
);


ALTER TABLE "public"."pre_applications" OWNER TO "postgres";


ALTER TABLE "public"."pre_applications" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."pre_applications_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profile_documents" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "document_type" "public"."document_type" NOT NULL,
    "path" "text" NOT NULL
);


ALTER TABLE "public"."profile_documents" OWNER TO "postgres";


ALTER TABLE "public"."profile_documents" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."profile_documents_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "role" "public"."user_role" DEFAULT 'customer'::"public"."user_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" "text" DEFAULT (("current_setting"('request.jwt.claims'::"text", true))::"json" ->> 'email'::"text"),
    "phone_number" "text",
    "id_number" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resend_emails" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resend_id" "text" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "application_id" bigint,
    "loan_id" bigint,
    "policy_id" bigint
);


ALTER TABLE "public"."resend_emails" OWNER TO "postgres";


ALTER TABLE "public"."resend_emails" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."resend_emails_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."sms_logs" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "phone_number" "text" NOT NULL,
    "message" character varying NOT NULL,
    "profile_id" "uuid" NOT NULL
);


ALTER TABLE "public"."sms_logs" OWNER TO "postgres";


ALTER TABLE "public"."sms_logs" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."sms_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source_policy_version_id" bigint,
    "source_claim_payout_id" bigint,
    "source_loan_id" bigint,
    "amount" numeric NOT NULL,
    "transaction_type" "public"."transaction_type" NOT NULL,
    "transaction_status" "public"."transaction_status" NOT NULL,
    "payment_ref" "text",
    "metadata" "jsonb"
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."api_checks" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."api_checks_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."applications" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."applications_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."documents" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."documents_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."api_checks"
    ADD CONSTRAINT "api_checks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."approved_loans"
    ADD CONSTRAINT "approved_loans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."claim_payouts"
    ADD CONSTRAINT "claim_payouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_claim_number_key" UNIQUE ("claim_number");



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."loan_payments"
    ADD CONSTRAINT "loan_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."otv_checks"
    ADD CONSTRAINT "otv_checks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parties"
    ADD CONSTRAINT "parties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."policies"
    ADD CONSTRAINT "policies_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."policies"
    ADD CONSTRAINT "policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."policy_beneficiaries"
    ADD CONSTRAINT "policy_beneficiaries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."policy_documents"
    ADD CONSTRAINT "policy_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."policy_versions"
    ADD CONSTRAINT "policy_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pre_applications"
    ADD CONSTRAINT "pre_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profile_documents"
    ADD CONSTRAINT "profile_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resend_emails"
    ADD CONSTRAINT "resend_emails_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sms_logs"
    ADD CONSTRAINT "sms_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_approved_loans_application_id" ON "public"."approved_loans" USING "btree" ("application_id");



CREATE INDEX "idx_approved_loans_profile_id" ON "public"."approved_loans" USING "btree" ("profile_id");



CREATE INDEX "idx_loan_payments_approved_loan_id" ON "public"."loan_payments" USING "btree" ("approved_loan_id");



CREATE INDEX "idx_pre_applications_created_at" ON "public"."pre_applications" USING "btree" ("created_at");



CREATE INDEX "idx_pre_applications_expires_at" ON "public"."pre_applications" USING "btree" ("expires_at");



CREATE INDEX "idx_pre_applications_profile_id" ON "public"."pre_applications" USING "btree" ("profile_id");



CREATE INDEX "idx_pre_applications_status" ON "public"."pre_applications" USING "btree" ("status");



CREATE INDEX "idx_pre_applications_user_id" ON "public"."pre_applications" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "update_pre_applications_updated_at" BEFORE UPDATE ON "public"."pre_applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_pre_applications_updated_at"();



ALTER TABLE ONLY "public"."api_checks"
    ADD CONSTRAINT "api_checks_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."approved_loans"
    ADD CONSTRAINT "approved_loans_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id");



ALTER TABLE ONLY "public"."claim_payouts"
    ADD CONSTRAINT "claim_payouts_beneficiary_party_id_fkey" FOREIGN KEY ("beneficiary_party_id") REFERENCES "public"."parties"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."claim_payouts"
    ADD CONSTRAINT "claim_payouts_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_claimant_party_id_fkey" FOREIGN KEY ("claimant_party_id") REFERENCES "public"."parties"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."approved_loans"
    ADD CONSTRAINT "fk_approved_loans_profiles" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."loan_payments"
    ADD CONSTRAINT "loan_payments_approved_loan_id_fkey" FOREIGN KEY ("approved_loan_id") REFERENCES "public"."approved_loans"("id");



ALTER TABLE ONLY "public"."otv_checks"
    ADD CONSTRAINT "otv_checks_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id");



ALTER TABLE ONLY "public"."otv_checks"
    ADD CONSTRAINT "otv_checks_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id");



ALTER TABLE ONLY "public"."parties"
    ADD CONSTRAINT "parties_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."policies"
    ADD CONSTRAINT "policies_policy_holder_id_fkey" FOREIGN KEY ("policy_holder_id") REFERENCES "public"."parties"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."policies"
    ADD CONSTRAINT "policies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."policy_beneficiaries"
    ADD CONSTRAINT "policy_beneficiaries_beneficiary_party_id_fkey" FOREIGN KEY ("beneficiary_party_id") REFERENCES "public"."parties"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."policy_beneficiaries"
    ADD CONSTRAINT "policy_beneficiaries_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."policy_documents"
    ADD CONSTRAINT "policy_documents_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id");



ALTER TABLE ONLY "public"."policy_documents"
    ADD CONSTRAINT "policy_documents_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id");



ALTER TABLE ONLY "public"."policy_documents"
    ADD CONSTRAINT "policy_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."policy_versions"
    ADD CONSTRAINT "policy_versions_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id");



ALTER TABLE ONLY "public"."pre_applications"
    ADD CONSTRAINT "pre_applications_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pre_applications"
    ADD CONSTRAINT "pre_applications_credit_check_id_fkey" FOREIGN KEY ("credit_check_id") REFERENCES "public"."api_checks"("id");



ALTER TABLE ONLY "public"."pre_applications"
    ADD CONSTRAINT "pre_applications_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pre_applications"
    ADD CONSTRAINT "pre_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_documents"
    ADD CONSTRAINT "profile_documents_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."resend_emails"
    ADD CONSTRAINT "resend_emails_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id");



ALTER TABLE ONLY "public"."resend_emails"
    ADD CONSTRAINT "resend_emails_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "public"."approved_loans"("id");



ALTER TABLE ONLY "public"."resend_emails"
    ADD CONSTRAINT "resend_emails_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id");



ALTER TABLE ONLY "public"."resend_emails"
    ADD CONSTRAINT "resend_emails_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."sms_logs"
    ADD CONSTRAINT "sms_logs_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_source_claim_payout_id_fkey" FOREIGN KEY ("source_claim_payout_id") REFERENCES "public"."claim_payouts"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_source_loan_id_fkey" FOREIGN KEY ("source_loan_id") REFERENCES "public"."approved_loans"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_source_policy_version_id_fkey" FOREIGN KEY ("source_policy_version_id") REFERENCES "public"."policy_versions"("id");



CREATE POLICY "A User can view their own resource" ON "public"."pre_applications" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Admin Can perform Any Action" ON "public"."pre_applications" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin Users can perform any action" ON "public"."resend_emails" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin can delete all records from applications" ON "public"."applications" FOR DELETE TO "authenticated" USING ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin can delete all records from profiles" ON "public"."profiles" FOR DELETE TO "authenticated" USING ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin can insert records into applications" ON "public"."applications" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin can insert records into profiles" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."jwt"() ->> 'email'::"text") ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin can update all records in applications" ON "public"."applications" FOR UPDATE TO "authenticated" USING ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text")) WITH CHECK ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin can update all records in profiles" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((("auth"."jwt"() ->> 'email'::"text") ~~ '%@liyanafinance.co.za%'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'email'::"text") ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin can view all records" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'email'::"text") ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin full access on api_checks" ON "public"."api_checks" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin full access on applications" ON "public"."applications" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin full access on approved_loans" ON "public"."approved_loans" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin full access on claim_payouts" ON "public"."claim_payouts" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin full access on claims" ON "public"."claims" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin full access on documents" ON "public"."documents" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin full access on loan_payments" ON "public"."loan_payments" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin full access on otv_checks" ON "public"."otv_checks" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin full access on parties" ON "public"."parties" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin full access on policies" ON "public"."policies" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin full access on policy documents" ON "public"."policy_documents" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin full access on policy_beneficiaries" ON "public"."policy_beneficiaries" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin full access on policy_versions" ON "public"."policy_versions" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin full access on profile_documents" ON "public"."profile_documents" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin full access on profiles" ON "public"."profiles" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin full access on transactions" ON "public"."transactions" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Enable insert for authenticated users only" ON "public"."api_checks" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Save SMS History" ON "public"."sms_logs" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Select: profile view own checks" ON "public"."api_checks" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "profile_id"));



CREATE POLICY "User access on claims" ON "public"."claims" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "User access on documents" ON "public"."documents" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "User access on policies" ON "public"."policies" TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"())) WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "User access on policy_beneficiaries" ON "public"."policy_beneficiaries" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "User access on policy_versions" ON "public"."policy_versions" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "User can perform actions on their own documents" ON "public"."policy_documents" TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"())) WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "User own documents" ON "public"."profile_documents" TO "authenticated" USING ((("profile_id" = "auth"."uid"()) OR "public"."is_admin"())) WITH CHECK ((("profile_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "User own profile" ON "public"."profiles" TO "authenticated" USING ((("auth"."uid"() = "id") OR "public"."is_admin"())) WITH CHECK ((("auth"."uid"() = "id") OR "public"."is_admin"()));



CREATE POLICY "User own profile parties" ON "public"."parties" TO "authenticated" USING ((("profile_id" = "auth"."uid"()) OR "public"."is_admin"())) WITH CHECK ((("profile_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "User read claim payouts" ON "public"."claim_payouts" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "User view loan payments" ON "public"."loan_payments" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "User view own approved loans" ON "public"."approved_loans" FOR SELECT TO "authenticated" USING ((("profile_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "User view transactions" ON "public"."transactions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can delete their own applications" ON "public"."applications" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their own profiles" ON "public"."profiles" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can insert their own applications" ON "public"."applications" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Users can insert their own profiles" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can update their own applications" ON "public"."applications" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own profiles" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can view their own applications" ON "public"."applications" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



ALTER TABLE "public"."api_checks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."approved_loans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."claim_payouts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."claims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."loan_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."otv_checks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."policies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."policy_beneficiaries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."policy_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."policy_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pre_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profile_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resend_emails" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sms_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_signup"("user_id" "uuid", "user_full_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_signup"("user_id" "uuid", "user_full_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_signup"("user_id" "uuid", "user_full_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_signup"("user_id" "uuid", "user_full_name" "text", "phone_number" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_signup"("user_id" "uuid", "user_full_name" "text", "phone_number" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_signup"("user_id" "uuid", "user_full_name" "text", "phone_number" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_pre_applications_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_pre_applications_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_pre_applications_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."api_checks" TO "anon";
GRANT ALL ON TABLE "public"."api_checks" TO "authenticated";
GRANT ALL ON TABLE "public"."api_checks" TO "service_role";



GRANT ALL ON SEQUENCE "public"."api_checks_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."api_checks_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."api_checks_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."applications" TO "anon";
GRANT ALL ON TABLE "public"."applications" TO "authenticated";
GRANT ALL ON TABLE "public"."applications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."applications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."applications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."applications_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."approved_loans" TO "anon";
GRANT ALL ON TABLE "public"."approved_loans" TO "authenticated";
GRANT ALL ON TABLE "public"."approved_loans" TO "service_role";



GRANT ALL ON SEQUENCE "public"."approved_loans_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."approved_loans_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."approved_loans_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."claim_payouts" TO "anon";
GRANT ALL ON TABLE "public"."claim_payouts" TO "authenticated";
GRANT ALL ON TABLE "public"."claim_payouts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."claim_payouts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."claim_payouts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."claim_payouts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."claims" TO "anon";
GRANT ALL ON TABLE "public"."claims" TO "authenticated";
GRANT ALL ON TABLE "public"."claims" TO "service_role";



GRANT ALL ON SEQUENCE "public"."claims_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."claims_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."claims_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON SEQUENCE "public"."documents_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."documents_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."documents_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."loan_payments" TO "anon";
GRANT ALL ON TABLE "public"."loan_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."loan_payments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."loan_payments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."loan_payments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."loan_payments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."otv_checks" TO "anon";
GRANT ALL ON TABLE "public"."otv_checks" TO "authenticated";
GRANT ALL ON TABLE "public"."otv_checks" TO "service_role";



GRANT ALL ON SEQUENCE "public"."otv_checks_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."otv_checks_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."otv_checks_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."parties" TO "anon";
GRANT ALL ON TABLE "public"."parties" TO "authenticated";
GRANT ALL ON TABLE "public"."parties" TO "service_role";



GRANT ALL ON TABLE "public"."policies" TO "anon";
GRANT ALL ON TABLE "public"."policies" TO "authenticated";
GRANT ALL ON TABLE "public"."policies" TO "service_role";



GRANT ALL ON SEQUENCE "public"."policies_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."policies_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."policies_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."policy_beneficiaries" TO "anon";
GRANT ALL ON TABLE "public"."policy_beneficiaries" TO "authenticated";
GRANT ALL ON TABLE "public"."policy_beneficiaries" TO "service_role";



GRANT ALL ON SEQUENCE "public"."policy_beneficiaries_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."policy_beneficiaries_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."policy_beneficiaries_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."policy_documents" TO "anon";
GRANT ALL ON TABLE "public"."policy_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."policy_documents" TO "service_role";



GRANT ALL ON SEQUENCE "public"."policy_documents_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."policy_documents_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."policy_documents_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."policy_versions" TO "anon";
GRANT ALL ON TABLE "public"."policy_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."policy_versions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."policy_versions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."policy_versions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."policy_versions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pre_applications" TO "anon";
GRANT ALL ON TABLE "public"."pre_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."pre_applications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pre_applications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."pre_applications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pre_applications_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profile_documents" TO "anon";
GRANT ALL ON TABLE "public"."profile_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_documents" TO "service_role";



GRANT ALL ON SEQUENCE "public"."profile_documents_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."profile_documents_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."profile_documents_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."resend_emails" TO "anon";
GRANT ALL ON TABLE "public"."resend_emails" TO "authenticated";
GRANT ALL ON TABLE "public"."resend_emails" TO "service_role";



GRANT ALL ON SEQUENCE "public"."resend_emails_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."resend_emails_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."resend_emails_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sms_logs" TO "anon";
GRANT ALL ON TABLE "public"."sms_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."sms_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sms_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sms_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sms_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























