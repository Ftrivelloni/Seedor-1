-- Fix RLS Policies for Multi-tenant Setup
-- Run these SQL commands in your Supabase SQL Editor

-- First, drop ALL existing policies to start fresh
-- Drop tenant policies
DROP POLICY IF EXISTS "Users can read own tenant" ON tenants;
DROP POLICY IF EXISTS "Users can update own tenant" ON tenants;
DROP POLICY IF EXISTS "Users can insert tenant" ON tenants;
DROP POLICY IF EXISTS "Enable all operations for service role" ON tenants;
DROP POLICY IF EXISTS "service_role_all_tenants" ON tenants;
DROP POLICY IF EXISTS "read_own_tenant" ON tenants;
DROP POLICY IF EXISTS "admin_update_tenant" ON tenants;

-- Drop worker policies
DROP POLICY IF EXISTS "Users can read workers in own tenant" ON workers;
DROP POLICY IF EXISTS "Users can update workers in own tenant" ON workers;
DROP POLICY IF EXISTS "Users can insert workers in own tenant" ON workers;
DROP POLICY IF EXISTS "Users can delete workers in own tenant" ON workers;
DROP POLICY IF EXISTS "Enable all operations for service role" ON workers;
DROP POLICY IF EXISTS "service_role_all_workers" ON workers;
DROP POLICY IF EXISTS "read_tenant_workers" ON workers;
DROP POLICY IF EXISTS "update_own_worker" ON workers;
DROP POLICY IF EXISTS "admin_manage_workers" ON workers;
DROP POLICY IF EXISTS "Users can read workers in same tenant" ON workers;
DROP POLICY IF EXISTS "Admins can manage workers in their tenant" ON workers;

-- Disable RLS temporarily to clear any issues
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE workers DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for tenants table
CREATE POLICY "Enable all operations for service role" ON tenants
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Users can read own tenant" ON tenants
    FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM workers 
            WHERE workers.tenant_id = tenants.id 
            AND workers.membership_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own tenant" ON tenants
    FOR UPDATE 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM workers 
            WHERE workers.tenant_id = tenants.id 
            AND workers.membership_id = auth.uid()
            AND workers.area_module = 'Administración'
        )
    );

-- Create simple, non-recursive policies for workers table
CREATE POLICY "Enable all operations for service role" ON workers
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Users can read workers in same tenant" ON workers
    FOR SELECT 
    TO authenticated 
    USING (
        tenant_id IN (
            SELECT tenant_id FROM workers 
            WHERE membership_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage workers in their tenant" ON workers
    FOR ALL 
    TO authenticated 
    USING (
        tenant_id IN (
            SELECT tenant_id FROM workers 
            WHERE membership_id = auth.uid() 
            AND area_module = 'Administración'
        )
    )
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM workers 
            WHERE membership_id = auth.uid() 
            AND area_module = 'Administración'
        )
    );

-- Grant necessary permissions
GRANT ALL ON tenants TO service_role;
GRANT ALL ON workers TO service_role;
GRANT SELECT, INSERT, UPDATE ON tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON workers TO authenticated;