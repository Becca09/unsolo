import type { ButtonHTMLAttributes } from "react";

/**
 * Minimal primitive proving the design-system pipeline (tokens -> Tailwind
 * preset -> component) works end to end.
 *
 * NOTE (Phase A — Foundation): This is intentionally the only component in
 * the design system right now. Per the architecture proposal, no actual
 * product UI/screens are built in this phase.
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "neutral";
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary: "bg-unsolo-primary text-white hover:opacity-90",
    accent: "bg-unsolo-accent text-white hover:opacity-90",
    neutral: "bg-unsolo-neutral text-unsolo-primary hover:opacity-90",
  };

  return (
    <button
      className={`rounded-md px-4 py-2 text-sm font-medium transition-opacity ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
