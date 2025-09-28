-- Local development RLS policies for applications and profiles tables
-- This migration ensures RLS is enabled and adds any missing user policies

-- Ensure RLS is enabled on both tables
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add user policies if they don't exist (using DO blocks for conditional creation)

-- Applications table policies
DO $$
BEGIN
  -- Users can view their own applications
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'applications' 
    AND policyname = 'Users can view their own applications'
  ) THEN
    CREATE POLICY "Users can view their own applications" 
    ON applications FOR SELECT 
    USING (auth.uid() = user_id);
  END IF;
  
  -- Users can insert their own applications
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'applications' 
    AND policyname = 'Users can insert their own applications'
  ) THEN
    CREATE POLICY "Users can insert their own applications" 
    ON applications FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
  END IF;
  
  -- Users can update their own applications
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'applications' 
    AND policyname = 'Users can update their own applications'
  ) THEN
    CREATE POLICY "Users can update their own applications" 
    ON applications FOR UPDATE 
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Profiles table policies
DO $$
BEGIN
  -- Users can view their own profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile" 
    ON profiles FOR SELECT 
    USING (auth.uid() = id);
  END IF;
  
  -- Users can update their own profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id);
  END IF;
  
  -- Users can insert their own profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile" 
    ON profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);
  END IF;
END $$;
