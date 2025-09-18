-- SIMPLE FIX: Disable RLS completely for testing
-- This is the fastest way to get your app working while we debug policies

-- Drop all policies completely
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all policies on tenants table
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'tenants' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON tenants';
    END LOOP;
    
    -- Drop all policies on workers table
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'workers' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON workers';
    END LOOP;
END $$;

-- Disable RLS completely for testing
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE workers DISABLE ROW LEVEL SECURITY;

-- Ensure service role has all permissions
GRANT ALL ON tenants TO service_role;
GRANT ALL ON workers TO service_role;
GRANT ALL ON tenants TO authenticated;
GRANT ALL ON workers TO authenticated;

-- Show status
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename IN ('tenants', 'workers') 
AND schemaname = 'public';