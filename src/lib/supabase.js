import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ishyhtympjphqkaieeud.supabase.co';
const supabaseKey = 'sb_publishable_vtxImjk27hsDa-o10lF-oA_uwe4K7o5';

export const supabase = createClient(supabaseUrl, supabaseKey);