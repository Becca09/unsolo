# 2. Phase A Foundation Stack

Date: 2026-08-21

## Status

Accepted

## Context

`docs/architecture-proposal.md` was reviewed and approved. Phase A required
selecting concrete tooling and package boundaries to scaffold the monorepo.

## Decision

- Monorepo: pnpm workspaces + Turborepo.
- Frontend (`apps/web`): Next.js (App Router), React 19, TypeScript,
  Tailwind CSS, PWA via `@serwist/next` (not `next-pwa`, due to poor
  Next.js 15 App Router compatibility).
- Backend (`apps/api`): NestJS 11, Node.js, TypeScript.
- Database: PostgreSQL via Supabase, Drizzle ORM + Drizzle Kit
  (`database/` package) — no application tables yet.
- Auth: Supabase Auth (not implemented yet; one auth identity can map to
  multiple Unsolo profile types per user decision).
- Shared packages: `@unsolo/ui`, `@unsolo/types`, `@unsolo/validation`
  (Zod), `@unsolo/config` (shared TS/ESLint/Tailwind/Prettier config),
  `@unsolo/utils`.
- Payments: `PaymentProvider` interface only
  (`apps/api/src/modules/payments/application/payment-provider.interface.ts`).
  Stripe will be the first concrete adapter; a Nigerian provider will be
  added behind the same interface once selected. No implementation yet.
- AI: `AiProvider` interface only
  (`apps/api/src/modules/ai/application/ai-provider.interface.ts`). No
  provider connected yet.
- Background jobs: Inngest (not wired yet — placeholder folder only).
- Maps: Mapbox. Email: Resend. Analytics: PostHog. Realtime + Storage:
  Supabase Realtime / Supabase Storage. None of these are connected yet;
  only environment variable placeholders exist in `.env.example`.
- Deployment targets: Vercel (`apps/web`), Railway (`apps/api`).
- Domain module boundaries scaffolded in `apps/api/src/modules/*` for all
  19 domains listed in the Phase A instructions, each with
  `presentation/application/domain/infrastructure` sub-folders and an
  empty `@Module({})` class — no controllers, providers, or business logic.

## Consequences

- Shared packages (`@unsolo/types`, `@unsolo/validation`, `@unsolo/utils`,
  `@unsolo/ui`, `@unsolo/database`) compile to `dist/` via `tsc` (CommonJS)
  so that `apps/api` (which runs compiled Node.js output, not a bundler)
  can `require()` them at runtime. `apps/web` also consumes the compiled
  output but additionally lists them in `transpilePackages` for source-map
  friendliness during development.
- No business logic, fake endpoints, or fake data were added anywhere in
  Phase A. Any interface (e.g., `PaymentProvider`, `AiProvider`) contains
  only method signatures, no implementations.
