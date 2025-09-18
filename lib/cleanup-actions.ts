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

    // 1. Delete all workers first
    messages.push("🗑️  Deleting all workers...");
    const { error: workersError } = await supabaseAdmin
      .from('workers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (workersError) {
      messages.push(`❌ Error deleting workers: ${workersError.message}`);
    } else {
      messages.push("✅ Workers deleted successfully");
    }

    // 2. Delete all tenants
    messages.push("🏢 Deleting all tenants...");
    const { error: tenantsError } = await supabaseAdmin
      .from('tenants')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (tenantsError) {
      messages.push(`❌ Error deleting tenants: ${tenantsError.message}`);
    } else {
      messages.push("✅ Tenants deleted successfully");
    }

    // 3. Delete all auth users
    messages.push("👥 Deleting all auth users...");
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      messages.push(`❌ Error listing users: ${listError.message}`);
    } else if (users.users.length > 0) {
      messages.push(`Found ${users.users.length} users to delete`);
      
      for (const user of users.users) {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        
        if (deleteError) {
          messages.push(`❌ Error deleting user ${user.email}: ${deleteError.message}`);
        } else {
          messages.push(`✅ User ${user.email || user.id} deleted`);
        }
      }
    } else {
      messages.push("No auth users found to delete");
    }

    // 4. Verify cleanup
    messages.push("🔍 Verifying cleanup...");
    
    const { count: finalWorkers } = await supabaseAdmin
      .from('workers')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalTenants } = await supabaseAdmin
      .from('tenants')
      .select('*', { count: 'exact', head: true });
    
    const { data: finalUsers } = await supabaseAdmin.auth.admin.listUsers();

    const stats = {
      workers: finalWorkers || 0,
      tenants: finalTenants || 0,
      authUsers: finalUsers?.users.length || 0
    };

    if (stats.workers === 0 && stats.tenants === 0 && stats.authUsers === 0) {
      messages.push("🎉 Cleanup completed successfully! Database is clean.");
      return {
        success: true,
        messages,
        stats
      };
    } else {
      messages.push("⚠️  Cleanup completed but some data may still remain");
      return {
        success: false,
        messages,
        stats
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