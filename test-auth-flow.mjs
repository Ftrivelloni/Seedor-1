import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load environment variables from .env.local
const envContent = readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthFlow() {
  console.log('Testing complete auth flow...');
  
  // Step 1: Sign in
  console.log('\n1. Attempting login...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@empresa.com',
    password: '12345678'
  });
  
  if (authError) {
    console.log('❌ Login failed:', authError.message);
    return;
  }
  
  console.log('✅ Login successful');
  console.log('User ID:', authData.user?.id);
  console.log('Access token present:', !!authData.session?.access_token);
  
  // Step 2: Get worker info
  console.log('\n2. Getting worker profile...');
  const { data: worker, error: workerError } = await supabase
    .from('workers')
    .select(`
      *,
      tenant:tenants(*)
    `)
    .eq('email', 'admin@empresa.com')
    .eq('status', 'active')
    .single();
    
  if (workerError) {
    console.log('❌ Worker fetch failed:', workerError.message);
    return;
  }
  
  console.log('✅ Worker profile found');
  console.log('Worker name:', worker.full_name);
  console.log('Tenant ID:', worker.tenant_id);
  console.log('Area module:', worker.area_module);
  
  // Step 3: Test pallets access
  console.log('\n3. Testing pallets access...');
  const { data: pallets, error: palletsError } = await supabase
    .from('pallets')
    .select('*')
    .eq('tenant_id', worker.tenant_id);
    
  if (palletsError) {
    console.log('❌ Pallets fetch failed:', palletsError.message);
    return;
  }
  
  console.log('✅ Pallets access successful');
  console.log('Pallets found:', pallets.length);
  
  // Step 4: Check session persistence
  console.log('\n4. Checking session persistence...');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    console.log('❌ Session check failed:', sessionError?.message || 'No session');
    return;
  }
  
  console.log('✅ Session persisted');
  console.log('Session user ID:', session.user?.id);
  console.log('Session expires at:', new Date(session.expires_at * 1000).toISOString());
  
  // Step 5: Test session refresh
  console.log('\n5. Testing session refresh...');
  const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
  
  if (refreshError) {
    console.log('❌ Session refresh failed:', refreshError.message);
  } else {
    console.log('✅ Session refresh successful');
  }
}

testAuthFlow().catch(console.error);