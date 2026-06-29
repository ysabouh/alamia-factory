"use client";

import { Check } from "lucide-react";

import { resolveMediaUrl } from "@/lib/api/resolve-media-url";
import type { DirectTaskAssignmentInput } from "@/lib/api/direct-tasks-client";
import { initials } from "@/features/direct-tasks/detail/direct-task-detail-utils";
import { cn } from "@/lib/utils";

function AssigneeAvatar({ name, avatarUrl }: { name?: string | null; avatarUrl?: string | null }) {
  const resolved = avatarUrl?.trim() ? resolveMediaUrl(avatarUrl) : "";
  if (resolved) {
    return (
      <img
        src={resolved}
        alt={name ?? ""}
        className="h-12 w-12 rounded-full object-cover ring-2 ring-white dark:ring-zinc-900"
      />
    );
  }
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-atlas-brand/15 text-sm font-bold text-atlas-brand ring-2 ring-white dark:ring-zinc-900">
      {initials(name)}
    </span>
  );
}

export function DirectTaskAssigneeStrip({ assignees, className }: { assignees: DirectTaskAssignmentInput[]; className?: string }) {
  if (assignees.length === 0) {
    return <p className="text-xs text-atlas-muted">لا يوجد مسؤولون</p>;
  }

  return (
    <div className={cn("flex flex-wrap gap-4", className)}>
      {assignees.map((a) => (
        <div key={a.id ?? `${a.type}-${a.assigneeId}`} className="flex w-[72px] flex-col items-center gap-1.5 text-center">
          <div className="relative">
            <AssigneeAvatar name={a.label} avatarUrl={a.avatarUrl} />
            <span
              className="absolute -bottom-0.5 -end-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white dark:border-zinc-900"
              aria-hidden
            >
              <Check className="h-2.5 w-2.5" strokeWidth={3} />
            </span>
          </div>
          <p className="w-full truncate text-[11px] font-medium leading-tight text-atlas-ink dark:text-zinc-200" title={a.label ?? undefined}>
            {a.label ?? "—"}
          </p>
        </div>
      ))}
    </div>
  );
}
