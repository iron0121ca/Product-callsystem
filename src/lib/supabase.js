import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ishyhtympjphqkaieeud.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_vtxImjk27hsDa-o10lF-oA_uwe4K7o5';

export const supabase = createClient(supabaseUrl, supabaseKey);
