"use client";

import {
  Check,
  CheckCircle2,
  Circle,
  CircleDot,
  Clock,
  MessageSquare,
  Paperclip,
  User
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { EnrichedTimelineEntry } from "@/features/workflow/instances/workflow-instance-stage-utils";
import { formatDateTime, formatRelativeTime } from "@/features/workflow/instances/workflow-instance-stage-utils";

const ACTION_STYLE: Record<string, { dot: string; bg: string }> = {
  created: { dot: "bg-emerald-500", bg: "bg-emerald-50/80 dark:bg-emerald-950/30" },
  assigned: { dot: "bg-blue-500", bg: "bg-blue-50/80 dark:bg-blue-950/30" },
  accepted: { dot: "bg-sky-500", bg: "bg-sky-50/80 dark:bg-sky-950/30" },
  started: { dot: "bg-indigo-500", bg: "bg-indigo-50/80 dark:bg-indigo-950/30" },
  updated: { dot: "bg-violet-500", bg: "bg-violet-50/80 dark:bg-violet-950/30" },
  stage_advanced: { dot: "bg-atlas-brand", bg: "bg-atlas-canvas/80 dark:bg-zinc-800/50" },
  completed: { dot: "bg-emerald-600", bg: "bg-emerald-50/80 dark:bg-emerald-950/30" },
  approved: { dot: "bg-teal-500", bg: "bg-teal-50/80 dark:bg-teal-950/30" },
  rejected: { dot: "bg-red-500", bg: "bg-red-50/80 dark:bg-red-950/30" },
  returned: { dot: "bg-orange-500", bg: "bg-orange-50/80 dark:bg-orange-950/30" },
  clarification_requested: { dot: "bg-amber-500", bg: "bg-amber-50/80 dark:bg-amber-950/30" },
  overdue: { dot: "bg-red-600", bg: "bg-red-50/80 dark:bg-red-950/30" },
  cancelled: { dot: "bg-zinc-500", bg: "bg-zinc-100/80 dark:bg-zinc-800/50" }
};

type Props = {
  event: EnrichedTimelineEntry;
  compact?: boolean;
};

export function WorkflowTimelineEventCard({ event, compact = false }: Props) {
  const style = ACTION_STYLE[event.action] ?? { dot: "bg-atlas-brand", bg: "bg-atlas-canvas/60 dark:bg-zinc-800/40" };
  const when = formatDateTime(event.createdAt);
  const relative = formatRelativeTime(event.createdAt);

  return (
    <li className={`flex gap-3 rounded-lg px-3 py-2.5 ${style.bg}`}>
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p className="text-xs font-bold text-atlas-ink">{event.actionLabel}</p>
          {relative ? (
            <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] font-medium text-atlas-muted dark:bg-zinc-900/50">
              {relative}
            </span>
          ) : null}
        </div>

        {!compact && event.notes ? (
          <p className="mt-1 text-[11px] leading-relaxed text-atlas-slate">{event.notes}</p>
        ) : null}

        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-atlas-muted">
          {event.actor?.name ? (
            <span className="inline-flex items-center gap-1">
              <User className="h-3 w-3" />
              {event.actor.name}
            </span>
          ) : null}
          {event.taskNumber ? <span>مهمة: {event.taskNumber}</span> : null}
          {event.stageName ? <span>مرحلة: {event.stageName}</span> : null}
          {when ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {when}
            </span>
          ) : null}
        </div>

        {compact && event.notes ? (
          <p className="mt-1 line-clamp-2 text-[10px] text-atlas-muted">{event.notes}</p>
        ) : null}
      </div>
    </li>
  );
}

type ChecklistProps = {
  items: { id: string; label: string; isRequired: boolean; isCompleted: boolean; taskNumber?: string }[];
};

export function WorkflowChecklistSummary({ items }: ChecklistProps) {
  if (items.length === 0) return null;

  const done = items.filter((i) => i.isCompleted).length;

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-atlas-muted">
          <CheckCircle2 className="h-3.5 w-3.5" /> قائمة التحقق
        </h4>
        <span className="text-xs font-semibold text-atlas-muted">
          {done}/{items.length}
        </span>
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-atlas-border dark:bg-zinc-700">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${Math.round((done / items.length) * 100)}%` }}
        />
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item.id}
            className={`flex items-start gap-2 rounded-md border px-2.5 py-2 text-xs ${
              item.isCompleted
                ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20"
                : "border-atlas-border bg-white dark:border-zinc-700 dark:bg-zinc-900/40"
            }`}
          >
            <span
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                item.isCompleted
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-atlas-border bg-white dark:border-zinc-600 dark:bg-zinc-800"
              }`}
            >
              {item.isCompleted ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`leading-snug ${item.isCompleted ? "text-emerald-900 dark:text-emerald-100" : "text-atlas-ink"}`}>
                {item.label}
              </p>
              <div className="mt-0.5 flex flex-wrap gap-1.5">
                {item.isRequired ? (
                  <Badge variant="outline" className="h-4 px-1.5 text-[9px]">
                    إلزامي
                  </Badge>
                ) : null}
                {item.taskNumber ? (
                  <span className="text-[10px] text-atlas-muted">{item.taskNumber}</span>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

type CommentProps = {
  comments: { id: number; type: string; body: string; createdAt?: string; author?: { name: string } | null }[];
  typeLabels: Record<string, string>;
};

export function WorkflowCommentsSummary({ comments, typeLabels }: CommentProps) {
  if (comments.length === 0) return null;

  return (
    <section>
      <h4 className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-atlas-muted">
        <MessageSquare className="h-3.5 w-3.5" /> التعليقات ({comments.length})
      </h4>
      <ul className="space-y-2">
        {comments.map((c) => (
          <li key={c.id} className="rounded-md border border-atlas-border px-3 py-2 text-xs dark:border-zinc-700">
            <p className="text-[10px] text-atlas-muted">
              {typeLabels[c.type] ?? c.type}
              {c.author?.name ? ` · ${c.author.name}` : ""}
              {c.createdAt ? ` · ${formatDateTime(c.createdAt)}` : ""}
            </p>
            <p className="mt-1 leading-relaxed text-atlas-ink">{c.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

type AttachmentProps = {
  attachments: { id: number; fileName: string }[];
};

export function WorkflowAttachmentsSummary({ attachments }: AttachmentProps) {
  if (attachments.length === 0) return null;

  return (
    <section>
      <h4 className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-atlas-muted">
        <Paperclip className="h-3.5 w-3.5" /> المرفقات ({attachments.length})
      </h4>
      <ul className="space-y-1">
        {attachments.map((a) => (
          <li key={a.id} className="rounded-md bg-atlas-canvas px-2.5 py-1.5 text-xs dark:bg-zinc-800/60">
            {a.fileName}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function StageStateIcon({ state }: { state: string }) {
  if (state === "completed") return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
  if (state === "current") return <CircleDot className="h-5 w-5 text-atlas-brand" />;
  return <Circle className="h-5 w-5 text-atlas-muted" />;
}
