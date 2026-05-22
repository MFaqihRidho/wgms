import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
const legacySupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const supabaseKey = supabasePublishableKey ?? legacySupabaseAnonKey

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey)

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl!, supabaseKey!, {
      realtime: { params: { eventsPerSecond: 20 } },
    })
  : null

export function requireSupabase() {
  if (!supabase) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.local and fill Supabase credentials.')
  }

  return supabase
}
