import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

let client: SupabaseClient | null = null;

/**
 * Browser-side Supabase client used for Google OAuth via Supabase Auth.
 * Sessions are not persisted here — after the OAuth redirect the access token
 * is exchanged for Homewolves' own JWTs via the API (POST /auth/supabase), so
 * the Supabase session is intentionally ephemeral.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (client) return client;
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export const supabaseRedirectUrl = process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL ?? 'http://localhost:3000/auth/callback';

export function supabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}