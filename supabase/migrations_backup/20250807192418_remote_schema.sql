

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
    'id_verification'
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
    'other'
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


CREATE TYPE "public"."policy_status" AS ENUM (
    'pending',
    'active',
    'lapsed',
    'cancelled'
);


ALTER TYPE "public"."policy_status" OWNER TO "postgres";


CREATE TYPE "public"."relation_type" AS ENUM (
    'spouse',
    'child',
    'parent',
    'sibling'
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

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."api_checks" (
    "id" bigint NOT NULL,
    "check_type" "public"."api_check_type" NOT NULL,
    "vendor" "public"."api_vendor" NOT NULL,
    "status" "public"."api_check_status" NOT NULL,
    "response_payload" "jsonb" NOT NULL,
    "checked_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id_number" "text" NOT NULL
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
    "bravelender_application_id" "text"
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
    "status" "public"."claim_status" NOT NULL
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



CREATE TABLE IF NOT EXISTS "public"."policies" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "policy_holder_id" "uuid" NOT NULL,
    "product_id" bigint,
    "policy_status" "public"."policy_status" NOT NULL,
    "start_date" "date" DEFAULT "now"() NOT NULL,
    "end_date" "date",
    "premium_amount" numeric NOT NULL,
    "frequency" "public"."frequency" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."policies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."funeral_policies" (
    "covered_members" "jsonb" NOT NULL
)
INHERITS ("public"."policies");


ALTER TABLE "public"."funeral_policies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."life_insurance_policies" (
    "coverage_amount" numeric(12,2) NOT NULL,
    "payout_structure" "text" NOT NULL,
    "underwriting_details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "life_insurance_policies_payout_structure_check" CHECK (("payout_structure" = ANY (ARRAY['lump_sum'::"text", 'annuity'::"text"])))
)
INHERITS ("public"."policies");


ALTER TABLE "public"."life_insurance_policies" OWNER TO "postgres";


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
    "application_id" bigint NOT NULL
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
    "updated_at" timestamp without time zone
);


ALTER TABLE "public"."parties" OWNER TO "postgres";


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



CREATE TABLE IF NOT EXISTS "public"."product_types" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."product_types" OWNER TO "postgres";


ALTER TABLE "public"."product_types" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."product_types_id_seq"
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



ALTER TABLE ONLY "public"."funeral_policies" ALTER COLUMN "created_at" SET DEFAULT "now"();



ALTER TABLE ONLY "public"."funeral_policies" ALTER COLUMN "start_date" SET DEFAULT "now"();



ALTER TABLE ONLY "public"."funeral_policies" ALTER COLUMN "updated_at" SET DEFAULT "now"();



ALTER TABLE ONLY "public"."life_insurance_policies" ALTER COLUMN "created_at" SET DEFAULT "now"();



ALTER TABLE ONLY "public"."life_insurance_policies" ALTER COLUMN "start_date" SET DEFAULT "now"();



ALTER TABLE ONLY "public"."life_insurance_policies" ALTER COLUMN "updated_at" SET DEFAULT "now"();



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



ALTER TABLE ONLY "public"."funeral_policies"
    ADD CONSTRAINT "funeral_policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."life_insurance_policies"
    ADD CONSTRAINT "life_insurance_policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."loan_payments"
    ADD CONSTRAINT "loan_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."otv_checks"
    ADD CONSTRAINT "otv_checks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parties"
    ADD CONSTRAINT "parties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."policies"
    ADD CONSTRAINT "policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."policy_beneficiaries"
    ADD CONSTRAINT "policy_beneficiaries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."policy_versions"
    ADD CONSTRAINT "policy_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_types"
    ADD CONSTRAINT "product_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profile_documents"
    ADD CONSTRAINT "profile_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_approved_loans_application_id" ON "public"."approved_loans" USING "btree" ("application_id");



CREATE INDEX "idx_approved_loans_profile_id" ON "public"."approved_loans" USING "btree" ("profile_id");



CREATE INDEX "idx_loan_payments_approved_loan_id" ON "public"."loan_payments" USING "btree" ("approved_loan_id");



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



