#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/apps/api/src/modules"

mod_list=(
  "auth:Auth"
  "users:Users"
  "profiles:Profiles"
  "travellers:Travellers"
  "planners:Planners"
  "businesses:Businesses"
  "hosts:Hosts"
  "trips:Trips"
  "bookings:Bookings"
  "payments:Payments"
  "wallets:Wallets"
  "reviews:Reviews"
  "messaging:Messaging"
  "notifications:Notifications"
  "search:Search"
  "ai:Ai"
  "kyc:Kyc"
  "promotions:Promotions"
  "admin:Admin"
)

for entry in "${mod_list[@]}"; do
  dir="${entry%%:*}"
  class="${entry##*:}"
  target="$BASE_DIR/$dir/$dir.module.ts"

  {
    echo 'import { Module } from "@nestjs/common";'
    echo ""
    echo "/**"
    echo " * ${class}Module — architectural skeleton (Phase A — Foundation)."
    echo " *"
    echo " * This module intentionally has no controllers, providers, or business"
    echo " * logic yet. Its purpose in this phase is only to establish the domain"
    echo " * boundary and layering convention that will be filled in during the"
    echo " * implementation phase for this domain:"
    echo " *"
    echo " *   presentation/    -> controllers, request/response DTOs, module-specific guards"
    echo " *   application/     -> use-cases/services (orchestration, domain rules)"
    echo " *   domain/          -> entities, value objects, state machines"
    echo " *   infrastructure/  -> Drizzle repositories, external integration adapters"
    echo " *"
    echo " * See docs/architecture-proposal.md for the full module boundary rationale."
    echo " */"
    echo "@Module({})"
    echo "export class ${class}Module {}"
  } > "$target"

  for layer in presentation application domain infrastructure; do
    touch "$BASE_DIR/$dir/$layer/.gitkeep"
  done

  echo "Generated: $target"
done
