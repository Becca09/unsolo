/**
 * @unsolo/validation
 *
 * Shared Zod schemas, consumed by both apps/api (request DTO validation)
 * and apps/web (form validation), so validation rules never drift between
 * frontend and backend.
 *
 * NOTE (Phase A — Foundation): No domain schemas (e.g., CreateTripSchema,
 * CreateBookingSchema) are defined yet. Those are introduced alongside their
 * corresponding backend modules in later phases.
 */

import { z } from "zod";

export const HealthCheckResponseSchema = z.object({
  status: z.literal("ok"),
  timestamp: z.string(),
});

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;
