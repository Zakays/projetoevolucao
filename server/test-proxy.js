#!/usr/bin/env node
// Simple HTTP test client to POST to local AI proxy without using fetch
// Usage: node server/test-proxy.js "Your prompt here"

const http = require('http');
const url = require('url');

(async function main() {
  const prompt = process.argv.slice(2).join(' ') || 'ping';
  const target = process.env.PROXY_URL || 'http://127.0.0.1:3001/api/ai';
  const parsed = url.parse(target);

  const payload = JSON.stringify({ message: prompt });

  const opts = {
    hostname: parsed.hostname,
    port: parsed.port || 80,
    path: parsed.path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  console.log(`[test-proxy] POST ${target}`);
  console.log(`[test-proxy] message: ${prompt}`);

  const req = http.request(opts, (res) => {
    let bufs = [];
    res.on('data', (chunk) => bufs.push(chunk));
    res.on('end', () => {
      const raw = Buffer.concat(bufs).toString('utf8');
      console.log(`[test-proxy] status ${res.statusCode}`);
      console.log('[test-proxy] response headers:', res.headers);
      try {
        const json = JSON.parse(raw);
        console.log('[test-proxy] parsed JSON response:');
        console.log(JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('[test-proxy] raw response body:');
        console.log(raw);
      }
    });
  });

  req.on('error', (err) => {
    console.error('[test-proxy] request error:', err && err.message);
    process.exit(2);
  });

  req.write(payload);
  req.end();
})();
