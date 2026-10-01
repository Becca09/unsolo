import type { HTMLAttributes } from "react";

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const sizeClasses: Record<NonNullable<ContainerProps["size"]>, string> = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
};

export function Container({ size = "lg", className = "", ...props }: ContainerProps) {
  return <div className={`mx-auto w-full px-6 ${sizeClasses[size]} ${className}`} {...props} />;
}
