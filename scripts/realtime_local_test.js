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

(async function test() {
  console.log('Subscribing to changes...');
  const ch = supabase
    .channel('test-local')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'user_data', filter: `key=eq.glow-up-organizer-data` }, payload => {
      console.log('EVENT RECEIVED:', JSON.stringify(payload, null, 2));
    })
    .subscribe(status => console.log('sub status', status));

  // wait a bit for subscribe
  await new Promise(res => setTimeout(res, 1000));

  console.log('Upserting a test row...');
  const payload = { key: 'glow-up-organizer-data', value: { testDirect: Date.now() }, updated_at: new Date().toISOString() };
  const { error } = await supabase.from('user_data').upsert(payload, { onConflict: 'key' });
  if (error) console.error('upsert error', error);
  else console.log('upsert done');

  // wait to receive events
  await new Promise(res => setTimeout(res, 3000));

  // cleanup
  try { await ch.unsubscribe(); } catch (e) { }
  console.log('done');
  process.exit(0);
})();