import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { randomUUID } from 'crypto';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

async function createCampoUser() {
  console.log('🌾 Creating Campo user...');
  
  try {
    // First, get existing tenant (if any)
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('*')
      .limit(1);
    
    if (tenantsError) {
      console.error('❌ Error fetching tenants:', tenantsError);
      return;
    }
    
    let tenantId;
    
    if (tenants && tenants.length > 0) {
      tenantId = tenants[0].id;
      console.log('✅ Using existing tenant:', tenants[0].name);
    } else {
      // Create a test tenant first
      console.log('📋 Creating test tenant...');
      const { data: newTenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: 'Test Farm',
          slug: 'test-farm-' + Date.now(),
          plan: 'basico',
          primary_crop: 'manzanas',
          contact_email: 'admin@testfarm.com',
          created_by: 'system'
        })
        .select()
        .single();
      
      if (tenantError) {
        console.error('❌ Error creating tenant:', tenantError);
        return;
      }
      
      tenantId = newTenant.id;
      console.log('✅ Created tenant:', newTenant.name);
    }
    
    // Create Supabase auth user for campo worker
    const timestamp = Date.now();
    const campoUserData = {
      email: `campo${timestamp}@testfarm.com`,
      password: 'campo123456',
      full_name: 'Juan Campo',
      phone: '+1234567890',
      document_id: `CAMPO${timestamp}`
    };
    
    console.log('🔐 Creating Supabase auth user...');
    
    if (!supabaseAdmin) {
      console.error('❌ Service role key required to create auth users');
      console.log('💡 You can create the auth user manually in Supabase dashboard');
      console.log('📧 Email:', campoUserData.email);
      console.log('🔑 Password:', campoUserData.password);
      return;
    }
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: campoUserData.email,
      password: campoUserData.password,
      email_confirm: true
    });
    
    if (authError) {
      console.error('❌ Error creating auth user:', authError);
      return;
    }
    
    console.log('✅ Created Supabase auth user');
    
    // Create worker record
    console.log('👷 Creating worker record...');
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .insert({
        tenant_id: tenantId,
        full_name: campoUserData.full_name,
        document_id: campoUserData.document_id,
        email: campoUserData.email,
        phone: campoUserData.phone,
        area_module: 'Campo',
        membership_id: randomUUID(), // Generate a proper UUID
        status: 'active'
      })
      .select()
      .single();
    
    if (workerError) {
      console.error('❌ Error creating worker:', workerError);
      return;
    }
    
    console.log('✅ Created worker record');
    
    console.log('\n🎉 Campo user created successfully!');
    console.log('📊 Login details:');
    console.log('┌─────────────────────────────────────┐');
    console.log('│ 📧 Email: campo@testfarm.com        │');
    console.log('│ 🔑 Password: campo123456            │');
    console.log('│ 👤 Name: Juan Campo                 │');
    console.log('│ 🏷️  Role: Campo                      │');
    console.log('│ 🏢 Tenant:', tenants?.[0]?.name || 'Test Farm'.padEnd(19), '│');
    console.log('└─────────────────────────────────────┘');
    console.log('\n🔗 You can now login at: http://localhost:3000/login');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createCampoUser();