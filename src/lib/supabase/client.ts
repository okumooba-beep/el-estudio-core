import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * `null` until VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY exist (see .env.example).
 * Until then, repositories fall back to local persistence — see
 * src/features/boceto/bocetoRepository.ts for the pattern.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey)
  : null
