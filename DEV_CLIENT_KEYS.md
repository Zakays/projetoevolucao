DEV CLIENT KEYS (browser direct calls) — FOR LOCAL DEV ONLY

WARNING: Calling Gemini directly from the browser with a client API key will expose the key to anyone who inspects your network requests or the application bundle. Use only for local testing.

Setup (local development):

1. Create `.env.local` in your project root (DO NOT commit):

   VITE_GEMINI_API_KEY=<your_key_here>
   VITE_GEMINI_API_URL=https://generative.googleapis.com/v1beta2/models/text-bison-001:generate  # optional

2. Optional: allow client keys in production (NOT RECOMMENDED):

   VITE_ALLOW_CLIENT_KEYS=true

   Note: This project allows client-side Gemini calls by default. This is dangerous for public deployments — do not commit your key or publish the site with keys active.

Usage (example):

import { sendMessageDirectly } from '@/lib/geminiClient';

const { response } = await sendMessageDirectly('Oi, tudo bem?');
console.log(response);

Notes & precautions:
- Do NOT commit `.env.local` with your key.
- If you later publish the site, rotate this key immediately.
- Prefer a server-side proxy for any real deployment.
