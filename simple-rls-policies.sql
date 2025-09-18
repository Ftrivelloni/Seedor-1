-- Alternative approach: Simpler RLS policies to avoid recursion
-- Run these SQL commands in your Supabase SQL Editor

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read own tenant" ON tenants;
DROP POLICY IF EXISTS "Users can update own tenant" ON tenants;
DROP POLICY IF EXISTS "Users can insert tenant" ON tenants;
DROP POLICY IF EXISTS "Users can read workers in own tenant" ON workers;
DROP POLICY IF EXISTS "Users can update workers in own tenant" ON workers;
DROP POLICY IF EXISTS "Users can insert workers in own tenant" ON workers;
DROP POLICY IF EXISTS "Users can delete workers in own tenant" ON workers;
DROP POLICY IF EXISTS "Enable all operations for service role" ON tenants;
DROP POLICY IF EXISTS "Enable all operations for service role" ON workers;
DROP POLICY IF EXISTS "Users can read workers in same tenant" ON workers;
DROP POLICY IF EXISTS "Admins can manage workers in their tenant" ON workers;

-- Temporarily disable RLS
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE workers DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

-- TENANTS TABLE POLICIES
-- Service role can do everything (for server-side operations)
CREATE POLICY "service_role_all_tenants" ON tenants
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- Authenticated users can read tenants they belong to
CREATE POLICY "read_own_tenant" ON tenants
    FOR SELECT 
    TO authenticated 
    USING (
        id IN (
            SELECT DISTINCT tenant_id 
            FROM workers 
            WHERE membership_id = auth.uid()
        )
    );

-- Only admins can update tenant info
CREATE POLICY "admin_update_tenant" ON tenants
    FOR UPDATE 
    TO authenticated 
    USING (
        id IN (
            SELECT DISTINCT tenant_id 
            FROM workers 
            WHERE membership_id = auth.uid() 
            AND area_module = 'Administración'
        )
    );

-- WORKERS TABLE POLICIES  
-- Service role can do everything (for server-side operations)
CREATE POLICY "service_role_all_workers" ON workers
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- Users can read workers in their tenant
CREATE POLICY "read_tenant_workers" ON workers
    FOR SELECT 
    TO authenticated 
    USING (
        tenant_id IN (
            SELECT DISTINCT w.tenant_id 
            FROM workers w 
            WHERE w.membership_id = auth.uid()
        )
    );

-- Users can update their own worker record
CREATE POLICY "update_own_worker" ON workers
    FOR UPDATE 
    TO authenticated 
    USING (membership_id = auth.uid())
    WITH CHECK (membership_id = auth.uid());

-- Admins can insert/update/delete workers in their tenant
CREATE POLICY "admin_manage_workers" ON workers
    FOR ALL 
    TO authenticated 
    USING (
        tenant_id IN (
            SELECT DISTINCT w.tenant_id 
            FROM workers w 
            WHERE w.membership_id = auth.uid() 
            AND w.area_module = 'Administración'
        )
    )
    WITH CHECK (
        tenant_id IN (
            SELECT DISTINCT w.tenant_id 
            FROM workers w 
            WHERE w.membership_id = auth.uid() 
            AND w.area_module = 'Administración'
        )
    );