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

async function inspect() {
  try {
    const { data, error } = await supabase.from('user_data').select('key, value, updated_at').eq('key', 'glow-up-organizer-data').maybeSingle();
    if (error) {
      console.error('Supabase select error:', error);
      process.exit(1);
    }
    if (!data) {
      console.log('No row found for key glow-up-organizer-data');
      process.exit(0);
    }
    console.log('Found row:');
    console.log('updated_at:', data.updated_at);
    console.log('value:', JSON.stringify(data.value, null, 2));
  } catch (err) {
    console.error('Inspect failed', err);
    process.exit(1);
  }
}

inspect();
