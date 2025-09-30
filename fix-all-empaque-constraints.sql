-- Comprehensive fix for all empaque table constraints
-- This addresses foreign key constraint violations that prevent proper cleanup

-- Function to safely drop a constraint if it exists
CREATE OR REPLACE FUNCTION drop_constraint_if_exists(table_name TEXT, constraint_name TEXT)
RETURNS VOID AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = constraint_name
        AND table_name = table_name
    ) THEN
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', table_name, constraint_name);
        RAISE NOTICE 'Dropped constraint: % from table %', constraint_name, table_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- List all current foreign key constraints on empaque tables
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('ingreso_fruta', 'pallets', 'preseleccion', 'egreso_fruta', 'despacho')
ORDER BY tc.table_name, tc.constraint_name;

-- Drop all problematic constraints from empaque tables
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Get all foreign key constraints from empaque tables
    FOR constraint_record IN
        SELECT tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints AS tc
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('ingreso_fruta', 'pallets', 'preseleccion', 'egreso_fruta', 'despacho')
    LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I CASCADE', 
                      constraint_record.table_name, 
                      constraint_record.constraint_name);
        RAISE NOTICE 'Dropped constraint: % from table %', 
                     constraint_record.constraint_name, 
                     constraint_record.table_name;
    END LOOP;
END $$;

-- Clean up all data from empaque tables (now that constraints are removed)
TRUNCATE TABLE ingreso_fruta CASCADE;
TRUNCATE TABLE pallets CASCADE;
TRUNCATE TABLE preseleccion CASCADE;
TRUNCATE TABLE egreso_fruta CASCADE;
TRUNCATE TABLE despacho CASCADE;

-- Recreate foreign key constraints with proper CASCADE delete behavior
-- (Only if the columns actually exist - adjust based on your schema)

-- Check if tenant_id columns exist and recreate constraints
DO $$
BEGIN
    -- ingreso_fruta
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ingreso_fruta' AND column_name = 'tenant_id') THEN
        ALTER TABLE ingreso_fruta
        ADD CONSTRAINT ingreso_fruta_tenant_id_fkey
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added tenant constraint to ingreso_fruta';
    END IF;

    -- pallets
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pallets' AND column_name = 'tenant_id') THEN
        ALTER TABLE pallets
        ADD CONSTRAINT pallets_tenant_id_fkey
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added tenant constraint to pallets';
    END IF;

    -- preseleccion
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'preseleccion' AND column_name = 'tenant_id') THEN
        ALTER TABLE preseleccion
        ADD CONSTRAINT preseleccion_tenant_id_fkey
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added tenant constraint to preseleccion';
    END IF;

    -- egreso_fruta
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'egreso_fruta' AND column_name = 'tenant_id') THEN
        ALTER TABLE egreso_fruta
        ADD CONSTRAINT egreso_fruta_tenant_id_fkey
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added tenant constraint to egreso_fruta';
    END IF;

    -- despacho
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'despacho' AND column_name = 'tenant_id') THEN
        ALTER TABLE despacho
        ADD CONSTRAINT despacho_tenant_id_fkey
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added tenant constraint to despacho';
    END IF;
END $$;

-- Clean up the helper function
DROP FUNCTION IF EXISTS drop_constraint_if_exists(TEXT, TEXT);

-- Show final constraint state
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('ingreso_fruta', 'pallets', 'preseleccion', 'egreso_fruta', 'despacho')
ORDER BY tc.table_name, tc.constraint_name;

RAISE NOTICE 'Empaque table constraints have been fixed and data cleared';