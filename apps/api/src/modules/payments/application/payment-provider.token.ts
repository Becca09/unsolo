/**
 * DI token for injecting a PaymentProvider implementation.
 *
 * NOTE (Phase A — Foundation): No provider is bound to this token yet.
 * Binding (e.g., StripeProviderAdapter, and later a Nigerian provider
 * adapter selected per currency/region) happens in a later implementation
 * phase.
 */
export const PAYMENT_PROVIDER = Symbol("PAYMENT_PROVIDER");
