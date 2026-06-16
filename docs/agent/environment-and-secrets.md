# Environment And Secrets

Use these rules when handling runtime configuration, API keys, and Supabase access.

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client components.
- Server-only Supabase writes must go through `src/lib/supabase.ts`.
- Public write/check APIs may be protected with `APP_SECRET`; clients can send `Authorization: Bearer <secret>` or `x-app-secret`.
- Keep `.env.local` untracked.
