'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface CleanupResult {
  success: boolean;
  messages: string[];
  stats?: {
    workers: number;
    tenants: number;
    authUsers: number;
  };
  error?: string;
}

export async function cleanupDatabase(): Promise<CleanupResult> {
  const messages: string[] = [];
  
  if (!supabaseServiceKey) {
    return {
      success: false,
      messages: ["❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in environment variables"],
      error: "Missing service role key"
    };
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    messages.push("🧹 Starting database cleanup...");

    // Get initial counts
    messages.push("📊 Getting current database statistics...");
    
    const { count: initialWorkers } = await supabaseAdmin
      .from('workers')
      .select('*', { count: 'exact', head: true });
    
    const { count: initialTenants } = await supabaseAdmin
      .from('tenants')
      .select('*', { count: 'exact', head: true });
    
    const { data: initialUsers } = await supabaseAdmin.auth.admin.listUsers();

    messages.push(`📋 Found: ${initialWorkers || 0} workers, ${initialTenants || 0} tenants, ${initialUsers?.users.length || 0} auth users`);

    // 1. Delete all empaque-related data first (dependent tables)
    messages.push("🗑️  Deleting empaque data (ingreso_fruta, pallets, preseleccion, egreso_fruta, despacho)...");
    
    const empaqueTables = ['ingreso_fruta', 'pallets', 'preseleccion', 'egreso_fruta', 'despacho'];
    let empaqueErrors = 0;
    
    for (const table of empaqueTables) {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .not('id', 'is', null);
      
      if (error) {
        messages.push(`❌ Error deleting ${table}: ${error.message}`);
        empaqueErrors++;
      } else {
        messages.push(`✅ ${table} data deleted successfully`);
      }
    }

    // 2. Delete all workers
    messages.push("🗑️  Deleting all workers...");
    const { error: workersError } = await supabaseAdmin
      .from('workers')
      .delete()
      .not('id', 'is', null);

    if (workersError) {
      messages.push(`❌ Error deleting workers: ${workersError.message}`);
    } else {
      messages.push("✅ Workers deleted successfully");
    }

    // 3. Delete all tenants (now safe since dependencies are gone)
    messages.push("🏢 Deleting all tenants...");
    const { error: tenantsError } = await supabaseAdmin
      .from('tenants')
      .delete()
      .not('id', 'is', null);

    if (tenantsError) {
      messages.push(`❌ Error deleting tenants: ${tenantsError.message}`);
    } else {
      messages.push("✅ Tenants deleted successfully");
    }

    // 4. Delete all auth users
    messages.push("👥 Deleting all auth users...");
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      messages.push(`❌ Error listing users: ${listError.message}`);
    } else if (users.users.length > 0) {
      messages.push(`Found ${users.users.length} users to delete`);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const user of users.users) {
        try {
          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
          
          if (deleteError) {
            messages.push(`❌ Error deleting user ${user.email}: ${deleteError.message}`);
            errorCount++;
          } else {
            messages.push(`✅ User ${user.email || user.id} deleted`);
            successCount++;
          }
        } catch (err: any) {
          messages.push(`❌ Exception deleting user ${user.email}: ${err.message}`);
          errorCount++;
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      messages.push(`📊 Auth user deletion summary: ${successCount} successful, ${errorCount} failed`);
    } else {
      messages.push("No auth users found to delete");
    }

    // 5. Verify cleanup
    messages.push("🔍 Verifying cleanup...");
    
    // Check all tables
    const { count: finalWorkers } = await supabaseAdmin
      .from('workers')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalTenants } = await supabaseAdmin
      .from('tenants')
      .select('*', { count: 'exact', head: true });
    
    // Check empaque tables
    const empaqueTableCounts: Record<string, number> = {};
    for (const table of empaqueTables) {
      const { count } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact', head: true });
      empaqueTableCounts[table] = count || 0;
    }
    
    const { data: finalUsers } = await supabaseAdmin.auth.admin.listUsers();

    const stats = {
      workers: finalWorkers || 0,
      tenants: finalTenants || 0,
      authUsers: finalUsers?.users.length || 0,
      ...empaqueTableCounts
    };

    messages.push(`📊 Final counts: Workers: ${stats.workers}, Tenants: ${stats.tenants}, Auth Users: ${stats.authUsers}`);
    
    // Report empaque table counts
    for (const [table, count] of Object.entries(empaqueTableCounts)) {
      if (count > 0) {
        messages.push(`⚠️  ${table}: ${count} records remaining`);
      }
    }

    const totalRemaining = stats.workers + stats.tenants + stats.authUsers + 
      Object.values(empaqueTableCounts).reduce((sum: number, count: number) => sum + count, 0);

    if (totalRemaining === 0) {
      messages.push("🎉 Cleanup completed successfully! Database is completely clean.");
      return {
        success: true,
        messages,
        stats
      };
    } else {
      messages.push(`⚠️  Cleanup completed but ${totalRemaining} records still remain across all tables`);
      return {
        success: false,
        messages,
        stats,
        error: `${totalRemaining} records remaining`
      };
    }

  } catch (error: any) {
    messages.push(`💥 Unexpected error: ${error.message}`);
    return {
      success: false,
      messages,
      error: error.message
    };
  }
}

export async function checkServiceKey(): Promise<boolean> {
  return !!supabaseServiceKey;
}