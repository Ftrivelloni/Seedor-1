import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Global singleton key for admin client
const GLOBAL_ADMIN_KEY = '__seedor_supabase_admin_client__';

// Declare global type for TypeScript
declare global {
  var __seedor_supabase_admin_client__: SupabaseClient | undefined;
}

// Service role client for administrative operations
let supabaseAdmin: SupabaseClient | null = null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (supabaseUrl && supabaseServiceKey) {
  // Use global singleton (works across module re-evaluations)
  if (typeof globalThis !== 'undefined' && globalThis[GLOBAL_ADMIN_KEY]) {
    supabaseAdmin = globalThis[GLOBAL_ADMIN_KEY];
  } else {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Store in globalThis to prevent multiple instances
    if (typeof globalThis !== 'undefined') {
      globalThis[GLOBAL_ADMIN_KEY] = supabaseAdmin;
    }
  }
}

// Function to get worker by user ID (membership user_id) with proper permissions
export async function getWorkerByUserId(userId: string): Promise<{ data: any | null; error: any }> {
  if (!supabaseAdmin) {
    const { supabase } = await import('./supabaseClient');
    
    try {
      // First get the membership
      const { data: membership, error: membershipError } = await supabase
        .from('tenant_memberships')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (membershipError || !membership) {
        return { data: null, error: membershipError || new Error('No membership found') };
      }
      
      // Then get the worker using membership_id
      const { data: worker, error: workerError } = await supabase
        .from('workers')
        .select('*, membership:tenant_memberships!workers_membership_id_fkey(*)')
        .eq('membership_id', membership.id)
        .single();
        
      return { data: worker, error: workerError };
    } catch (error) {
      return { data: null, error };
    }
  } else {
    
    try {
      // Get membership first
      const { data: membership, error: membershipError } = await supabaseAdmin
        .from('tenant_memberships')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (membershipError || !membership) {
        return { data: null, error: membershipError || new Error('No membership found') };
      }
      
      // Get worker with membership data
      const { data: worker, error: workerError } = await supabaseAdmin
        .from('workers')
        .select('*, membership:tenant_memberships!workers_membership_id_fkey(*)')
        .eq('membership_id', membership.id)
        .single();
        
      return { data: worker, error: workerError };
    } catch (error) {
      return { data: null, error };
    }
  }
}

// Function to get worker by email with proper permissions
export async function getWorkerByEmail(email: string): Promise<{ data: any | null; error: any }> {
  if (!supabaseAdmin) {
    const { supabase } = await import('./supabaseClient');
    
    try {
      const { data: worker, error } = await supabase
        .from('workers')
        .select('*, membership:tenant_memberships!workers_membership_id_fkey(*), tenant:tenants(*)')
        .eq('email', email)
        .single();
        
      return { data: worker, error };
    } catch (error) {
      return { data: null, error };
    }
  } else {
    
    try {
      const { data: worker, error } = await supabaseAdmin
        .from('workers')
        .select('*, membership:tenant_memberships!workers_membership_id_fkey(*), tenant:tenants(*)')
        .eq('email', email)
        .single();
        
      return { data: worker, error };
    } catch (error) {
      return { data: null, error };
    }
  }
}

// Function to update worker with proper permissions
export async function updateWorkerMembership(workerId: string, membershipId: string): Promise<{ data: any | null; error: any }> {
  if (!supabaseAdmin) {
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