ALTER TABLE ONLY "public"."funeral_policies"
    ADD CONSTRAINT "funeral_policies_policy_holder_id_fkey" FOREIGN KEY ("policy_holder_id") REFERENCES "public"."parties"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funeral_policies"
    ADD CONSTRAINT "funeral_policies_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product_types"("id");



ALTER TABLE ONLY "public"."life_insurance_policies"
    ADD CONSTRAINT "life_insurance_policies_policy_holder_id_fkey" FOREIGN KEY ("policy_holder_id") REFERENCES "public"."parties"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."life_insurance_policies"
    ADD CONSTRAINT "life_insurance_policies_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product_types"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."loan_payments"
    ADD CONSTRAINT "loan_payments_approved_loan_id_fkey" FOREIGN KEY ("approved_loan_id") REFERENCES "public"."approved_loans"("id");



ALTER TABLE ONLY "public"."otv_checks"
    ADD CONSTRAINT "otv_checks_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id");



ALTER TABLE ONLY "public"."parties"
    ADD CONSTRAINT "parties_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."policies"
    ADD CONSTRAINT "policies_policy_holder_id_fkey" FOREIGN KEY ("policy_holder_id") REFERENCES "public"."parties"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."policies"
    ADD CONSTRAINT "policies_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product_types"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."policy_beneficiaries"
    ADD CONSTRAINT "policy_beneficiaries_beneficiary_party_id_fkey" FOREIGN KEY ("beneficiary_party_id") REFERENCES "public"."parties"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."policy_beneficiaries"
    ADD CONSTRAINT "policy_beneficiaries_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."policy_versions"
    ADD CONSTRAINT "policy_versions_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id");



ALTER TABLE ONLY "public"."profile_documents"
    ADD CONSTRAINT "profile_documents_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_source_claim_payout_id_fkey" FOREIGN KEY ("source_claim_payout_id") REFERENCES "public"."claim_payouts"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_source_loan_id_fkey" FOREIGN KEY ("source_loan_id") REFERENCES "public"."approved_loans"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_source_policy_version_id_fkey" FOREIGN KEY ("source_policy_version_id") REFERENCES "public"."policy_versions"("id");



CREATE POLICY "Admin can delete all records from api_checks" ON "public"."api_checks" FOR DELETE TO "authenticated" USING ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin can delete all records from applications" ON "public"."applications" FOR DELETE TO "authenticated" USING ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin can delete all records from documents" ON "public"."documents" FOR DELETE TO "authenticated" USING ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin can delete all records from profiles" ON "public"."profiles" FOR DELETE TO "authenticated" USING ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin can insert records into applications" ON "public"."applications" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin can insert records into documents" ON "public"."documents" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin can insert records into profiles" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."jwt"() ->> 'email'::"text") ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin can update all records in api_checks" ON "public"."api_checks" FOR UPDATE TO "authenticated" USING ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text")) WITH CHECK ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin can update all records in applications" ON "public"."applications" FOR UPDATE TO "authenticated" USING ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text")) WITH CHECK ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin can update all records in documents" ON "public"."documents" FOR UPDATE TO "authenticated" USING ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text")) WITH CHECK ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin can update all records in profiles" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((("auth"."jwt"() ->> 'email'::"text") ~~ '%@liyanafinance.co.za%'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'email'::"text") ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin can view all applications" ON "public"."applications" FOR SELECT TO "authenticated" USING ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin can view all documents" ON "public"."documents" FOR SELECT TO "authenticated" USING ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin can view all records" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'email'::"text") ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin can view all records in api_checks" ON "public"."api_checks" FOR SELECT TO "authenticated" USING ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin users can peform all actions" ON "public"."claims" USING ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text")) WITH CHECK ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin users can perform all actions" ON "public"."funeral_policies" USING ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text")) WITH CHECK ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin users can perform all actions" ON "public"."life_insurance_policies" USING ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text")) WITH CHECK ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin users can perform all actions" ON "public"."otv_checks" USING ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text")) WITH CHECK ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin users can perform all actions" ON "public"."parties" TO "authenticated" USING ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text")) WITH CHECK ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin users can perform all actions" ON "public"."policies" USING ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text")) WITH CHECK ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin users can perform all actions" ON "public"."policy_beneficiaries" TO "authenticated" USING ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text")) WITH CHECK ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin users can perform all actions" ON "public"."policy_versions" USING ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text")) WITH CHECK ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admin users can perform all actions" ON "public"."transactions" USING ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text")) WITH CHECK ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admins Can Insert Documents" ON "public"."profile_documents" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."jwt"() ->> 'email'::"text") ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admins can delete" ON "public"."profile_documents" FOR DELETE TO "authenticated" USING ((("auth"."jwt"() ->> 'email'::"text") ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Admins can select documents" ON "public"."profile_documents" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'email'::"text") ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."api_checks" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."claim_payouts" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."claims" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."funeral_policies" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."life_insurance_policies" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."otv_checks" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."parties" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."policies" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."policy_beneficiaries" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."policy_versions" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."transactions" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."product_types" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable select for authenticated users only" ON "public"."otv_checks" FOR SELECT TO "authenticated" USING ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "LiyanaFinance staff can manage approved loans" ON "public"."approved_loans" TO "authenticated" WITH CHECK (("right"(("auth"."jwt"() ->> 'email'::"text"), 16) = '@liyanafinance.com'::"text"));



