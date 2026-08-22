/**
 * AiProvider — architectural abstraction only (Phase A — Foundation).
 *
 * Isolates the actual AI model vendor (not yet selected — see
 * docs/architecture-proposal.md section P) behind a stable interface so it
 * can be swapped without touching callers.
 *
 * Per the manuscript, AI only accesses transactional truth through
 * controlled, read-only tools (e.g., searchTrips, getTrip,
 * checkAvailability, estimateTripCost). AI must never write directly to
 * bookings/payments/wallets. Tool implementations belong in this module's
 * application layer once the provider is selected and the tool contracts
 * are defined — none exist yet.
 *
 * No provider is connected in this phase.
 */
export interface AiToolDefinition {
  name: string;
  description: string;
  parametersSchema: unknown;
}

export interface AiMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
}

export interface AiCompletionRequest {
  messages: AiMessage[];
  tools?: AiToolDefinition[];
}

export interface AiCompletionResult {
  message: AiMessage;
  toolCalls?: Array<{ name: string; arguments: unknown }>;
}

export interface AiProvider {
  readonly name: string;

  complete(request: AiCompletionRequest): Promise<AiCompletionResult>;
}
