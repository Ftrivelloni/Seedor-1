-- Enhanced Subscription Plans System - Working with Existing Tables
-- This modifies existing tables: tenants, tenant_modules, tenant_memberships, profiles, roles
-- and adds subscription functionality without breaking existing features

-- First, let's see what tables exist and their structure
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tenants', 'tenant_modules', 'tenant_memberships', 'profiles', 'roles', 'workers');

-- =====================================================
-- 1. CREATE SUBSCRIPTION PLANS TABLES
-- =====================================================

-- Create plans table (new)
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
    max_users INTEGER NOT NULL DEFAULT 3,
    max_storage_gb INTEGER NOT NULL DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create plan_features table for granular feature control (new)
CREATE TABLE IF NOT EXISTS plan_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    feature_code VARCHAR(50) NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    limit_value INTEGER DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(plan_id, feature_code)
);

-- =====================================================
-- 2. ENHANCE EXISTING TABLES
-- =====================================================

-- Enhance tenants table with subscription info
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id),
ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS current_users INTEGER DEFAULT 0;

-- Create subscription_history table for tracking plan changes
CREATE TABLE IF NOT EXISTS subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    from_plan_id UUID REFERENCES plans(id),
    to_plan_id UUID NOT NULL REFERENCES plans(id),
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('upgrade', 'downgrade', 'renewal', 'cancellation')),
    effective_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    billing_amount DECIMAL(10,2),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhance tenant_memberships with proper role structure
-- First check if role_code column exists
DO $$
BEGIN
    -- Update role_code to match our system roles
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_memberships' AND column_name = 'role_code') THEN
        -- Drop existing constraint if any
        ALTER TABLE tenant_memberships DROP CONSTRAINT IF EXISTS tenant_memberships_role_code_check;
        
        -- Add new constraint with our roles
        ALTER TABLE tenant_memberships 
        ADD CONSTRAINT tenant_memberships_role_code_check 
        CHECK (role_code IN ('admin', 'campo', 'empaque', 'finanzas'));
        
        RAISE NOTICE 'Updated tenant_memberships role_code constraint';
    ELSE
        -- Add role_code column if it doesn't exist
        ALTER TABLE tenant_memberships 
        ADD COLUMN role_code VARCHAR(20) NOT NULL DEFAULT 'admin'
        CHECK (role_code IN ('admin', 'campo', 'empaque', 'finanzas'));
        
        RAISE NOTICE 'Added role_code column to tenant_memberships';
    END IF;
END $$;

-- =====================================================
-- 3. INSERT DEFAULT PLANS
-- =====================================================

INSERT INTO plans (name, display_name, description, price_monthly, price_yearly, max_users, max_storage_gb, sort_order) VALUES
('basic', 'Plan Básico', 'Plan básico para pequeñas operaciones agrícolas. Incluye gestión de campo e inventario.', 29.99, 299.99, 3, 5, 1),
('pro', 'Plan Profesional', 'Plan completo para medianas empresas agrícolas. Incluye todas las funcionalidades.', 79.99, 799.99, 10, 50, 2),
('enterprise', 'Plan Empresarial', 'Plan avanzado para grandes operaciones con integraciones personalizadas.', 199.99, 1999.99, 999, 500, 3)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 4. INSERT PLAN FEATURES FOR EACH PLAN
-- =====================================================

-- Basic plan features (Campo + Inventario only)
INSERT INTO plan_features (plan_id, feature_code, feature_name, is_enabled, limit_value) VALUES
((SELECT id FROM plans WHERE name = 'basic'), 'campo', 'Gestión de Campo', true, NULL),
((SELECT id FROM plans WHERE name = 'basic'), 'empaque', 'Gestión de Empaque', false, NULL),
((SELECT id FROM plans WHERE name = 'basic'), 'finanzas', 'Gestión de Finanzas', false, NULL),
((SELECT id FROM plans WHERE name = 'basic'), 'inventario', 'Gestión de Inventario', true, NULL),
((SELECT id FROM plans WHERE name = 'basic'), 'trabajadores', 'Gestión de Trabajadores', true, 3),
((SELECT id FROM plans WHERE name = 'basic'), 'contactos', 'Gestión de Contactos', true, NULL),
((SELECT id FROM plans WHERE name = 'basic'), 'user_management', 'Gestión de Usuarios', true, NULL)
ON CONFLICT (plan_id, feature_code) DO NOTHING;

