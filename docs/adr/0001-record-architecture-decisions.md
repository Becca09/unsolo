# 1. Record Architecture Decisions

Date: 2026-08-21

## Status

Accepted

## Context

Unsolo is a multi-phase project involving many cross-cutting architectural
decisions (monorepo tooling, framework choices, provider abstractions,
domain module boundaries, etc.). Decisions and their rationale need to be
discoverable later, separate from the full narrative in
`docs/architecture-proposal.md`.

## Decision

We will use lightweight Architecture Decision Records (ADRs), stored in
`docs/adr/`, one file per decision, numbered sequentially. Each ADR
follows the format: Title, Date, Status, Context, Decision, Consequences.

## Consequences

- Every significant, hard-to-reverse architectural decision going forward
  should get its own ADR.
- `docs/architecture-proposal.md` remains the single narrative reference
  for the overall Phase A architecture; ADRs capture individual decisions
  as they are made or revisited over time.
