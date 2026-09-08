# Unsolo — Authentication (Phase B)

This document describes the Supabase Auth foundation for the Unsolo MVP.

## Architecture

- **Auth provider:** Supabase Auth
- **Frontend:** Next.js App Router with `@supabase/ssr` for cookie-based sessions
- **Backend:** NestJS with a custom `AuthGuard` that verifies Supabase-issued JWTs
- **Identity model:** One Supabase Auth identity per person. Profile types
  (Traveller, Planner, Business, Host) are associated with the authenticated
  user later in the domain implementation. No duplicate auth accounts are
  created for different profile types.

## Environment variables

Copy `.env.example` to `.env.local` and fill in the Supabase values.

### Frontend (public-safe)

| Variable                            | Purpose                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`          | Supabase project URL (safe in browser)                                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`     | Supabase public anon key (safe in browser)                              |
| `NEXT_PUBLIC_SUPABASE_REDIRECT_URL` | OAuth/callback redirect URL, e.g. `http://localhost:3000/auth/callback` |
| `NEXT_PUBLIC_APP_URL`               | Used for password reset redirect URLs                                   |

### Backend (server-only)

| Variable                    | Purpose                                                                   |
| --------------------------- | ------------------------------------------------------------------------- |
| `SUPABASE_URL`              | Same Supabase project URL                                                 |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key. **Never expose to the browser.**                        |
| `SUPABASE_JWT_SECRET`       | JWT secret for local token verification. **Never expose to the browser.** |

## Security

- `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_JWT_SECRET` are only used server-side
  in `apps/api`.
- `NEXT_PUBLIC_*` variables may contain only the Supabase URL and anon key.
- The backend never trusts a client-provided user ID. It verifies the JWT and
  uses the `sub` claim as the authenticated identity.

## Local setup

1. Create a Supabase project or use the existing one.
2. In **Auth > URL Configuration**, set:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`
3. In **Auth > Providers**, enable **Email** with **Confirm email** enabled.
4. In **Auth > Providers**, enable **Google** OAuth and configure the client
   credentials in the Supabase dashboard. Do not commit credentials.
5. Copy `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
   **Settings > API** to `.env.local`.
6. Copy `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_JWT_SECRET` from
   **Settings > API** to `.env.local` for backend use only.

## Auth flows

### Email / password sign up

1. User submits email and password on `/signup`.
2. The `signUp` server action calls `supabase.auth.signUp()`.
3. Supabase sends a verification email with a link to `/auth/callback?code=...`.
4. `/auth/callback` exchanges the PKCE code server-side and a verified session
   is established.
5. The action returns a clear error if the email is already registered or the
   input is invalid.

### Email verification

- Supabase sends a confirmation email that redirects to `/auth/callback?code=...`.
- `/auth/callback` exchanges the PKCE code for a session server-side.
- Verified users are redirected to `/dashboard`.

### Email / password login

- User submits email and password on `/login`.
- The `login` server action calls `supabase.auth.signInWithPassword()`.
- Unverified users or invalid credentials return a clear error.
- Successful logins redirect to `/dashboard`.

### Google OAuth

- The `signInWithGoogle` server action starts the Supabase OAuth flow.
- Supabase redirects the user to `/auth/callback?code=...`.
- The callback route exchanges the code for a session.
- Google credentials are configured in the Supabase dashboard; no secrets are
  committed to this repository.

### Forgot / reset password

- `/forgot-password` submits an email to `supabase.auth.resetPasswordForEmail()`.
- Supabase sends an email with a link to
  `/auth/callback?type=recovery&next=/reset-password&code=...`.
- `/auth/callback` exchanges the PKCE code server-side, establishes a recovery
  session, and redirects to `/reset-password`.
- `/reset-password` validates the password and calls `supabase.auth.updateUser()`.

### Logout

- The `logout` server action calls `supabase.auth.signOut()` and redirects to
  the homepage.

## Session management

- Sessions are stored in HTTP-only cookies managed by `@supabase/ssr`.
- `apps/web/src/middleware.ts` refreshes tokens on each request and redirects
  unauthenticated users away from protected routes.
- `apps/web/src/lib/supabase/server.ts` provides a server-side client that
  reads the current request cookies.
- `apps/web/src/lib/supabase/client.ts` provides a browser client for
  client-side auth operations (e.g. `getSession`, `updateUser`).

## Protected routes

- The middleware enforces authentication for all routes except the public list.
- Public routes: `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`,
  `/auth/callback`.
- The `/dashboard` page validates the session server-side as a second layer.
- The `/auth/me` NestJS endpoint is protected by `AuthGuard` and verifies the
  Bearer token supplied by the frontend.

## Backend JWT verification

- `apps/api/src/modules/auth/application/auth.service.ts` verifies the token
  using `SUPABASE_JWT_SECRET` (for local/legacy tokens) or the project's
  public JWKS endpoint.
- `apps/api/src/modules/auth/presentation/auth.guard.ts` extracts the Bearer
  token, calls `AuthService`, and attaches the user to the request.

## Production redirect URLs

Before deploying to staging or production, update the Supabase **Auth > URL
Configuration** with the production domains and `NEXT_PUBLIC_SUPABASE_REDIRECT_URL`
accordingly:

- Staging: `https://staging.unsolo.com/auth/callback`
- Production: `https://unsolo.com/auth/callback`

## Testing

Run the API auth tests:

```bash
pnpm --filter @unsolo/api test
```

The tests cover:

- Valid JWT verification
- Expired/invalid signature rejection
- `AuthGuard` with and without a Bearer token

## Notes

- Profile type selection and business/domain tables are intentionally not
  implemented yet. This phase only establishes the auth identity.
- Fake users, mock authentication, and seed data are not used.
