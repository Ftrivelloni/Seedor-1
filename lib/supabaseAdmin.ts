import { createClient } from '@supabase/supabase-js';

// Service role client for administrative operations
let supabaseAdmin: any = null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Function to get worker by user ID with proper permissions
export async function getWorkerByUserId(userId: string): Promise<{ data: any | null; error: any }> {
  if (!supabaseAdmin) {
    console.log('📝 Service role not available, using regular client with RLS');
    // Import regular client
    const { supabase } = await import('./supabaseClient');
    
    // Try a different approach - get user profile first, then worker
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        return { data: null, error: userError || new Error('No authenticated user') };
      }
      
      // Use the authenticated context to query workers
      const { data: workers, error: workersError } = await supabase
        .from('workers')
        .select('*')
        .eq('membership_id', userId);
        
      return { 
        data: workers && workers.length > 0 ? workers[0] : null, 
        error: workersError 
      };
    } catch (error) {
      return { data: null, error };
    }
  } else {
    console.log('🔧 Using service role client to bypass RLS');
    
    try {
      const { data: worker, error } = await supabaseAdmin
        .from('workers')
        .select('*')
        .eq('membership_id', userId)
        .single();
        
      return { data: worker, error };
    } catch (error) {
      return { data: null, error };
    }
  }
}

// Function to get worker by email with proper permissions
export async function getWorkerByEmail(email: string): Promise<{ data: any | null; error: any }> {
  if (!supabaseAdmin) {
    console.log('📝 Service role not available for email lookup, using regular client');
    const { supabase } = await import('./supabaseClient');
    
    try {
      const { data: workers, error } = await supabase
        .from('workers')
        .select('*')
        .or(`email.eq.${email},membership_id.is.null`);
        
      const emailWorker = workers?.find((w: any) => w.email === email);
      return { data: emailWorker || null, error };
    } catch (error) {
      return { data: null, error };
    }
  } else {
    console.log('🔧 Using service role client for email lookup');
    
    try {
      const { data: workers, error } = await supabaseAdmin
        .from('workers')
        .select('*')
        .eq('email', email);
        
      return { 
        data: workers && workers.length > 0 ? workers[0] : null, 
        error 
      };
    } catch (error) {
      return { data: null, error };
    }
  }
}

// Function to update worker with proper permissions
export async function updateWorkerMembership(workerId: string, membershipId: string): Promise<{ data: any | null; error: any }> {
  if (!supabaseAdmin) {
    console.log('📝 Service role not available for update, using regular client');
    const { supabase } = await import('./supabaseClient');
    
    try {
      const { data, error } = await supabase
        .from('workers')
        .update({ membership_id: membershipId, status: 'active' })
        .eq('id', workerId)
        .select('*')
        .single();
        
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  } else {
    console.log('🔧 Using service role client for worker update');
    
    try {
      const { data, error } = await supabaseAdmin
        .from('workers')
        .update({ membership_id: membershipId, status: 'active' })
        .eq('id', workerId)
        .select('*')
        .single();
        
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }
}

export { supabaseAdmin };