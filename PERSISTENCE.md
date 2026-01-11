Single-user persistence (Supabase)

This project uses a small server to persist single-user app data in Supabase without authentication.

Server
- Entry: `server/index.js`
- Env required: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (keep this server-side)
- Start: `npm run start:server` (after `npm install`)

Database
- Table: `user_data`

Example SQL:

```sql
CREATE TABLE user_data (
  id bigint generated always as identity PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value jsonb,
  updated_at timestamp
);
```

Frontend
- Utilities: `src/lib/persistence.ts`
  - `saveData(key, value)` — saves the value on the server (falls back to localStorage)
  - `loadData(key)` — loads value from server (falls back to localStorage)

Integration
- The `LocalStorageManager` now attempts to restore data on startup by calling the backend with the key `glow-up-organizer-data`.
- On every save, `LocalStorageManager` will attempt to persist the full app state to Supabase in the background.

Notes
- No authentication is used: the backend uses a Service Role key to write to Supabase. This design assumes a single-user site where persistence is bound to the project, not to different users.
- Keep the Service Role key secure and do not expose it to client-side code.
