-- Storage migration to fix missing fix-object-level migration
-- This addresses the storage container startup error

-- Create the storage.objects table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage.objects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_accessed_at timestamptz DEFAULT now(),
    metadata jsonb,
    version text,
    user_metadata jsonb
);

-- Create the storage.buckets table if it doesn't exist  
CREATE TABLE IF NOT EXISTS storage.buckets (
    id text PRIMARY KEY,
    name text NOT NULL,
    owner uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[]
);

-- Add any missing indexes
CREATE INDEX IF NOT EXISTS objects_bucket_id_name ON storage.objects (bucket_id, name);
CREATE INDEX IF NOT EXISTS objects_name_prefix_pattern ON storage.objects (name text_pattern_ops);