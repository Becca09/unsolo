"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { BusinessDraft, PayoutErrors, PayoutField } from "./types";
import { validatePayout } from "./types";
import { FieldError, inputCls, labelCls, StepHeading, StepNav } from "./ui";

interface Props {
  draft: BusinessDraft;
  onChange: (patch: Partial<BusinessDraft>) => void;
  /** Server-side rejection surfaced when a resubmission fails. */
  serverError?: string;
  onBack: () => void;
  onContinue: () => void;
}

interface BankOption {
  name: string;
  code: string;
}

/**
 * Step 3 — Payout setup. When a payout provider is configured (Paystack),
 * the bank list is live and "Verify account" resolves the account number
 * to the bank-confirmed account name, which the user confirms before
 * continuing. Without a provider, the step degrades to manual entry — the
 * backend stores it through the same resolver seam.
 */
export default function PayoutStep({ draft, onChange, serverError, onBack, onContinue }: Props) {
  const [errors, setErrors] = useState<PayoutErrors>({});
  const [banks, setBanks] = useState<BankOption[] | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const p = draft.payout;

  useEffect(() => {
    apiFetch<BankOption[]>("/payouts/banks")
      .then(setBanks)
      .catch(() => setBanks(null));
  }, []);

  function setField(field: PayoutField | "bankCode" | "resolved", value: string | boolean) {
    if (errors[field as PayoutField]) setErrors((e) => ({ ...e, [field]: undefined }));
    onChange({ payout: { ...p, [field]: value } });
  }

  function setBank(code: string) {
    const bank = banks?.find((b) => b.code === code);
    onChange({
      payout: {
        ...p,
        bankName: bank?.name ?? "",
        bankCode: code,
        accountName: "",
        resolved: false,
      },
    });
    setResolveError(null);
  }

  async function resolveAccount() {
    setResolving(true);
    setResolveError(null);
    try {
      const { accountName } = await apiFetch<{ accountName: string }>("/payouts/resolve", {
        method: "POST",
        body: JSON.stringify({ bankCode: p.bankCode, accountNumber: p.accountNumber.trim() }),
      });
      onChange({ payout: { ...p, accountName, resolved: true } });
    } catch (err) {
      setResolveError(
        err instanceof Error ? err.message : "Could not verify this account. Check the details.",
      );
    } finally {
      setResolving(false);
    }
  }

  function continueStep() {
    const next = validatePayout(draft);
    setErrors(next);
    if (Object.keys(next).length === 0) onContinue();
  }

  const canResolve = !!banks && !!p.bankCode && p.accountNumber.trim().length === 10 && !resolving;

  return (
    <div>
      <StepHeading title="Set up your payouts">
        Add where you&apos;d like your Unsolo earnings to be paid.
      </StepHeading>

      <div className="mt-8 space-y-5">
        <div>
          <label htmlFor="payout-bank" className={labelCls}>
            Bank name
          </label>
          {banks ? (
            <select
              id="payout-bank"
              value={p.bankCode}
              onChange={(e) => setBank(e.target.value)}
              className={inputCls}
            >
              <option value="">Select your bank</option>
              {banks.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="payout-bank"
              value={p.bankName}
              onChange={(e) => setField("bankName", e.target.value)}
              maxLength={120}
              placeholder="e.g. GTBank"
              autoComplete="off"
              className={inputCls}
            />
          )}
          <FieldError message={errors.bankName} />
        </div>

        <div>
          <label htmlFor="payout-number" className={labelCls}>
            Account number
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="payout-number"
              inputMode="numeric"
              value={p.accountNumber}
              onChange={(e) =>
                onChange({
                  payout: {
                    ...p,
                    accountNumber: e.target.value.replace(/\D/g, ""),
                    accountName: "",
                    resolved: false,
                  },
                })
              }
              maxLength={10}
              placeholder="10-digit NUBAN number"
              autoComplete="off"
              className={`${inputCls} mt-0 flex-1`}
            />
            {banks && (
              <button
                type="button"
                onClick={resolveAccount}
                disabled={!canResolve}
                className="border-unsolo-border text-unsolo-primary hover:bg-unsolo-subtle shrink-0 rounded-xl border px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50"
              >
                {resolving ? "Verifying..." : "Verify account"}
              </button>
            )}
          </div>
          <FieldError message={errors.accountNumber} />
          {resolveError && (
            <p className="mt-1 text-xs text-red-600" role="alert">
              {resolveError}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="payout-name" className={labelCls}>
            Account name
          </label>
          {p.resolved ? (
            <div className="border-unsolo-accent bg-unsolo-subtle mt-1 flex items-center gap-2 rounded-xl border px-4 py-3">
              <span className="text-unsolo-accent">✓</span>
              <span className="text-unsolo-primary text-sm font-medium">{p.accountName}</span>
            </div>
          ) : (
            <input
              id="payout-name"
              value={p.accountName}
              onChange={(e) => setField("accountName", e.target.value)}
              maxLength={120}
              placeholder={
                banks ? "Verify the account number to fill this in" : "Name on the bank account"
              }
              autoComplete="off"
              className={inputCls}
            />
          )}
          <FieldError message={errors.accountName} />
        </div>

        <p className="text-unsolo-muted text-xs leading-relaxed">
          Your account number is stored securely and is never shown in full — only the last 4 digits
          are displayed after saving.
          {banks
            ? " The account name is confirmed by your bank before saving."
            : " Instant account-name verification is not configured yet — make sure the name matches your bank records."}
        </p>
      </div>

      {serverError && (
        <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
          {serverError}
        </p>
      )}

      <StepNav onBack={onBack} onContinue={continueStep} />
    </div>
  );
}
