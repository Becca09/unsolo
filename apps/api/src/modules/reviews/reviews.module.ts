import { Module } from "@nestjs/common";

/**
 * ReviewsModule — architectural skeleton (Phase A — Foundation).
 *
 * This module intentionally has no controllers, providers, or business
 * logic yet. Its purpose in this phase is only to establish the domain
 * boundary and layering convention that will be filled in during the
 * implementation phase for this domain:
 *
 *   presentation/    -> controllers, request/response DTOs, module-specific guards
 *   application/     -> use-cases/services (orchestration, domain rules)
 *   domain/          -> entities, value objects, state machines
 *   infrastructure/  -> Drizzle repositories, external integration adapters
 *
 * See docs/architecture-proposal.md for the full module boundary rationale.
 */
@Module({})
export class ReviewsModule {}
