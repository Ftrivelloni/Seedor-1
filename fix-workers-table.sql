-- Fix workers table structure to auto-generate UUIDs
-- Run this in your Supabase SQL Editor

-- First check the current structure
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'workers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Drop the table and recreate it with proper structure
DROP TABLE IF EXISTS workers CASCADE;

-- Create workers table with proper UUID generation
CREATE TABLE workers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    document_id TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    area_module TEXT NOT NULL,
    membership_id UUID NOT NULL, -- This will reference auth.users.id
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraints
ALTER TABLE workers ADD CONSTRAINT workers_email_unique UNIQUE (email);
ALTER TABLE workers ADD CONSTRAINT workers_document_tenant_unique UNIQUE (document_id, tenant_id);

-- Create indexes for better performance
CREATE INDEX workers_tenant_id_idx ON workers(tenant_id);
CREATE INDEX workers_membership_id_idx ON workers(membership_id);
CREATE INDEX workers_email_idx ON workers(email);

-- Add RLS (Row Level Security) - but keep it disabled for now
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON workers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON workers TO authenticated;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON workers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the final structure
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'workers' 
AND table_schema = 'public'
ORDER BY ordinal_position;