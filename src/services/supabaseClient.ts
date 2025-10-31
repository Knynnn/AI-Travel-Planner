import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useSettings } from '@/store/settings';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const s = useSettings.getState();
  if (!s.supabaseUrl || !s.supabaseAnonKey) return null;
  if (!client) client = createClient(s.supabaseUrl, s.supabaseAnonKey);
  return client;
}