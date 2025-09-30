/**
 * Worker Profile Repair Script
 * This script attempts to fix common worker profile issues
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function repairWorkerProfiles() {
  console.log('🔧 Starting Worker Profile Repair...\n');

  try {
    // 1. Get all auth users and workers
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    const { data: allWorkers, error: workersError } = await supabase
      .from('workers')
      .select('*');

    if (authError || workersError) {
      console.error('❌ Error fetching data:', { authError, workersError });
      return;
    }

    console.log(`📊 Found ${authUsers?.users?.length || 0} auth users and ${allWorkers?.length || 0} workers\n`);

    let repairsNeeded = 0;
    let repairsSuccessful = 0;

    // 2. Fix workers without membership_id
    const workersWithoutMembershipId = allWorkers?.filter(w => !w.membership_id) || [];
    
    for (const worker of workersWithoutMembershipId) {
      console.log(`🔧 Repairing worker without membership_id: ${worker.email}`);
      
      // Find corresponding auth user
      const authUser = authUsers?.users?.find(u => u.email === worker.email);
      
      if (authUser) {
        repairsNeeded++;
        
        const { error: updateError } = await supabase
          .from('workers')
          .update({ 
            membership_id: authUser.id,
            status: 'active'
          })
          .eq('id', worker.id);
          
        if (updateError) {
          console.error(`❌ Failed to update worker ${worker.email}:`, updateError);
        } else {
          console.log(`✅ Successfully linked worker ${worker.email} to auth user ${authUser.id}`);
          repairsSuccessful++;
        }
      } else {
        console.log(`⚠️  No auth user found for worker ${worker.email}`);
      }
    }

    // 3. Activate inactive workers
    const inactiveWorkers = allWorkers?.filter(w => w.status !== 'active' && w.membership_id) || [];
    
    for (const worker of inactiveWorkers) {
      console.log(`🔧 Activating inactive worker: ${worker.email}`);
      repairsNeeded++;
      
      const { error: activateError } = await supabase
        .from('workers')
        .update({ status: 'active' })
        .eq('id', worker.id);
        
      if (activateError) {
        console.error(`❌ Failed to activate worker ${worker.email}:`, activateError);
      } else {
        console.log(`✅ Successfully activated worker ${worker.email}`);
        repairsSuccessful++;
      }
    }

    console.log(`\n🎯 REPAIR SUMMARY:`);
    console.log(`   Repairs needed: ${repairsNeeded}`);
    console.log(`   Repairs successful: ${repairsSuccessful}`);
    console.log(`   Success rate: ${repairsNeeded > 0 ? Math.round((repairsSuccessful / repairsNeeded) * 100) : 100}%`);

    if (repairsSuccessful > 0) {
      console.log('\n✅ Repairs completed! Try logging in again.');
    } else if (repairsNeeded === 0) {
      console.log('\n✅ No repairs needed. Worker profiles look good!');
    }

  } catch (error) {
    console.error('❌ Repair failed:', error);
  }
}

// Run the repair
repairWorkerProfiles();