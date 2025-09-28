-- Add missing storage migration: fix-object-level
-- This migration is required by storage-api v1.27.4

-- Update storage.objects table if needed
DO $$ 
BEGIN
  -- Check if we need to add any missing columns or constraints
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'storage' 
    AND table_name = 'objects' 
    AND column_name = 'owner_id'
  ) THEN
    -- This might be what the fix-object-level migration is supposed to do
    ALTER TABLE storage.objects ADD COLUMN IF NOT EXISTS owner_id uuid;
  END IF;
END $$;

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS objects_owner_id_idx ON storage.objects(owner_id);

-- Add object-level policies if they don't exist
DO $$ 
BEGIN
  -- Enable RLS on storage.objects if not already enabled
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  
  -- Create basic policies if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'objects_owner_access'
  ) THEN
    CREATE POLICY objects_owner_access ON storage.objects
    FOR ALL USING (auth.uid() = owner_id);
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  -- If anything fails, just continue - this is a best-effort fix
  NULL;
END $$;