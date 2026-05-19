"use client";

import type { ReactNode } from "react";

/** هيدر صناعي موحّد — نفس نمط سجل العاملين (ضبابية كهرمانية + عنوان بأيقونة). */
export function WfmRegistryHeader({
  kicker,
  title,
  titleIcon,
  description,
  actions
}: {
  kicker: string;
  title: ReactNode;
  titleIcon?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden rounded-sm border border-atlas-rule bg-atlas-paper p-6 shadow-atlasCard">
      <div
        className="pointer-events-none absolute -start-20 top-0 h-40 w-40 rounded-full bg-sf-accent/10 blur-3xl"
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-atlas-muted">{kicker}</p>
          <h1 className="mt-2 flex items-center gap-3 text-2xl font-bold text-atlas-ink md:text-3xl">
            {titleIcon}
            {title}
          </h1>
          {description ? <p className="mt-2 max-w-2xl text-sm text-atlas-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
