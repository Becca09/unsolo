# Unsolo — Environment Configuration Structure

This document describes how development, staging, and production
configuration is structured for Phase A. It does not introduce any new
environments beyond what's needed to run the toolchain locally — actual
staging/production infrastructure provisioning happens when each app is
first deployed (see `docs/architecture-proposal.md`, section K).

## Environment files

| File              | Committed? | Purpose                                                                                                                |
| ----------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `.env.example`    | Yes        | Documents every variable required, with empty/placeholder values                                                       |
| `.env.local`      | No         | Per-developer local overrides (highest precedence)                                                                     |
| `.env`            | No         | Shared local defaults (rarely used; prefer `.env.local`)                                                               |
| `.env.staging`    | No         | Reference only — actual values live in the hosting provider's env var store (Vercel/Railway), not in a checked-in file |
| `.env.production` | No         | Same as above — values live in Vercel/Railway env var stores                                                           |

`apps/api` loads environment variables via `@nestjs/config`'s
`ConfigModule.forRoot()` (see `apps/api/src/app.module.ts`), checking
`.env.local` then `.env`. `apps/web` uses Next.js's built-in `.env.local`
support.

## `NODE_ENV` vs `APP_ENV`

- `NODE_ENV`: standard Node.js flag (`development` | `production` | `test`).
  Controls framework-level behavior (React dev warnings, Next.js
  optimizations, etc.).
- `APP_ENV`: Unsolo-specific flag (`development` | `staging` | `production`)
  used for anything that needs a three-way distinction NODE_ENV can't
  express (e.g., staging runs in `NODE_ENV=production` mode but should still
  be identifiable as staging for logging/analytics).

## Environment promotion

1. **development** — local machine, `.env.local`, points at a local or
   shared dev Supabase project.
2. **staging** — Vercel Preview/Staging deployment for `apps/web`, Railway
   staging service for `apps/api`. Env vars set directly in each provider's
   dashboard. Points at a staging Supabase project (separate from
   production) so KYC/payment testing never touches real data.
3. **production** — Vercel Production deployment, Railway production
   service. Env vars set directly in each provider's dashboard, restricted
   to project owners.

## Secrets handling

- No secret ever lives in `apps/web` client-side code or `NEXT_PUBLIC_*`
  variables except values that are safe to expose publicly (e.g., Supabase
  anon key, Mapbox public token, PostHog public key).
- `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, KYC-related credentials,
  etc. only ever exist in `apps/api`'s server-side environment.
- See `.env.example` at the repo root for the full list of variables
  required per app.
