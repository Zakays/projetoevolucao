# Real-time Sync & Mobile Sync (Android)

## Overview ✅

This project's persistence is single-user (no auth) and stores an application snapshot in Supabase in a `user_data` table. Sync is implemented as:

- A small server (see `server/index.js`) that exposes `/api/save` and `/api/load` endpoints and uses the Supabase Service Role key to upsert and read the `user_data` row.
- Frontend `src/lib/persistence.ts` calls `/api/save` and `/api/load` (with a configurable base URL) for writes/reads.
- `src/lib/storage.ts` stores the local app state (Indexed/localStorage), enqueues snapshots for offline-first operation, and processes a sync queue to push snapshots to the server.
- Real-time updates are handled via Supabase Realtime: the client subscribes to `user_data` changes for the single storage key and calls `pullFromServer()` when a change is received.

This combination provides offline-first local writes, reliable queued uploads, and near real-time cross-client update propagation.

---

## Key files 🔧

- `server/index.js` — server API that upserts/selects `user_data` rows using the SUPABASE_SERVICE_ROLE_KEY. Deploy this to a host (Vercel serverless functions, Render, etc.).
- `src/lib/persistence.ts` — client-side abstraction for save/load; supports `VITE_PERSISTENCE_BASE_URL` to call the hosted `/api` endpoints from mobile apps.
- `src/lib/supabase.ts` — creates a Supabase client with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (used for realtime subscriptions).
- `src/lib/storage.ts` — the local data manager. It now provides: `backupToSupabase()`, `restoreFromSupabase()`, and `subscribeToRealtime()`.
- `SUPABASE_GOOGLE_AUTH_SETUP.md` — now contains updated instructions about realtime and mobile sync.

---

## Required environment variables 🌐

Frontend (Vite):

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key (safe for client use)
- `VITE_PERSISTENCE_BASE_URL` — Optional; set to `https://projetoevolucao.vercel.app` for mobile builds so the app calls the hosted server API

Server (Host):

- `SUPABASE_URL` — Supabase URL (same as VITE_SUPABASE_URL)
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (must only exist on server)

> Note: the server sets CORS to `*` by default which allows mobile apps to reach it. You can tighten CORS as needed.

---

## Deploying the server 🔁

You can deploy `server/index.js` to any Node host. On Vercel you can either:

- Create a Serverless Function that mirrors the `/api/save` and `/api/load` behavior (similar logic to `server/index.js`), and
- Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Vercel Project Environment Variables.

After deployment, set `VITE_PERSISTENCE_BASE_URL` in your mobile app build to the deployment URL.

---

## Android (Capacitor) sync setup 📱

1. In your mobile app build environment set:

```env
VITE_PERSISTENCE_BASE_URL=https://projetoevolucao.vercel.app
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_XXXX
```

2. Build the Android app so these Vite env vars are bundled into the web app.
3. On app startup the web bundle will call `storage.restoreFromSupabase()` (non-blocking) and subscribe to realtime updates via the anon key.
4. Ensure the hosted server is accessible from the mobile device and that CORS allows access (server currently sets `Access-Control-Allow-Origin: *`).

---

## How the real-time flow works (simple):

- Client A saves changes — `storage.saveData()` enqueues snapshot and `processSyncQueue()` eventually calls `/api/save`.
- Server upserts `user_data` row in Supabase.
- Supabase emits a realtime change event for `user_data`.
- Client B (subscribed via `subscribeToRealtime`) receives the event and calls `restoreFromSupabase()` to pull updated data; UI refreshes as `glowup:data-changed` is dispatched.

---

## Testing sync locally 🧪

1. Run the server locally: `node server/index.js` (ensure `.env.local` contains `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`).
2. Run frontend: `pnpm dev`.
3. Open the site in two different browser windows. Make a change in one; the other should receive the update within seconds (via realtime).
4. For a mobile test, set `VITE_PERSISTENCE_BASE_URL` to `http://localhost:3001` (or your server dev URL) and load the Android WebView or emulator build.

---

## Notes & Limitations ⚠️

- This app is intentionally single-user: there is a single `user_data` row keyed by `glow-up-organizer-data`.
- RLS (Row Level Security) is disabled for this table in your Supabase setup; this is intentional for single-user usage but not suitable for multi-user scenarios.
- For multi-user support you'd need to introduce authentication, RLS policies, per-user keys, merge conflict resolution strategies, and different UX for account handling.

---

If you want, I can also:
- Deploy `server/index.js` to Vercel as a serverless function and configure environment variables,
- Validate end-to-end sync (web ↔ Android) and report back,
- Add a small UI in Settings to show sync status and allow manual "Sync now" / "Force pull" actions.

Tell me which of those you'd like me to do next.