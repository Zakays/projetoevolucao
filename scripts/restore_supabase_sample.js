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

async function restore() {
  const payload = {
    key: 'glow-up-organizer-data',
    value: {
      habits: [
        {
          id: 'test-habit-1',
          name: 'Hábito de Teste',
          streak: 0,
          weight: 1,
          category: 'estetica',
          createdAt: '2026-01-13 16:35:24.941964+00',
          daysOfWeek: [1,2,3],
          isEssential: false,
        }
      ],
      lastUpdated: '2026-01-13 16:35:24.941964+00'
    },
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('user_data').upsert(payload, { onConflict: 'key' });
  if (error) {
    console.error('Restore upsert error:', error);
    process.exit(1);
  }
  console.log('Restored sample data to Supabase.');
}

restore();
