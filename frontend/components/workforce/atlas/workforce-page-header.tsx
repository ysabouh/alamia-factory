"use client";

import type { ReactNode } from "react";

export function WfmPageHeader({
  kicker,
  title,
  description,
  icon,
  actions
}: {
  kicker: string;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden rounded-sm border border-atlas-rule bg-atlas-paper shadow-atlasCard">
      <HeaderAccentBar />
      <HeaderInner kicker={kicker} title={title} description={description} icon={icon} actions={actions} />
    </header>
  );
}

function HeaderAccentBar() {
  return (
    <div
      className="absolute inset-y-0 start-0 w-1.5 bg-gradient-to-b from-atlas-brand via-atlas-brand/70 to-atlas-accent"
      aria-hidden
    />
  );
}

function HeaderInner({
  kicker,
  title,
  description,
  icon,
  actions
}: {
  kicker: string;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="relative flex flex-col gap-4 px-5 py-6 ps-8 md:flex-row md:items-end md:justify-between md:px-8 md:py-7">
      <div className="max-w-2xl space-y-2">
        <p className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-atlas-muted">
          {icon}
          {kicker}
        </p>
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-atlas-ink md:text-[1.75rem]">{title}</h1>
        {description ? <p className="text-sm leading-relaxed text-atlas-slate">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
