import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCampoUsers() {
  console.log('🔍 Checking Campo users...');
  
  try {
    const { data: workers, error } = await supabase
      .from('workers')
      .select('*, tenant:tenants(*)')
      .eq('area_module', 'Campo')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log(`\n✅ Found ${workers.length} Campo user(s):\n`);
    
    workers.forEach((worker, index) => {
      console.log(`👤 Campo User ${index + 1}:`);
      console.log('┌─────────────────────────────────────────────────────┐');
      console.log(`│ 📧 Email: ${worker.email.padEnd(36)} │`);
      console.log(`│ 🔑 Password: campo123456${' '.repeat(24)} │`);
      console.log(`│ 👤 Name: ${worker.full_name.padEnd(37)} │`);
      console.log(`│ 🏷️  Role: Campo${' '.repeat(33)} │`);
      console.log(`│ 🏢 Tenant: ${worker.tenant.name.padEnd(35)} │`);
      console.log(`│ 📋 Document: ${worker.document_id.padEnd(32)} │`);
      console.log('└─────────────────────────────────────────────────────┘');
      console.log('');
    });
    
    console.log('🔗 Login at: http://localhost:3000/login');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkCampoUsers();