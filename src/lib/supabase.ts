import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy singleton for browser client
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// Backwards-compat alias — use getSupabase() for lazy init
export const supabase = {
  get from() { return getSupabase().from.bind(getSupabase()); },
  get auth() { return getSupabase().auth; },
  get rpc() { return getSupabase().rpc.bind(getSupabase()); },
};

// Server-side client with service role
export function createServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
  return createClient(url, key, { auth: { persistSession: false } });
}
