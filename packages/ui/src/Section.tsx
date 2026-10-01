import type { HTMLAttributes } from "react";

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  tone?: "default" | "primary" | "neutral";
}

const toneClasses: Record<NonNullable<SectionProps["tone"]>, string> = {
  default: "bg-white",
  primary: "bg-unsolo-primary text-white",
  neutral: "bg-unsolo-neutral text-unsolo-primary",
};

export function Section({ tone = "default", className = "", ...props }: SectionProps) {
  return <section className={`py-20 ${toneClasses[tone]} ${className}`} {...props} />;
}
