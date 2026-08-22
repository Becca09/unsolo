# Unsolo — Architecture & Implementation Proposal

**Status:** DRAFT — awaiting approval. No application code has been written.
**Source of truth:** `UNSOLO_MVP_PRODUCT_ARCHITECTURE_MANUSCRIPT.md`
**Scope of this document:** Architecture and project setup only. No feature implementation, no schema creation, no payment logic, no UI screens.

---

## A. Recommended Monorepo Structure

The manuscript's proposed structure (§20) is sound and I recommend adopting it with a few additions justified below.

```text
unsolo/
├── apps/
│   ├── web/                     # Next.js (App Router) — frontend
│   └── api/                     # NestJS — backend
├── packages/
│   ├── ui/                      # Shared design-system components (Tailwind + tokens)
│   ├── types/                   # Shared TypeScript types/interfaces (domain DTOs, enums, state machines)
│   ├── validation/              # Shared Zod schemas (used by both API and web for form + input validation)
│   ├── config/                  # Shared config (eslint, tsconfig, tailwind preset, prettier)
│   └── utils/                   # Framework-agnostic pure utilities (money/currency math, date helpers, etc.)
├── database/
│   ├── schema/                  # Drizzle schema definitions, organized by domain
│   ├── migrations/               # Drizzle-generated SQL migrations
│   └── seed/                    # Dev/test-only seed scripts (explicitly isolated from prod)
├── docs/
│   ├── architecture-proposal.md # This document
│   └── adr/                     # Architecture Decision Records for future non-trivial decisions
├── scripts/                     # Repo-level automation (env checks, codegen, CI helpers)
├── .github/workflows/           # CI (lint, typecheck, build, test)
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── .env.example
├── .nvmrc
├── .eslintrc / eslint config
├── .prettierrc
└── README.md
```

**Deviations from the manuscript's literal listing, and why:**

- Added `database/seed/` explicitly — manuscript §31.18 requires seeds to be isolated from production; giving it its own directory (not mixed into `schema/`) makes that boundary structural, not just a convention.
- Added `.github/workflows/` for CI, and `docs/adr/` for recording future architectural decisions (e.g., the still-ambiguous items in section P) without bloating this proposal file repeatedly.
- `packages/ui` will hold design tokens and primitives only (see §B) — it will not contain business-specific components in this phase.

**Tooling:** pnpm workspaces + Turborepo.

- pnpm workspaces give correct dependency isolation and hoisting control between `apps/web`, `apps/api`, and shared packages.
- Turborepo gives cached, parallelized `build`/`lint`/`typecheck`/`test` pipelines across the monorepo and is the natural fit for a Next.js + Nest combination. Given the number of packages/apps, an unmanaged `pnpm -r` script set would get unwieldy quickly.

---

## B. Frontend Architecture (`apps/web`)

- **Framework:** Next.js (App Router), React, TypeScript, Tailwind CSS.
- **Rendering strategy:** Server Components by default; Client Components only where interactivity is required (forms, realtime, maps). This keeps secrets and sensitive data-fetching server-side per manuscript §22/§8 in the requirements.
- **API access:** The web app never talks to Supabase directly for financial or authorization-sensitive data. All such reads/writes go through the NestJS API. Supabase client (browser) is limited to: Auth session handling, Supabase Realtime subscriptions (messaging/notifications), and Storage upload flows that are pre-authorized by the API (signed URLs).
- **Design system foundation (this phase only):**
  - `packages/ui` will define Tailwind theme tokens (`packages/config` tailwind preset) using the brand colors:
    - Primary `#1F2F10`
    - Accent `#6D8D08`
    - Neutral `#E4E9DD`
  - No actual product UI/screens will be built now — only the token/preset scaffolding and a minimal primitive (e.g., button/theme provider) to prove the pipeline works, since the manuscript explicitly says "do not build the actual UI yet."
- **PWA:** `apps/web` will be configured for PWA capability from the start (manifest, icons, service worker registration) since the manuscript and your instructions both require this from day one — this is configuration, not feature UI.
- **State/data layer:** Server Components + a thin typed API client (generated from shared `packages/types`/`packages/validation`) rather than ad hoc `fetch` calls scattered through components.