-- Pro plan features (All modules enabled)
INSERT INTO plan_features (plan_id, feature_code, feature_name, is_enabled, limit_value) VALUES
((SELECT id FROM plans WHERE name = 'pro'), 'campo', 'Gestión de Campo', true, NULL),
((SELECT id FROM plans WHERE name = 'pro'), 'empaque', 'Gestión de Empaque', true, NULL),
((SELECT id FROM plans WHERE name = 'pro'), 'finanzas', 'Gestión de Finanzas', true, NULL),
((SELECT id FROM plans WHERE name = 'pro'), 'inventario', 'Gestión de Inventario', true, NULL),
((SELECT id FROM plans WHERE name = 'pro'), 'trabajadores', 'Gestión de Trabajadores', true, 10),
((SELECT id FROM plans WHERE name = 'pro'), 'contactos', 'Gestión de Contactos', true, NULL),
((SELECT id FROM plans WHERE name = 'pro'), 'user_management', 'Gestión de Usuarios', true, NULL),
((SELECT id FROM plans WHERE name = 'pro'), 'advanced_reports', 'Reportes Avanzados', true, NULL)
ON CONFLICT (plan_id, feature_code) DO NOTHING;

-- Enterprise plan features (All modules + advanced features)
INSERT INTO plan_features (plan_id, feature_code, feature_name, is_enabled, limit_value) VALUES
((SELECT id FROM plans WHERE name = 'enterprise'), 'campo', 'Gestión de Campo', true, NULL),
((SELECT id FROM plans WHERE name = 'enterprise'), 'empaque', 'Gestión de Empaque', true, NULL),
((SELECT id FROM plans WHERE name = 'enterprise'), 'finanzas', 'Gestión de Finanzas', true, NULL),
((SELECT id FROM plans WHERE name = 'enterprise'), 'inventario', 'Gestión de Inventario', true, NULL),
((SELECT id FROM plans WHERE name = 'enterprise'), 'trabajadores', 'Gestión de Trabajadores', true, 999),
((SELECT id FROM plans WHERE name = 'enterprise'), 'contactos', 'Gestión de Contactos', true, NULL),
((SELECT id FROM plans WHERE name = 'enterprise'), 'user_management', 'Gestión de Usuarios', true, NULL),
((SELECT id FROM plans WHERE name = 'enterprise'), 'advanced_reports', 'Reportes Avanzados', true, NULL),
((SELECT id FROM plans WHERE name = 'enterprise'), 'api_access', 'Acceso API', true, NULL),
((SELECT id FROM plans WHERE name = 'enterprise'), 'custom_integrations', 'Integraciones Personalizadas', true, NULL)
ON CONFLICT (plan_id, feature_code) DO NOTHING;

-- =====================================================
-- 5. UPDATE EXISTING TENANTS TO HAVE DEFAULT PLAN
-- =====================================================

-- Assign basic plan to existing tenants that don't have a plan
UPDATE tenants 
SET plan_id = (SELECT id FROM plans WHERE name = 'basic'),
    max_users = 3,
    current_users = (
        SELECT COUNT(*) 
        FROM tenant_memberships tm 
        WHERE tm.tenant_id = tenants.id 
        AND tm.status = 'active'
    )
WHERE plan_id IS NULL;

-- =====================================================
-- 6. CREATE USEFUL FUNCTIONS
-- =====================================================

