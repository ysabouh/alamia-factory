"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SFEyebrow({ className, children, ...props }: ComponentPropsWithoutRef<"p"> & { children: ReactNode }) {
  return (
    <p
      className={cn(
        "font-industrial text-sf-label uppercase tracking-[0.22em] text-sf-muted",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

export function SFDisplay({ className, ...props }: ComponentPropsWithoutRef<"h1">) {
  return <h1 className={cn("font-industrial text-sf-display text-sf-ink", className)} {...props} />;
}

export function SFHero({ className, ...props }: ComponentPropsWithoutRef<"h2">) {
  return <h2 className={cn("font-industrial text-sf-hero text-sf-ink", className)} {...props} />;
}

export function SFHeading({ className, ...props }: ComponentPropsWithoutRef<"h3">) {
  return <h3 className={cn("font-industrial text-sf-title text-sf-ink", className)} {...props} />;
}

export function SFBody({ className, ...props }: ComponentPropsWithoutRef<"p">) {
  return <p className={cn("font-industrial text-sf-body text-sf-copy", className)} {...props} />;
}

export function SFTelemetry({ className, ...props }: ComponentPropsWithoutRef<"span">) {
  return <span className={cn("tabular-nums font-telemetry text-sf-data text-sky-100", className)} {...props} />;
}
