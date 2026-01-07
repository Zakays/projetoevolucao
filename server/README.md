AI proxy server

This is a minimal Express proxy that calls your LLM endpoint and normalizes the response into a `commands` array.

Usage

1. Install dependencies:

```bash
npm install express body-parser zod
```

2. Start the server (set `AI_API_URL` and `AI_API_KEY` env vars if you have a model endpoint):

```bash
AI Proxy (GlowUp)

This proxy forwards prompts from the frontend to a generative model (Gemini) and returns structured `commands` when possible.

Why use the proxy
- Keep API keys on the server (not exposed to the browser).
- Rotate keys centrally when quotas are exceeded.
- Request JSON-mode responses (structured outputs) and validate them server-side.

Quick start
1. Install dependencies:

```bash
npm install
npm install @google/generative-ai express body-parser zod
```

2. Add your Gemini API keys (one per line) to `server/.gemini_keys`.

3. Start the proxy:

```bash
node server/ai-proxy.js
```

4. Call the proxy from the frontend:

```http
POST http://localhost:3001/api/ai
Content-Type: application/json

{ "prompt": "Crie um habito chamado Beber água 3x por dia" }
```

Notes
- The proxy attempts SDK-based calls first and falls back to REST.
- If the provider rejects `Authorization: Bearer`, the proxy retries with `?key=API_KEY` for Gemini endpoints.
- Exhausted/errored keys are removed from `server/.gemini_keys` automatically.

Security
- Keep `server/.gemini_keys` out of source control.
- For production, use a secure secret store instead of flat files.
