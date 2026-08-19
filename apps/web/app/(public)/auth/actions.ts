'use client';

import { getSupabaseClient, supabaseRedirectUrl, supabaseConfigured } from '@/lib/supabase';

export type GoogleSignInResult = { ok: true } | { ok: false; message: string };

/**
 * Starts Google OAuth via Supabase Auth. When Supabase env vars are absent the
 * call degrades gracefully (returns a message) instead of throwing, matching
 * the platform's soft-fallback convention.
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  if (!supabaseConfigured()) {
    return { ok: false, message: 'Google sign-in is not configured yet. Use your email to continue.' };
  }
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, message: 'Google sign-in is unavailable right now.' };
  }
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: supabaseRedirectUrl },
  });
  if (error) {
    return { ok: false, message: error.message ?? 'Google sign-in failed.' };
  }
  return { ok: true };
}