import { createClient } from '@supabase/supabase-js';

// Memanggil variabel environment yang HANYA ADA DI SERVER
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Praktik terbaik: Beri nama 'supabaseAdmin' agar kamu selalu ingat 
// bahwa ini memiliki hak akses penuh dan bisa menembus RLS.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);