# Unsolo

Unsolo is an international travel marketplace. This repository is a
pnpm + Turborepo monorepo.

> **Status: Phase A — Foundation.** This repo currently contains
> architectural scaffolding only (monorepo tooling, app skeletons, domain
> module boundaries, shared config, and a handful of provider
> abstractions/interfaces). There is no business logic, no database
> schema, and no working end-to-end feature yet. See
> `docs/UNSOLO_MVP_PRODUCT_ARCHITECTURE_MANUSCRIPT.md` and
> `docs/architecture-proposal.md` for the full product/architecture
> context, and `docs/adr/` for specific decisions made while scaffolding.

## Structure

```
apps/
  web/          Next.js 15 (App Router) frontend, PWA-enabled
  api/          NestJS 11 backend API
database/       Drizzle ORM schema + migrations (no tables yet)
packages/
  ui/           Shared React component library
  types/        Shared TypeScript types
  validation/   Shared Zod schemas
  utils/        Shared utility functions
  config/       Shared ESLint / TypeScript / Tailwind / Prettier config
docs/
  architecture-proposal.md   Full Phase A architecture proposal
  environments.md            Environment variable / config structure
  adr/                       Architecture Decision Records
```

## Requirements

- Node.js >= 20 (developed against Node 22)
- pnpm >= 9 (`corepack enable` recommended)

## Getting started

```bash
pnpm install

# Copy and fill in environment variables
cp .env.example .env.local

# Run all apps in dev mode
pnpm dev

# Or run a single app
pnpm --filter @unsolo/web dev
pnpm --filter @unsolo/api dev
```

## Common scripts (run from repo root, via Turborepo)

```bash
pnpm lint        # ESLint across all packages/apps
pnpm typecheck   # tsc --noEmit across all packages/apps
pnpm build       # Build all packages/apps (in dependency order)
pnpm format      # Prettier write across the repo
pnpm clean       # Remove build artifacts
```

## Domain modules (`apps/api/src/modules`)

Nineteen domain module boundaries are scaffolded: `auth`, `users`,
`profiles`, `travellers`, `planners`, `businesses`, `hosts`, `trips`,
`bookings`, `payments`, `wallets`, `reviews`, `messaging`,
`notifications`, `search`, `ai`, `kyc`, `promotions`, `admin`. Each module
follows a layered convention:

```
modules/<domain>/
  presentation/     controllers, request/response DTOs
  application/      use-cases/services, provider interfaces (e.g. payments, ai)
  domain/           entities, value objects, state machines
  infrastructure/   Drizzle repositories, external integration adapters
```

Every `*.module.ts` is currently an empty `@Module({})` — no controllers,
providers, or routes exist yet. This is intentional scaffolding, not an
oversight.

## Contributing

See `docs/adr/0001-record-architecture-decisions.md` for how architectural
decisions are recorded going forward.