---

## C. NestJS Backend Architecture (`apps/api`)

Modular, domain-oriented, layered within each module. This phase establishes the **architecture skeleton** (module boundaries, shared infrastructure, interfaces) — not full business logic for every module, per your explicit instruction not to create decorative empty modules.

**Layering per domain module:**

```
modules/<domain>/
├── <domain>.module.ts
├── presentation/        # Controllers, DTOs (request/response), guards specific to the module
├── application/          # Use-cases/services — orchestration, domain rules
├── domain/               # Entities/value-objects/state machines specific to the domain (framework-agnostic where possible)
└── infrastructure/       # Drizzle repositories, external integration adapters used by this domain
```

This gives the four boundaries you required explicitly:

- **Presentation/API** → `presentation/`
- **Application/domain logic** → `application/` + `domain/`
- **Database access** → `infrastructure/*.repository.ts` (Drizzle only, never raw Supabase client queries for app data)
- **External integrations** → `infrastructure/*.adapter.ts` (Stripe, local payment provider, Mapbox, Resend, etc.), always behind an interface defined in `application/`.

**Cross-cutting/shared backend structure:**

```
apps/api/src/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── payments/          # includes payment abstraction, ledger — see §F
│   ├── ... (other domain modules, added incrementally per implementation phase)
├── common/
│   ├── guards/            # AuthGuard, RolesGuard, RateLimitGuard
│   ├── interceptors/      # logging, response shaping, audit hooks
│   ├── filters/           # exception filters
│   ├── decorators/        # @CurrentUser, @Roles, etc.
│   └── pipes/             # Zod-based validation pipe (shared schemas from packages/validation)
├── infra/
│   ├── database/          # Drizzle client/connection, transaction helper
│   ├── supabase/          # Supabase admin client (server-only), storage helper
│   ├── inngest/            # Inngest client + function registry
│   └── integrations/       # Stripe/local-provider/Mapbox/Resend/PostHog/AI clients
└── main.ts
```

