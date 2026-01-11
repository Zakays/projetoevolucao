Simple persistence API (Supabase)

A small, additional server endpoint is available to persist single-user project data in Supabase. It uses the Service Role key and must be run on the server.

Environment variables required:

- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (server-only)

Endpoints:

- POST /api/save JSON body { key: string, value: any } → upserts into `user_data` table
- GET /api/load?key=... → returns { value: ... }

DB schema (example):

```sql
CREATE TABLE user_data (
  id bigint generated always as identity PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value jsonb,
  updated_at timestamp
);
```

Security note: never expose the Service Role key to the browser; this API is intentionally unauthenticated for single-user usage.