-- Function to get tenant features based on their plan
CREATE OR REPLACE FUNCTION get_tenant_features(tenant_uuid UUID)
RETURNS TABLE(feature_code TEXT, feature_name TEXT, is_enabled BOOLEAN, limit_value INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pf.feature_code::TEXT,
        pf.feature_name::TEXT,
        pf.is_enabled,
        pf.limit_value
    FROM tenants t
    JOIN plans p ON t.plan_id = p.id
    JOIN plan_features pf ON p.id = pf.plan_id
    WHERE t.id = tenant_uuid
    AND p.is_active = true;
END;
$$;

-- Function to check if tenant has access to a specific feature
CREATE OR REPLACE FUNCTION tenant_has_feature(tenant_uuid UUID, feature_code_param TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    has_access BOOLEAN := false;
BEGIN
    SELECT pf.is_enabled INTO has_access
    FROM tenants t
    JOIN plans p ON t.plan_id = p.id
    JOIN plan_features pf ON p.id = pf.plan_id
    WHERE t.id = tenant_uuid
    AND pf.feature_code = feature_code_param
    AND p.is_active = true;
    
    RETURN COALESCE(has_access, false);
END;
$$;

-- Function to check if tenant can add more users
CREATE OR REPLACE FUNCTION tenant_can_add_user(tenant_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_count INTEGER;
    max_allowed INTEGER;
BEGIN
    SELECT t.current_users, t.max_users 
    INTO current_count, max_allowed
    FROM tenants t
    WHERE t.id = tenant_uuid;
    
    RETURN COALESCE(current_count, 0) < COALESCE(max_allowed, 3);
END;
$$;

-- Function to update tenant user count
CREATE OR REPLACE FUNCTION update_tenant_user_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tenants 
        SET current_users = (
            SELECT COUNT(*) 
            FROM tenant_memberships 
            WHERE tenant_id = NEW.tenant_id 
            AND status = 'active'
        )
        WHERE id = NEW.tenant_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE tenants 
        SET current_users = (
            SELECT COUNT(*) 
            FROM tenant_memberships 
            WHERE tenant_id = NEW.tenant_id 
            AND status = 'active'
        )
        WHERE id = NEW.tenant_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tenants 
        SET current_users = (
            SELECT COUNT(*) 
            FROM tenant_memberships 
            WHERE tenant_id = OLD.tenant_id 
            AND status = 'active'
        )
        WHERE id = OLD.tenant_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update user counts
DROP TRIGGER IF EXISTS update_tenant_user_count_trigger ON tenant_memberships;
CREATE TRIGGER update_tenant_user_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON tenant_memberships
    FOR EACH ROW EXECUTE FUNCTION update_tenant_user_count();

-- =====================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_tenants_plan_id ON tenants(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_features_plan_id ON plan_features(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_features_feature_code ON plan_features(feature_code);
CREATE INDEX IF NOT EXISTS idx_subscription_history_tenant_id ON subscription_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_tenant_role ON tenant_memberships(tenant_id, role_code);

-- =====================================================
-- 8. ENABLE RLS AND CREATE POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for plans table (public read for all authenticated users)
DROP POLICY IF EXISTS "Plans are visible to all authenticated users" ON plans;
CREATE POLICY "Plans are visible to all authenticated users" ON plans
    FOR SELECT USING (auth.role() = 'authenticated');

-- RLS policies for plan_features (public read for all authenticated users)
DROP POLICY IF EXISTS "Plan features are visible to all authenticated users" ON plan_features;
CREATE POLICY "Plan features are visible to all authenticated users" ON plan_features
    FOR SELECT USING (auth.role() = 'authenticated');

-- RLS policies for subscription_history (only tenant members can view their history)
DROP POLICY IF EXISTS "Users can view their tenant's subscription history" ON subscription_history;
CREATE POLICY "Users can view their tenant's subscription history" ON subscription_history
    FOR SELECT USING (
        tenant_id IN (
            SELECT tm.tenant_id 
            FROM tenant_memberships tm 
            WHERE tm.user_id = auth.uid() 
            AND tm.status = 'active'
        )
    );

-- =====================================================
-- 9. CREATE VIEW FOR EASY TENANT PLAN ACCESS
-- =====================================================

CREATE OR REPLACE VIEW tenant_plan_info AS
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    t.slug,
    p.name as plan_name,
    p.display_name as plan_display_name,
    p.price_monthly,
    p.price_yearly,
    t.current_users,
    t.max_users,
    t.plan_expires_at,
    t.billing_cycle,
    CASE 
        WHEN t.plan_expires_at IS NULL THEN true
        WHEN t.plan_expires_at > NOW() THEN true
        ELSE false
    END as plan_active
FROM tenants t
JOIN plans p ON t.plan_id = p.id;

-- Grant access to the view
GRANT SELECT ON tenant_plan_info TO authenticated;

-- =====================================================
-- 10. VERIFICATION QUERIES
-- =====================================================

-- Show final structure
SELECT 'Plans created:' as info, count(*) as count FROM plans
UNION ALL
SELECT 'Plan features created:', count(*) FROM plan_features
UNION ALL
SELECT 'Tenants with plans:', count(*) FROM tenants WHERE plan_id IS NOT NULL
UNION ALL
SELECT 'Active tenant memberships:', count(*) FROM tenant_memberships WHERE status = 'active';

-- Show tenant plan assignments
SELECT 
    t.name as tenant_name,
    p.display_name as plan_name,
    t.current_users,
    t.max_users
FROM tenants t
LEFT JOIN plans p ON t.plan_id = p.id
ORDER BY t.name;

COMMENT ON TABLE plans IS 'Subscription plans available for tenants';
COMMENT ON TABLE plan_features IS 'Features available for each plan with granular control'; 
COMMENT ON TABLE subscription_history IS 'History of plan changes for auditing and billing';
COMMENT ON FUNCTION get_tenant_features IS 'Returns all features available to a tenant based on their current plan';
COMMENT ON FUNCTION tenant_has_feature IS 'Checks if a tenant has access to a specific feature';
COMMENT ON FUNCTION tenant_can_add_user IS 'Checks if tenant can add more users based on their plan limits';

-- Final success message
RAISE NOTICE 'Subscription plans system has been successfully implemented!';
RAISE NOTICE 'Plans created: Basic (Campo + Inventario), Pro (All modules), Enterprise (All + Advanced)';
RAISE NOTICE 'All existing tenants have been assigned to Basic plan';
RAISE NOTICE 'Role-based access control enhanced with admin, campo, empaque, finanzas roles';