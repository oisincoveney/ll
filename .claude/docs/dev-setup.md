## Local Dev Setup

### Bypassing Auth (`BYPASS_AUTH`)

Set `BYPASS_AUTH=true` in `.env` to skip Google OAuth entirely during local development.

When active (`src/hooks.server.ts`):
- Any unauthenticated request is given a fixed dev user: `id: dev-local-user`, `email: dev@localhost`
- That user is auto-inserted into the DB on first request (`onConflictDoNothing`)
- The redirect to `/auth/signin` in `+layout.server.ts` is also suppressed

**Never set this in production.** It disables all authentication.

```env
# .env (local only)
BYPASS_AUTH=true
```
