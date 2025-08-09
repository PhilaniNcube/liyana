-- Seed script: multiple users and multiple applications per user
-- Idempotent-ish: checks for existing user by email; avoids duplicate application inserts with NOT EXISTS

-- Ensure pgcrypto is available for password hashing and UUIDs
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  v_now timestamptz := now();
  v_user_id uuid;
  u record;
BEGIN
  -- Loop through a set of seed users
  FOR u IN
    SELECT * FROM (
      VALUES
        ('seed-alice@liyanafinance.co.za', 'Alice Seed', '+27710000001'),
        ('seed-bob@liyanafinance.co.za',   'Bob Seed',   '+27710000002'),
        ('seed-cara@liyanafinance.co.za',  'Cara Seed',  '+27710000003'),
        ('seed-dan@liyanafinance.co.za',   'Dan Seed',   '+27710000004')
    ) AS t(email, full_name, phone)
  LOOP
    -- Find existing user by email or create a new one
    SELECT id INTO v_user_id FROM auth.users WHERE email = u.email LIMIT 1;

    IF NOT FOUND THEN
      v_user_id := gen_random_uuid();
      INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        invited_at,
        last_sign_in_at,
        created_at,
        updated_at,
        aud,
        role,
        raw_user_meta_data
      ) VALUES (
        v_user_id,
        u.email,
        crypt('Password123!', gen_salt('bf')),
        v_now,
        v_now,
        v_now,
        v_now,
        v_now,
        'authenticated',
        'authenticated',
        jsonb_build_object('full_name', u.full_name, 'phone_number', u.phone)
      );
      -- Profile will be created automatically by the auth trigger
    END IF;

    -- Insert two sample applications per user (guarded to avoid duplicates across runs)
    -- Application A
    INSERT INTO public.applications (
      user_id, id_number, date_of_birth, application_amount, term, status,
      monthly_income, employment_type, employer_name, job_title, loan_purpose,
      home_address, city, phone_number, postal_code, marital_status, dependants,
      nationality, language, gender, created_at, updated_at
    )
  SELECT v_user_id, 'NTg0OGI0ZDNiNGYyODNkOGZjM2YzNzIyYzIyNjhiN2I6YzI0YmFiNjdjZjU0ZjdjMGIyNmQxZjg1NzZjMGE5Njc=', '1980-01-01', 5000, 12, 'in_review',
           15000, 'employed', 'Acme Corp', 'Engineer', 'debt_consolidation',
           '123 Main St', 'Johannesburg', '0712345678', '2001', 'single', 0,
           'South African', 'en', 'male', v_now, v_now
    WHERE NOT EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.user_id = v_user_id AND a.status = 'in_review' AND a.application_amount = 5000 AND a.term = 12
    );

    -- Application B
    INSERT INTO public.applications (
      user_id, id_number, date_of_birth, application_amount, term, status,
      monthly_income, employment_type, employer_name, job_title, loan_purpose,
      home_address, city, phone_number, postal_code, marital_status, dependants,
      nationality, language, gender, created_at, updated_at
    )
  SELECT v_user_id, 'YTg2MjNjZjFiNWU0OTcxYTk4YThhYzgzZDQ3NTg3OTc6MGQ2NjFiYzJhNjM5ZGZlZjBjODY4ZWZlYTU1NjJmZDQ=', '1990-02-02', 10000, 6, 'approved',
           28000, 'contract', 'Globex', 'Analyst', 'home_improvement',
           '45 Pine Rd', 'Cape Town', '0723456789', '8000', 'married', 1,
           'South African', 'en', 'female', v_now, v_now
    WHERE NOT EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.user_id = v_user_id AND a.status = 'approved' AND a.application_amount = 10000 AND a.term = 6
    );

    -- Optional third application with varied status for first two users
    IF u.email IN ('seed-alice@liyanafinance.co.za', 'seed-bob@liyanafinance.co.za') THEN
      INSERT INTO public.applications (
        user_id, id_number, date_of_birth, application_amount, term, status,
        monthly_income, employment_type, employer_name, job_title, loan_purpose,
        home_address, city, phone_number, postal_code, marital_status, dependants,
        nationality, language, gender, created_at, updated_at
      )
  SELECT v_user_id, 'YWY0YzZkYzQ0NDU2ZjZjOGEzYzM1YjEwNGQ1ZTEwYTM6OTNhOGM1Mjc4ODEwNmFmZWU2NzJiNDAwZTY2ODYyZmM=', '1985-03-03', 3000, 3, 'declined',
             9000, 'unemployed', NULL, NULL, 'emergency_expense',
             '12 Beach Rd', 'Gqeberha', '0745678901', '6001', 'single', 0,
             'South African', 'en', 'other', v_now, v_now
      WHERE NOT EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.user_id = v_user_id AND a.status = 'declined' AND a.application_amount = 3000 AND a.term = 3
      );
    END IF;

  END LOOP;
END $$;
