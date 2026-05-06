"use client";

import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary";

function getVariantClasses(variant: ButtonVariant): string {
  if (variant === "secondary") {
    return "border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50";
  }
  return "bg-zinc-950 text-white hover:bg-zinc-800";
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  return (
    <button
      {...props}
      className={[
        "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        getVariantClasses(variant),
        className,
      ].join(" ")}
    />
  );
}

