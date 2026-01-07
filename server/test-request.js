(async () => {
  try {
    const res = await fetch('http://localhost:3001/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'ping' }),
      // timeout not supported directly in fetch; rely on default
    });
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const j = await res.json();
      console.log('STATUS', res.status);
      console.log('BODY', JSON.stringify(j, null, 2));
    } else {
      const t = await res.text();
      console.log('STATUS', res.status);
      console.log('BODY', t);
    }
  } catch (e) {
    console.error('ERROR', e && (e.message || e));
    process.exit(1);
  }
})();
