import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables (optional for mock mode)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

// Global singleton key to prevent multiple instances
const GLOBAL_KEY = '__seedor_supabase_client__';

// Declare global type for TypeScript
declare global {
  var __seedor_supabase_client__: SupabaseClient | undefined;
}

// Create real client only if env vars are present. Otherwise, provide a mock client
// that throws on use so callers can catch and fall back to local mocks.
let supabase: any;

if (supabaseUrl && supabaseAnonKey) {
  // Use global singleton (works across module re-evaluations)
  if (typeof globalThis !== 'undefined' && globalThis[GLOBAL_KEY]) {
    supabase = globalThis[GLOBAL_KEY];
  } else {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'seedor-auth', // Use a unique storage key
      }
    });
    
    // Store in globalThis to prevent multiple instances (works in both browser and Node.js)
    if (typeof globalThis !== 'undefined') {
      globalThis[GLOBAL_KEY] = supabase;
    }
  }
} else {
  if (typeof console !== 'undefined') {
    console.warn('[Supabase] NEXT_PUBLIC_SUPABASE_URL/ANON_KEY not set. Using mock client.');
  }
  const error = new Error('Supabase no configurado');
  const rejectPromise = () => new Promise((_, reject) => reject(error));
  const filterBuilder = {
    eq() { return rejectPromise(); },
  } as any;
  const tableBuilder = {
    select() { return filterBuilder; },
    insert() { return rejectPromise(); },
    update() { return rejectPromise(); },
    delete() { return rejectPromise(); },
    eq() { return rejectPromise(); },
  } as any;
  supabase = {
    from() { return tableBuilder; },
    auth: {
      onAuthStateChange() { return { data: { subscription: { unsubscribe: () => {} } } }; },
      getSession() { return rejectPromise(); },
      signOut() { return rejectPromise(); },
    }
  } as any;
}

export { supabase };
