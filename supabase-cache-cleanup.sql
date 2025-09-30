-- Additional Supabase cleanup to resolve orphaned references
-- Run this after the constraint fix to clear any cached data

-- Clear any orphaned references in related tables
-- This helps resolve "snippet doesn't exist" type errors

-- 1. First, let's see what data exists in key tables
SELECT 'ingreso_fruta count' as table_name, COUNT(*) as count FROM ingreso_fruta
UNION ALL
SELECT 'pallets count', COUNT(*) FROM pallets
UNION ALL
SELECT 'preseleccion count', COUNT(*) FROM preseleccion
UNION ALL
SELECT 'egreso_fruta count', COUNT(*) FROM egreso_fruta
UNION ALL
SELECT 'despacho count', COUNT(*) FROM despacho
UNION ALL
SELECT 'workers count', COUNT(*) FROM workers
UNION ALL
SELECT 'tenants count', COUNT(*) FROM tenants;

-- 2. Clean up any orphaned data that might be causing reference errors
-- Delete records that reference non-existent tenants
DELETE FROM ingreso_fruta 
WHERE tenant_id NOT IN (SELECT id FROM tenants);

DELETE FROM pallets 
WHERE tenant_id NOT IN (SELECT id FROM tenants);

DELETE FROM preseleccion 
WHERE tenant_id NOT IN (SELECT id FROM tenants);

DELETE FROM egreso_fruta 
WHERE tenant_id NOT IN (SELECT id FROM tenants);

DELETE FROM despacho 
WHERE tenant_id NOT IN (SELECT id FROM tenants);

-- 3. Clean up workers that reference non-existent tenants
DELETE FROM workers 
WHERE tenant_id NOT IN (SELECT id FROM tenants);

-- 4. Check table ID types and handle accordingly
-- Show which tables use UUID vs serial IDs
SELECT 
    table_name,
    column_name,
    data_type,
    CASE 
        WHEN data_type = 'uuid' THEN 'UUID (no sequence to reset)'
        WHEN data_type IN ('integer', 'bigint') THEN 'Serial (has sequence)'
        ELSE 'Other type'
    END as id_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND column_name = 'id'
    AND table_name IN ('ingreso_fruta', 'pallets', 'preseleccion', 'egreso_fruta', 'despacho', 'workers', 'tenants')
ORDER BY table_name;

-- Note: UUID tables don't need sequence resets since UUIDs are globally unique
-- This prevents the "function max(uuid) does not exist" error

-- 5. Verify cleanup - these should all return 0 orphaned records
SELECT 'Orphaned ingreso_fruta' as check_name, COUNT(*) as orphaned_count
FROM ingreso_fruta 
WHERE tenant_id NOT IN (SELECT id FROM tenants)
UNION ALL
SELECT 'Orphaned pallets', COUNT(*)
FROM pallets 
WHERE tenant_id NOT IN (SELECT id FROM tenants)
UNION ALL
SELECT 'Orphaned preseleccion', COUNT(*)
FROM preseleccion 
WHERE tenant_id NOT IN (SELECT id FROM tenants)
UNION ALL
SELECT 'Orphaned workers', COUNT(*)
FROM workers 
WHERE tenant_id NOT IN (SELECT id FROM tenants);

-- 6. Final count verification
SELECT 'FINAL: ingreso_fruta' as table_name, COUNT(*) as final_count FROM ingreso_fruta
UNION ALL
SELECT 'FINAL: pallets', COUNT(*) FROM pallets
UNION ALL
SELECT 'FINAL: preseleccion', COUNT(*) FROM preseleccion
UNION ALL
SELECT 'FINAL: workers', COUNT(*) FROM workers
UNION ALL
SELECT 'FINAL: tenants', COUNT(*) FROM tenants;