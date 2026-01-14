import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

(async function subscribe() {
  console.log('Subscribing to user_data changes for key=glow-up-organizer-data...');

  const channel = supabase
    .channel('public:user_data')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'user_data', filter: `key=eq.glow-up-organizer-data` }, (payload) => {
      console.log('Realtime event received:', JSON.stringify(payload, null, 2));
    })
    .subscribe((status) => {
      console.log('Subscription status:', status);
    });

  // keep process alive
  process.stdin.resume();
})();