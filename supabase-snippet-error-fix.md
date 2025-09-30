# Fix for Supabase "Snippet Doesn't Exist" Error

## Problem
Getting error: "Unable to find snippet with ID 18db1f40-47b0-4a03-98ae-b0d5fdc5d9c1. This snippet doesn't exist in your project"

This is a **Supabase error** that occurs when:
1. Database references point to deleted/non-existent records
2. Foreign key relationships are broken after cleanup
3. Cached queries reference orphaned data
4. Auto-generated IDs conflict with deleted records

## Root Cause
Your database cleanup left orphaned references and broken foreign key constraints, causing Supabase to try to access non-existent data.

## Solution Steps

### Step 1: Fix Foreign Key Constraints
Run `fix-ingreso-fruta-constraint.sql` in Supabase SQL Editor:
- Drops problematic constraints with typos
- Recreates proper constraints with CASCADE delete
- Fixes the "Detalle Ingreso de Fruta_tennant_id_fkey" error

### Step 2: Clean Orphaned Data
Run `supabase-cache-cleanup.sql` in Supabase SQL Editor:
- Removes orphaned records that reference deleted tenants
- Resets auto-increment sequences to prevent ID conflicts
- Verifies no orphaned data remains

### Step 3: Clear Supabase Dashboard Cache
1. **Refresh Supabase Dashboard** (Ctrl+F5 or Cmd+Shift+R)
2. **Clear browser cache** for supabase.com
3. **Restart your application** (npm run dev)

### Step 4: Application-Level Protection
The updated `api.ts` now includes:
- **Tenant verification** before querying data
- **Better error handling** for orphaned references
- **UUID validation** to prevent malformed queries
- **Graceful fallbacks** when data doesn't exist

## Expected Results After Fix

✅ **No more "snippet doesn't exist" errors**
✅ **Clean database with proper constraints**  
✅ **Foreign keys with CASCADE delete**
✅ **No orphaned data references**
✅ **Application handles missing data gracefully**

## Prevention

### 1. Always Use CASCADE Constraints
```sql
FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
```

### 2. Proper Cleanup Order
1. Delete child records first (empaque data)
2. Delete junction records (workers)
3. Delete parent records (tenants)
4. Delete auth users last

### 3. Verify Before Operations
Always check if parent records exist before creating child records.

## If Error Persists

1. **Clear all browser data** for supabase.com and localhost
2. **Restart your development server**
3. **Check Supabase logs** in Dashboard → Logs
4. **Run the cleanup scripts again** to ensure complete cleanup
5. **Contact Supabase support** if the issue is on their side

## Testing

After applying all fixes:
1. Try creating a new tenant
2. Navigate to empaque pages  
3. Create some test data
4. Verify no console errors
5. Test the cleanup tool again

The "snippet doesn't exist" error should be completely resolved!