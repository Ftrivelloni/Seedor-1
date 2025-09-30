# Database Cleanup Fix - Foreign Key Constraint Issues

## Problem Analysis

The database cleanup was failing due to foreign key constraints preventing deletion in the wrong order. The main issues were:

1. **Foreign Key Constraint Error**: `update or delete on table "tenants" violates foreign key constraint "Detalle Ingreso de Fruta_tennant_id_fkey" on table "ingreso_fruta"`
2. **Auth User Deletion Failures**: Some auth users couldn't be deleted due to database references
3. **Incorrect Deletion Order**: Attempting to delete parent records before child records

## Root Causes

### 1. Wrong Deletion Order
The original cleanup tried to delete:
1. Workers first ❌
2. Tenants second ❌ (Failed due to ingreso_fruta references)
3. Auth users third

### 2. Missing Dependent Table Cleanup
Tables like `ingreso_fruta`, `pallets`, `preseleccion`, `egreso_fruta`, and `despacho` all reference `tenants.id` but weren't being cleaned up first.

### 3. Constraint Naming Issue
The constraint had a typo: `"Detalle Ingreso de Fruta_tennant_id_fkey"` (notice "tennant" instead of "tenant").

## Solutions Implemented

### 1. Updated Cleanup Order (`cleanup-actions.ts`)
```typescript
// NEW CORRECT ORDER:
1. Delete empaque data (ingreso_fruta, pallets, preseleccion, egreso_fruta, despacho)
2. Delete workers 
3. Delete tenants (now safe)
4. Delete auth users
5. Verify cleanup
```

### 2. Added Comprehensive Table Cleanup
- Added cleanup for all 5 empaque-related tables
- Added error handling for each table
- Added verification counts for all tables

### 3. Improved Auth User Deletion
- Added retry logic and error handling
- Added rate limiting (100ms delay between deletions)
- Added success/error counting
- Better error reporting

### 4. SQL Scripts for Manual Cleanup

#### `comprehensive-database-cleanup.sql`
- Deletes all tables in correct order
- Uses transactions for safety
- Provides before/after counts
- Safe to run manually in Supabase SQL Editor

#### `fix-ingreso-fruta-constraint.sql`
- Fixes the specific constraint error
- Drops problematic foreign key constraint
- Recreates it with proper naming and CASCADE delete
- Adds verification queries

## How to Fix Your Current Issue

### Option 1: Run SQL Script First
1. Open Supabase Dashboard → SQL Editor
2. Run `fix-ingreso-fruta-constraint.sql` to fix the constraint
3. Then run your cleanup tool again

### Option 2: Complete Manual Cleanup
1. Run `comprehensive-database-cleanup.sql` in SQL Editor
2. Then use the cleanup tool to delete auth users

### Option 3: Use Updated Cleanup Tool
The updated `cleanup-actions.ts` should now handle the dependencies correctly.

## Prevention for Future

### 1. Proper Foreign Key Constraints
All foreign key constraints should use `ON DELETE CASCADE` to automatically clean up dependent records:

```sql
ALTER TABLE child_table 
ADD CONSTRAINT child_table_tenant_id_fkey 
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
```

### 2. Correct Deletion Order
Always delete in this order:
1. Child tables (empaque data)
2. Junction tables (workers)
3. Parent tables (tenants)
4. Auth users (external system)

### 3. Better Error Handling
- Check for foreign key constraints before deletion
- Provide detailed error messages
- Implement rollback on failure

## Testing the Fix

After applying the fixes, you should see:
- ✅ All empaque tables cleaned successfully
- ✅ Workers deleted successfully  
- ✅ Tenants deleted successfully
- ✅ Most auth users deleted (some may fail due to external reasons)
- ✅ Final verification shows 0 or minimal remaining records

The cleanup tool should now complete successfully without foreign key constraint errors.