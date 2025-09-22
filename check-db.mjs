import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Checking database...');
  
  try {
    // Check tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log('📋 Tenants:', tenants?.length || 0);
    if (tenants && tenants.length > 0) {
      console.log('First tenant:', tenants[0]);
    }
    
    // Check workers
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('*, tenant:tenants(*)')
      .order('created_at', { ascending: false });
    
    console.log('👥 Workers:', workers?.length || 0);
    if (workers && workers.length > 0) {
      console.log('First worker:', {
        email: workers[0].email,
        full_name: workers[0].full_name,
        tenant_id: workers[0].tenant_id,
        area_module: workers[0].area_module,
        status: workers[0].status
      });
    }
    
    // Check auth users
    const { data: authUsers, count } = await supabase.auth.admin.listUsers();
    console.log('🔐 Auth users:', count || 0);
    
    if (tenantsError) console.error('❌ Tenants error:', tenantsError);
    if (workersError) console.error('❌ Workers error:', workersError);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDatabase();