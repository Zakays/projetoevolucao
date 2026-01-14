import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Import handlers after dotenv so env vars are available at module initialization
let loadHandler, saveHandler;

function makeRes() {
  let status = 200;
  const headers = {};
  let body = null;
  return {
    status(code) { status = code; return this; },
    setHeader(k, v) { headers[k] = v; },
    json(obj) { body = obj; console.log('RES JSON', status, JSON.stringify(body, null, 2)); },
    end() { console.log('END', status); },
    send(obj) { body = obj; console.log('RES SEND', status, obj); },
  };
}

(async () => {
  // dynamic imports so .env.local is loaded before supabase client initialization
  ({ default: loadHandler } = await import('../api/load.js'));
  ({ default: saveHandler } = await import('../api/save.js'));

  console.log('Testing load handler (existing key)...');
  await loadHandler({ method: 'GET', query: { key: 'glow-up-organizer-data' } }, makeRes());

  console.log('Testing save handler (dry run update)...');
  const payload = { key: 'glow-up-organizer-data', value: { testSavedAt: new Date().toISOString() } };
  await saveHandler({ method: 'POST', body: payload }, makeRes());

  console.log('Verifying load after save...');
  await loadHandler({ method: 'GET', query: { key: 'glow-up-organizer-data' } }, makeRes());
})();