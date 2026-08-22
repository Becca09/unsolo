/**
 * PaymentProvider — architectural abstraction only (Phase A — Foundation).
 *
 * This interface defines the contract that any payment provider adapter
 * (e.g., Stripe for international payments, a Nigerian provider to be
 * selected later — see docs/architecture-proposal.md section P) must
 * implement. It intentionally contains NO implementation.
 *
 * Concrete adapters (e.g., StripeProviderAdapter) belong in
 * infrastructure/ and will be built in a later phase once the ledger,
 * fee, and payout rules referenced in the manuscript are confirmed.
 *
 * Do not add business logic (fee calculation, commission, refund
 * percentages, payout timing) to this interface or its implementations —
 * those are domain rules owned by the application layer, not the
 * provider adapter.
 */
export interface PaymentProviderChargeRequest {
  amountMinorUnits: number;
  currency: string;
  idempotencyKey: string;
  metadata?: Record<string, string>;
}

export interface PaymentProviderChargeResult {
  providerReference: string;
  status: "pending" | "succeeded" | "failed";
}

export interface PaymentProviderRefundRequest {
  providerReference: string;
  amountMinorUnits: number;
  idempotencyKey: string;
}

export interface PaymentProviderPayoutRequest {
  recipientReference: string;
  amountMinorUnits: number;
  currency: string;
  idempotencyKey: string;
}

export interface PaymentProviderWebhookEvent {
  providerEventId: string;
  type: string;
  payload: unknown;
}

export interface PaymentProvider {
  readonly name: string;

  createCharge(request: PaymentProviderChargeRequest): Promise<PaymentProviderChargeResult>;
  captureCharge(providerReference: string): Promise<PaymentProviderChargeResult>;
  refund(request: PaymentProviderRefundRequest): Promise<void>;
  payout(request: PaymentProviderPayoutRequest): Promise<void>;
  verifyWebhookSignature(rawBody: Buffer, signatureHeader: string): PaymentProviderWebhookEvent;
}