CREATE POLICY "LiyanaFinance staff can manage loan payments" ON "public"."loan_payments" TO "authenticated" WITH CHECK ((( SELECT ("auth"."jwt"() ->> 'email'::"text")) ~~ '%@liyanafinance.co.za%'::"text"));



CREATE POLICY "Users can delete their own applications" ON "public"."applications" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their own documents" ON "public"."documents" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their own profiles" ON "public"."profiles" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can insert their own applications" ON "public"."applications" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own documents" ON "public"."documents" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own profiles" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can update their own applications" ON "public"."applications" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own documents" ON "public"."documents" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own profiles" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can view their own applications" ON "public"."applications" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own approved loans" ON "public"."approved_loans" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."applications"
  WHERE (("applications"."id" = "approved_loans"."application_id") AND ("applications"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own documents" ON "public"."documents" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own loan payments" ON "public"."loan_payments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."approved_loans"
     JOIN "public"."applications" ON (("approved_loans"."application_id" = "applications"."id")))
  WHERE (("loan_payments"."approved_loan_id" = "approved_loans"."id") AND ("applications"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



ALTER TABLE "public"."api_checks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."approved_loans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."claim_payouts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."claims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."funeral_policies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."life_insurance_policies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."loan_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."otv_checks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."policies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."policy_beneficiaries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."policy_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profile_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


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



GRANT ALL ON TABLE "public"."policies" TO "anon";
GRANT ALL ON TABLE "public"."policies" TO "authenticated";
GRANT ALL ON TABLE "public"."policies" TO "service_role";



GRANT ALL ON TABLE "public"."funeral_policies" TO "anon";
GRANT ALL ON TABLE "public"."funeral_policies" TO "authenticated";
GRANT ALL ON TABLE "public"."funeral_policies" TO "service_role";



GRANT ALL ON TABLE "public"."life_insurance_policies" TO "anon";
GRANT ALL ON TABLE "public"."life_insurance_policies" TO "authenticated";
GRANT ALL ON TABLE "public"."life_insurance_policies" TO "service_role";



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



GRANT ALL ON SEQUENCE "public"."policies_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."policies_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."policies_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."policy_beneficiaries" TO "anon";
GRANT ALL ON TABLE "public"."policy_beneficiaries" TO "authenticated";
GRANT ALL ON TABLE "public"."policy_beneficiaries" TO "service_role";



GRANT ALL ON SEQUENCE "public"."policy_beneficiaries_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."policy_beneficiaries_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."policy_beneficiaries_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."policy_versions" TO "anon";
GRANT ALL ON TABLE "public"."policy_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."policy_versions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."policy_versions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."policy_versions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."policy_versions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."product_types" TO "anon";
GRANT ALL ON TABLE "public"."product_types" TO "authenticated";
GRANT ALL ON TABLE "public"."product_types" TO "service_role";



GRANT ALL ON SEQUENCE "public"."product_types_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."product_types_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."product_types_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profile_documents" TO "anon";
GRANT ALL ON TABLE "public"."profile_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_documents" TO "service_role";



GRANT ALL ON SEQUENCE "public"."profile_documents_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."profile_documents_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."profile_documents_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



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






























RESET ALL;