**Which modules get built now vs. later:** Per your instruction, in this phase I will only scaffold the **module folder structure and NestJS module wiring skeleton** (empty but structurally correct: module class, placeholder controller/service files with TODOs referencing the phase in which they're implemented) for the modules explicitly named in the manuscript (§20/§C list). No business logic, no endpoints beyond perhaps a health check. I will confirm this scope with you before scaffolding, since even skeleton generation is implementation — see the question at the end of this document.

**Financial logic isolation (requirement #4):** All money-related computation (fees, commissions, ledger entries, wallet balances) lives exclusively inside `modules/payments`, `modules/wallets`, and a shared `packages/utils` money/currency primitive (e.g., integer-cents arithmetic, no floats). Controllers and frontend never compute financial values — they only display values returned by the API.

---

## D. Database Architecture

- **Engine:** PostgreSQL via Supabase.
- **ORM:** Drizzle ORM — schema-as-code in `database/schema/`, split by domain (e.g., `users.ts`, `trips.ts`, `payments.ts`, `wallets.ts`, `kyc.ts`, `admin.ts`), composed into a single schema export for migrations.
- **Migrations:** Drizzle Kit generates SQL migrations into `database/migrations/`; migrations are checked into git and run explicitly (never auto-sync in production).
- **Access pattern:** All application reads/writes to Postgres go through Drizzle repositories inside NestJS `infrastructure/` layers. Supabase's client SDK is used only for Auth/Realtime/Storage, never for arbitrary table CRUD — this satisfies requirement #6 (no uncontrolled direct Supabase DB calls).
- **RLS:** Supabase Row-Level-Security will be enabled as a **defense-in-depth** layer on tables, especially for anything reachable by client SDKs (Realtime channels, Storage-adjacent tables), even though the primary authorization boundary is the NestJS API. RLS policies are designed after the schema is approved — not guessed now.
- **Entity list:** The manuscript's §21 entity list is comprehensive and will be used as the baseline when schema design begins (a later phase, per your explicit instruction not to design the schema yet).

---

## E. Authentication / Authorization Architecture

- **Authentication:** Supabase Auth handles identity — email/password, OAuth, password reset. The Next.js app and NestJS API both verify Supabase-issued JWTs (API validates via Supabase's JWKS/secret, not by trusting client-provided user IDs).
- **Multi-profile-per-identity:** One Supabase Auth identity (one email) can be linked to multiple Unsolo profile types (Traveller/Planner/Business/Host) — manuscript §18 and integrity rule #15. This means:
  - `users` table keyed by Supabase `auth.uid()`.
  - Separate `*_profiles` tables (traveller/planner/business/host) reference `users.id`, not separate auth identities.
- **Authorization:** Roles/permissions are **application domain concepts**, not Supabase Auth concepts. A `modules/auth` (or `modules/authorization`) service resolves a user's roles/permissions from the database (including admin custom roles + maker/checker per §17) and NestJS `RolesGuard`/`PermissionsGuard` enforce access on every endpoint. The frontend only reflects state (hides buttons) — it is never a security boundary (requirement #2 / integrity rule #2).

---

## F. Payment Architecture

- **Abstraction:** A `PaymentProvider` interface (in `modules/payments/application/`) defines the contract (create charge, capture, refund, payout, webhook verification). Two adapters implement it: `StripeProviderAdapter` and `LocalProviderAdapter` (Nigerian provider — exact provider TBD, see §P). Provider selection is routed by currency/region, not hardcoded in business logic.
- **Ledger-first design:** Per manuscript §4, every financial event (payment, fee, commission, refund, payout, wallet transaction, withdrawal, adjustment, reserve/hold) is written to an append-only `ledger_entries`-style table. Balances are always derived/reconciled from the ledger, never mutated directly.
- **Held funds & service flow:** The service booking flow (request → accept → pay → hold → render → confirm/24h-auto-release → payout minus 5%) will be modeled as an explicit state machine inside `modules/bookings`/`modules/payments`, with the 24-hour auto-release implemented as a scheduled background job (Inngest), not a client timer — satisfying integrity rule #7.
- **Webhooks:** Stripe/local-provider webhooks land in dedicated controller endpoints that verify signatures, are idempotent (dedupe by provider event ID), and never let client-reported payment state affect the ledger (requirement #8, manuscript §22).
- **No implementation yet:** Per your instructions, this phase does not implement any payment logic — only the module boundary and interface shape will exist as a placeholder once scaffolding is approved.

---

## G. Background Job Architecture

- **Provider:** Inngest, wired through `infra/inngest/` in the API app, with function definitions colocated with the domain module that owns them (e.g., `modules/bookings/infrastructure/jobs/service-auto-release.job.ts`) but registered centrally.
- **Known jobs (from manuscript):** trip reminders, 24-hour service auto-confirmation/release, payout release, promotion expiry, listing expiry, scheduled notifications.
- **Principle:** Anything financial, time-sensitive, or notification-critical must be a durable server-side job, never a browser timer (integrity rule #7).

---

## H. File / Storage Architecture

- **Provider:** Supabase Storage.
- **Buckets (planned, not created yet):** separate public bucket(s) for listing/trip images (business/host/planner/trip galleries) and a **private** bucket for KYC documents and message attachments requiring access control.
- **Access pattern:** Public images can be fetched via public URLs/CDN. Private/KYC files are only accessible via short-lived signed URLs issued by the NestJS API after an authorization check — never public, per manuscript §11/§22 and requirement #9 (secrets/sensitive access never exposed directly).
- **Uploads:** Client requests a signed upload URL from the API (which checks authorization + file constraints), uploads directly to Supabase Storage, then confirms with the API to persist metadata — keeping large binary transfer off the NestJS server while keeping authorization server-side.

---

## I. Messaging / Realtime Architecture

- **Realtime transport:** Supabase Realtime for V1 (per manuscript §13), subscribed to from the Next.js client for conversation/message updates and notification delivery.
- **Authoritative writes:** Message sends, conversation creation, and state transitions (SENDING→SENT→DELIVERED→READ) are written through the NestJS API (or a Postgres function invoked by it), not directly by the client, so that business rules apply (e.g., only approved trip members can enter trip group conversations; no empty conversations in history — integrity rule #14).
- **Rate limiting/anti-spam:** Enforced server-side in `modules/messaging` via a rate-limit guard, per manuscript §13/§22.

---

## J. AI Architecture

- **Abstraction:** An `AiProvider` interface in `modules/ai/application/` isolates the actual model vendor (exact provider TBD — see §P), so it can be swapped without touching callers.
- **Tool-based, not free-form:** AI only accesses transactional truth through **controlled tools** (`searchTrips`, `getTrip`, `checkAvailability`, `estimateTripCost`, etc., per manuscript §16), implemented as thin read-only service calls into the relevant domain modules. AI never writes directly to bookings/payments/wallets — those actions remain fully human/API-driven, per the explicit "AI cannot autonomously..." list.
- **No implementation yet:** This phase only reserves the module boundary; no AI provider will be wired up now.

---

## K. Security Architecture

- **Server-side enforcement everywhere:** All authorization, financial computation, and state-machine transitions happen in NestJS; the frontend only renders results (requirement #1/#8, integrity rule #2/#3/#4).
- **Input validation:** Shared Zod schemas in `packages/validation`, used both for NestJS request DTOs (via a validation pipe) and for React Hook Form (or equivalent) on the frontend — one schema, two consumers, no drift.
- **Secrets:** `SUPABASE_SERVICE_ROLE_KEY`, Stripe secret key, local payment provider secret, Inngest signing key, Resend key, AI provider key, etc. exist only in `apps/api` server environment — never in `NEXT_PUBLIC_*` variables or shipped to the browser (requirement #9).
- **Rate limiting:** Applied at the NestJS level (guard/middleware, e.g., via `@nestjs/throttler`) to auth, password reset, messaging, search, AI, and financial endpoints (manuscript §22).
- **RLS as defense-in-depth:** See §D.
- **Audit logging:** A cross-cutting audit mechanism (likely an interceptor + `audit_logs` table) captures actor/action/target/before/after/timestamp for admin and financial actions (manuscript §17/§22).

---

## L. Environment / Deployment Architecture

- **Environments:** development, staging, production — each with its own Supabase project (or schema) and provider credentials, matching manuscript §24.
- **Config:** `.env.example` at repo root enumerates all variable names/placeholders (no secrets), covering the list in manuscript §24 plus any additions needed for Nest-specific config (e.g., `PORT`, `JWT_AUDIENCE`, `CORS_ORIGIN`, `NODE_ENV`).
- **Hosting (proposal, to confirm with you):** Next.js app suited to Vercel; NestJS API suited to a Node-friendly host (Railway/Render/Fly.io) or containerized deployment. This is a suggestion, not a locked decision — flagged for your input in §P.
- **CI:** GitHub Actions workflow running `pnpm install`, `turbo lint`, `turbo typecheck`, `turbo build` (and `turbo test` once tests exist) on PRs — no deployment automation yet.

---

## M. Third-Party Integrations Summary

| Concern                | Provider                    | Integration point                                                            |
| ---------------------- | --------------------------- | ---------------------------------------------------------------------------- |
| Auth                   | Supabase Auth               | `apps/web` (session), `apps/api` (JWT verification)                          |
| DB                     | Supabase Postgres + Drizzle | `database/`, `apps/api/src/infra/database`                                   |
| Realtime               | Supabase Realtime           | `apps/web` subscriptions, writes via API                                     |
| Storage                | Supabase Storage            | `apps/api/src/infra/supabase`, signed URLs                                   |
| International payments | Stripe                      | `modules/payments` adapter                                                   |
| Local payments         | Nigerian provider (TBD)     | `modules/payments` adapter                                                   |
| Background jobs        | Inngest                     | `apps/api/src/infra/inngest`                                                 |
| Maps/geocoding         | Mapbox                      | `apps/web` (maps UI, later), `apps/api` (server-side geocoding where needed) |
| Transactional email    | Resend                      | `apps/api/src/infra/integrations`                                            |
| Analytics              | PostHog                     | `apps/web` (client events), possibly server events from API                  |
| AI                     | Abstracted provider (TBD)   | `modules/ai`                                                                 |

---

## N. Development Phases (adopting manuscript §29, unchanged)

Phase A (Foundation) is the only phase in scope right now. Phases B–L follow only after this proposal is approved and, per the manuscript, after schema/architecture review at the relevant checkpoints.

---

## O. Risks & Architectural Concerns

1. **Financial correctness is the highest-risk area.** Ledger design, wallet approvals, and the 24-hour auto-release must be designed carefully with concurrency/idempotency in mind before any implementation — rushing this risks double-payouts or unauditable balances.
2. **Dual payment-provider abstraction complexity.** Stripe and a Nigerian provider have different capabilities (holds/captures, payout timing, webhook semantics). The abstraction must not leak provider-specific assumptions into domain logic; this needs a dedicated design pass once the provider is chosen (see §P).
3. **Supabase RLS vs. NestJS authorization overlap.** Maintaining two authorization layers (RLS + API) risks drift if not documented as ADRs; RLS policies must be treated as a safety net, not primary logic, and kept in sync intentionally.
4. **Realtime + authoritative writes.** Supabase Realtime is convenient but the temptation to let clients write directly to `messages`/`conversations` tables must be resisted structurally (e.g., via RLS deny + write-only-through-API) to preserve integrity rule #14 and moderation/audit requirements.
5. **DIY wallet unanimous-approval rule** could deadlock (a single non-responsive member blocks withdrawal indefinitely). Not solved now — flagged for product decision.
6. **Monorepo build performance** as `apps/api` and `apps/web` grow — mitigated by Turborepo caching, but worth monitoring.
7. **Country/state/city dataset completeness** (§7) is a data-sourcing task, not just architecture — needs a decision on data source/licensing before Phase D.

---

## P. Product Decisions That Must NOT Be Guessed (from manuscript §30, carried forward + confirmed still open)

These remain unresolved and I will not guess at them during architecture or later implementation:

1. Exact 50% planner cancellation fee calculation (base amount, timing, what it's a percentage of).
2. Exact planner payout timing (immediately, on trip completion, after a hold period?).
3. Exact accommodation/host payout timing.
4. Reserve/negative-balance treatment after payout followed by a later refund.
5. Exact refund percentages per booking type (service vs. accommodation vs. trip).
6. Exact trip reminder schedule (e.g., 7 days / 24 hours before?).
7. Exact SMS provider, if/when SMS is justified.
8. **Exact Nigerian payment provider** (Paystack vs. Flutterwave vs. other) — needed before `LocalProviderAdapter` can be implemented.
9. **Exact AI model provider** (OpenAI, Anthropic, etc.) — needed before `modules/ai` implementation.
10. Exact property (accommodation) cancellation policy.
11. Exact host check-in/check-out rules.
12. Tax/fee treatment per supported jurisdiction.
13. Legal/compliance requirements for holding and disbursing customer funds internationally (money-transmission licensing implications).

**Additional clarification needed for the setup phase specifically:** 14. Preferred hosting targets for `apps/web` and `apps/api` (affects env var shape and CI, not core architecture) — Vercel + Railway/Render/Fly.io suggested but not assumed. 15. Whether you want the NestJS domain modules scaffolded as empty-but-structured skeletons now (folder + module wiring + health endpoint only, no business logic), or whether "architecture and project setup" should stop at repo/tooling scaffolding (packages, configs, CI, `.env.example`) with zero `apps/api`/`apps/web` module folders until Phase B begins. This affects how much I build in the next step.

---

## Summary of What Happens Next (only after your approval)

If approved, the **next** step (still setup, not features) would be:

1. Initialize pnpm workspace + Turborepo config, root `package.json`, shared configs (`packages/config`), linting/formatting/type-checking.
2. Scaffold `apps/web` (Next.js + TS + Tailwind + PWA config, design tokens wired from `packages/ui`) with a placeholder home page only.
3. Scaffold `apps/api` (NestJS + TS) with health-check endpoint, common infrastructure (guards/pipes/filters), and either empty module skeletons or bare module directory placeholders depending on your answer to point 15 above.
4. Configure `database/` with Drizzle setup (no schema tables yet, just the toolchain wired to a Supabase connection string placeholder).
5. Add `.env.example`, GitHub Actions CI workflow, README.

I will not proceed with any of this until you approve this proposal and answer the open questions in §P (14–15 at minimum; 1–13 can remain open until their respective implementation phases, but should be tracked in `docs/adr/` or a decisions log).
