const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWorkers() {
  const { data: workers, error } = await supabase
    .from('workers')
    .select('id, full_name, email, membership_id, status')
    .eq('status', 'active');
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log('\n📋 Trabajadores activos:');
  console.log('Total:', workers?.length || 0);
  console.log('\nDetalle:');
  workers?.forEach(w => {
    console.log(`\n  👤 ${w.full_name}`);
    console.log(`     Email: ${w.email}`);
    console.log(`     Membership ID: ${w.membership_id || '❌ NO ASIGNADO'}`);
  });
  
  const withMembership = workers?.filter(w => w.membership_id) || [];
  console.log(`\n✅ Con membresía: ${withMembership.length}`);
  console.log(`❌ Sin membresía: ${(workers?.length || 0) - withMembership.length}`);
}

checkWorkers();
