/**
 * Diagnostic script to understand worker profile issues
 * Run this to get detailed information about the current database state
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseWorkerIssues() {
  console.log('🔍 Starting Worker Profile Diagnostic...\n');

  try {
    // 1. Check total workers
    const { data: allWorkers, error: workersError } = await supabase
      .from('workers')
      .select('*');

    console.log('📊 Total Workers in Database:', allWorkers?.length || 0);
    if (workersError) {
      console.error('❌ Error fetching workers:', workersError);
      return;
    }

    // 2. Check workers without membership_id
    const workersWithoutMembershipId = allWorkers?.filter(w => !w.membership_id) || [];
    console.log('🔴 Workers without membership_id:', workersWithoutMembershipId.length);
    if (workersWithoutMembershipId.length > 0) {
      console.log('Workers missing membership_id:');
      workersWithoutMembershipId.forEach(w => {
        console.log(`  - ID: ${w.id}, Email: ${w.email}, Status: ${w.status}`);
      });
      console.log();
    }

    // 3. Check inactive workers
    const inactiveWorkers = allWorkers?.filter(w => w.status !== 'active') || [];
    console.log('🟡 Inactive Workers:', inactiveWorkers.length);
    if (inactiveWorkers.length > 0) {
      console.log('Inactive workers:');
      inactiveWorkers.forEach(w => {
        console.log(`  - ID: ${w.id}, Email: ${w.email}, Status: ${w.status}, MembershipID: ${w.membership_id}`);
      });
      console.log();
    }

    // 4. Check tenants
    const { data: allTenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('*');

    console.log('🏢 Total Tenants in Database:', allTenants?.length || 0);
    if (tenantsError) {
      console.error('❌ Error fetching tenants:', tenantsError);
    }

    // 5. Check auth users (if we have service role access)
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      console.log('👥 Total Auth Users:', authUsers?.users?.length || 0);
      
      if (authUsers?.users) {
        // Find auth users without corresponding workers
        const authUserEmails = authUsers.users.map(u => u.email).filter(Boolean);
        const workerEmails = allWorkers?.map(w => w.email) || [];
        
        const authWithoutWorkers = authUserEmails.filter(email => !workerEmails.includes(email));
        console.log('🔴 Auth Users without Worker Records:', authWithoutWorkers.length);
        if (authWithoutWorkers.length > 0) {
          console.log('Auth users missing worker records:');
          authWithoutWorkers.forEach(email => {
            const authUser = authUsers.users.find(u => u.email === email);
            console.log(`  - Email: ${email}, ID: ${authUser?.id}, Created: ${authUser?.created_at}`);
          });
          console.log();
        }

        // Find workers without corresponding auth users
        const workersWithoutAuth = workerEmails.filter(email => !authUserEmails.includes(email));
        console.log('🔴 Workers without Auth Users:', workersWithoutAuth.length);
        if (workersWithoutAuth.length > 0) {
          console.log('Workers missing auth users:');
          workersWithoutAuth.forEach(email => {
            const worker = allWorkers?.find(w => w.email === email);
            console.log(`  - Email: ${email}, ID: ${worker?.id}, MembershipID: ${worker?.membership_id}`);
          });
          console.log();
        }
      }
    } catch (authError) {
      console.log('⚠️  Cannot access auth users (service role key may be missing)');
    }

    // 6. Summary and recommendations
    console.log('🎯 RECOMMENDATIONS:');
    
    if (workersWithoutMembershipId.length > 0) {
      console.log('  1. Fix workers without membership_id by linking them to auth users');
    }
    
    if (inactiveWorkers.length > 0) {
      console.log('  2. Activate inactive workers if they should be active');
    }
    
    console.log('  3. When creating new tenants, ensure worker records are created properly');
    console.log('  4. Check browser console for detailed authentication debugging');

  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }
}

// Run the diagnostic
diagnoseWorkerIssues();