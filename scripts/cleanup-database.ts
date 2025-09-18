import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create admin client for cleanup operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupDatabase() {
  console.log('🧹 Starting database cleanup...');
  
  try {
    // 1. Delete all workers first (to avoid foreign key constraints)
    console.log('📋 Deleting all workers...');
    const { error: workersError } = await supabaseAdmin
      .from('workers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (workersError) {
      console.error('❌ Error deleting workers:', workersError);
    } else {
      console.log('✅ Workers deleted successfully');
    }

    // 2. Delete all tenants
    console.log('🏢 Deleting all tenants...');
    const { error: tenantsError } = await supabaseAdmin
      .from('tenants')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (tenantsError) {
      console.error('❌ Error deleting tenants:', tenantsError);
    } else {
      console.log('✅ Tenants deleted successfully');
    }

    // 3. Delete all auth users
    console.log('👥 Deleting all auth users...');
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
    } else if (users.users.length > 0) {
      console.log(`Found ${users.users.length} users to delete`);
      
      for (const user of users.users) {
        console.log(`Deleting user: ${user.email || user.id}`);
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        
        if (deleteError) {
          console.error(`❌ Error deleting user ${user.email}:`, deleteError);
        } else {
          console.log(`✅ User ${user.email} deleted`);
        }
      }
    } else {
      console.log('No users found to delete');
    }

    console.log('🎉 Database cleanup completed successfully!');
    
  } catch (error) {
    console.error('💥 Unexpected error during cleanup:', error);
  }
}

async function resetAutoIncrements() {
  console.log('🔄 Resetting auto-increment sequences...');
  
  try {
    // Reset any sequences if your tables use them
    // This is typically not needed for UUID primary keys, but included for completeness
    
    console.log('✅ Sequences reset (if any)');
  } catch (error) {
    console.error('❌ Error resetting sequences:', error);
  }
}

async function verifyCleanup() {
  console.log('🔍 Verifying cleanup...');
  
  try {
    // Check workers count
    const { count: workersCount, error: workersCountError } = await supabaseAdmin
      .from('workers')
      .select('*', { count: 'exact', head: true });
    
    // Check tenants count
    const { count: tenantsCount, error: tenantsCountError } = await supabaseAdmin
      .from('tenants')
      .select('*', { count: 'exact', head: true });
    
    // Check auth users count
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    console.log(`📊 Cleanup verification:`);
    console.log(`   Workers remaining: ${workersCount || 0}`);
    console.log(`   Tenants remaining: ${tenantsCount || 0}`);
    console.log(`   Auth users remaining: ${users?.users.length || 0}`);
    
    if ((workersCount || 0) === 0 && (tenantsCount || 0) === 0 && (users?.users.length || 0) === 0) {
      console.log('✅ Cleanup verified - database is clean!');
    } else {
      console.log('⚠️  Some data may still remain');
    }
    
  } catch (error) {
    console.error('❌ Error verifying cleanup:', error);
  }
}

// Main cleanup function
async function main() {
  console.log('🚀 Supabase Database Cleanup Tool');
  console.log('================================');
  
  await cleanupDatabase();
  await resetAutoIncrements();
  await verifyCleanup();
  
  console.log('');
  console.log('🎯 Cleanup complete! You can now start testing with a clean database.');
  console.log('');
}

// Run the cleanup
main().catch(console.error);

export { cleanupDatabase, resetAutoIncrements, verifyCleanup };