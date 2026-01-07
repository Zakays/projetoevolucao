#!/usr/bin/env node
// CommonJS interactive test client to POST to local AI proxy and show the response
// Usage:
//   node server/test-proxy-cli.cjs           (interactive)
//   node server/test-proxy-cli.cjs "ping"  (send single message and exit)

const readline = require('readline');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const PROXY_URL = process.env.PROXY_URL || 'http://127.0.0.1:3001/api/ai';

function postMessage(message) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(PROXY_URL);
      const payload = JSON.stringify({ message });
      const opts = {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + (u.search || ''),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 20000,
      };

      const client = u.protocol === 'https:' ? https : http;
      const req = client.request(opts, (res) => {
        const bufs = [];
        res.on('data', (c) => bufs.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(bufs).toString('utf8');
          resolve({ status: res.statusCode, headers: res.headers, body: raw });
        });
      });

      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy(new Error('request timeout'));
      });

      req.write(payload);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function singleSend(message) {
  console.log('Sending single message to', PROXY_URL);
  try {
    const res = await postMessage(message);
    console.log('status', res.status);
    try {
      const json = JSON.parse(res.body);
      console.log('JSON response:');
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('raw response:');
      console.log(res.body);
    }
  } catch (err) {
    console.error('Request failed:', err && err.message ? err.message : String(err));
  }
}

async function interactive() {
  console.log('Test proxy CLI (interactive)');
  console.log('Posting to:', PROXY_URL);
  console.log("Type a message and press Enter (Ctrl+C to exit).\n");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });

  rl.on('SIGINT', () => {
    console.log('\nExiting.');
    rl.close();
    process.exit(0);
  });

  for await (const line of rl) {
    const message = String(line || '').trim();
    if (!message) {
      console.log('(empty message, try again)');
      continue;
    }
    console.log('\n→ Sending:', message);
    try {
      const res = await postMessage(message);
      console.log('← status', res.status);
      if (res.headers) console.log('← headers:', res.headers);
      try {
        const json = JSON.parse(res.body);
        console.log('← JSON response:');
        console.log(JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('← raw response:');
        console.log(res.body);
      }
    } catch (err) {
      console.error('Request failed:', err && err.message ? err.message : String(err));
      console.log('Tip: make sure the local proxy is running (node server/ai-proxy.js)');
    }
    console.log('\nType another message (or Ctrl+C to exit):');
  }
}

(async function main() {
  const arg = process.argv.slice(2).join(' ').trim();
  if (arg) return singleSend(arg);
  return interactive();
})();
