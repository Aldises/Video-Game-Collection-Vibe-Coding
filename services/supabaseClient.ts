import { createClient } from '@supabase/supabase-js';

// --- Hardcoded Supabase Credentials ---
// IMPORTANT: In a real-world application, these values should be stored securely
// as environment variables (e.g., in a .env file or deployment settings), not
// hardcoded in the source code. They are placed here directly to ensure the
// application runs correctly in this specific sandboxed environment.
const supabaseUrl = 'https://ugqpevvkftkyfuqyfruu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVncXBldnZrZnRreWZ1cXlmcnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNDQ0MDUsImV4cCI6MjA3NzgyMDQwNX0.a0Mpx0k9fpd8kHghsbmgbu13R9kLks2SGebrSFwAoOU';

if (!supabaseUrl || !supabaseAnonKey) {
  // This check remains as a safeguard, although it should not be triggered with hardcoded values.
  throw new Error('Supabase URL and Anon Key must be provided.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
