"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Flame,
  MoreHorizontal,
  Play
} from "lucide-react";

import type { DirectTaskJson } from "@/lib/api/direct-tasks-client";
import { resolveMediaUrl } from "@/lib/api/resolve-media-url";
import { categoryLabel, isImageAttachment, initials } from "@/features/direct-tasks/detail/direct-task-detail-utils";
import { CircularProgressRing } from "@/features/direct-tasks/my-tasks/circular-progress-ring";
import {
  categoryTone,
  formatTaskDeadline,
  priorityDisplay
} from "@/features/direct-tasks/my-tasks/my-direct-tasks-utils";
import { cn } from "@/lib/utils";

const LARAVEL_ORIGIN = (process.env.NEXT_PUBLIC_LARAVEL_ORIGIN ?? "http://127.0.0.1:8000").replace(/\/$/, "");

function thumbUrl(task: DirectTaskJson): string | null {
  const img = task.attachments?.find((a) => isImageAttachment(a.mimeType, a.fileName));
  if (!img) return null;
  const path = img.filePath;
  if (path.startsWith("http")) return resolveMediaUrl(path);
  return `${LARAVEL_ORIGIN}/storage/${path.replace(/^\/+/, "")}`;
}

function PriorityIcon({ icon }: { icon: "fire" | "up" | "down" }) {
  if (icon === "fire") return <Flame className="h-3.5 w-3.5" />;
  if (icon === "up") return <ArrowUp className="h-3.5 w-3.5" />;
  return <ArrowDown className="h-3.5 w-3.5" />;
}

type Props = {
  task: DirectTaskJson;
  onStart?: () => void;
};

export function MyDirectTaskRow({ task, onStart }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const deadline = formatTaskDeadline(task);
  const priority = priorityDisplay(task.priority);
  const progress = task.progressPercent ?? 0;
  const thumb = thumbUrl(task);
  const overdue = deadline.tone === "danger";
  const assignees = (task.assignments ?? []).slice(0, 3);

  return (
    <li className="relative border-b border-zinc-100 last:border-0 dark:border-zinc-800">
      <div className="flex items-stretch gap-3 px-4 py-3.5 transition hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40">
        {/* مصغّر */}
        <div className="hidden w-16 shrink-0 sm:block">
          {thumb ? (
            <img src={thumb} alt="" className="h-14 w-16 rounded-lg object-cover ring-1 ring-zinc-200 dark:ring-zinc-700" />
          ) : (
            <div className="flex h-14 w-16 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
              <Play className="h-5 w-5 opacity-50" />
            </div>
          )}
        </div>

        {/* المحتوى */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-2">
            {overdue ? (
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              <Link href={`/ar/workflow/direct-tasks/${task.id}`} className="block font-bold text-zinc-900 hover:text-atlas-brand dark:text-zinc-100">
                {task.title}
              </Link>
              <p className="mt-0.5 truncate text-xs text-zinc-500">{task.description?.trim() || task.taskNumber}</p>
            </div>
            <span className={cn("shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", categoryTone(task.category))}>
              {categoryLabel(task.category)}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className={cn("inline-flex items-center gap-1 font-semibold", priority.className)}>
              <PriorityIcon icon={priority.icon} />
              {priority.label}
            </span>
            <span
              className={cn(
                "font-medium",
                deadline.tone === "danger" && "text-red-600",
                deadline.tone === "warning" && "text-amber-600",
                deadline.tone === "neutral" && "text-zinc-500"
              )}
            >
              {deadline.text}
            </span>
          </div>
        </div>

        {/* مسؤولون */}
        <div className="hidden shrink-0 items-center -space-x-2 space-x-reverse md:flex">
          {assignees.map((a) => {
            const avatar = a.avatarUrl?.trim() ? resolveMediaUrl(a.avatarUrl) : "";
            return avatar ? (
              <img key={a.id ?? a.assigneeId} src={avatar} alt={a.label ?? ""} title={a.label ?? ""} className="h-8 w-8 rounded-full object-cover ring-2 ring-white dark:ring-zinc-900" />
            ) : (
              <span
                key={a.id ?? a.assigneeId}
                title={a.label ?? ""}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-atlas-brand/15 text-[10px] font-bold text-atlas-brand ring-2 ring-white dark:ring-zinc-900"
              >
                {initials(a.label)}
              </span>
            );
          })}
        </div>

        {/* تقدم */}
        <div className="flex shrink-0 items-center">
          <CircularProgressRing percent={progress} />
        </div>

        {/* قائمة */}
        <div className="relative flex shrink-0 items-center">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="إجراءات"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen ? (
            <>
              <button type="button" className="fixed inset-0 z-10" aria-label="إغلاق" onClick={() => setMenuOpen(false)} />
              <div className="absolute end-0 top-full z-20 mt-1 min-w-[160px] rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                <Link href={`/ar/workflow/direct-tasks/${task.id}`} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800" onClick={() => setMenuOpen(false)}>
                  <ExternalLink className="h-4 w-4" /> فتح المهمة
                </Link>
                {onStart && ["assigned", "accepted", "pending"].includes(task.status) ? (
                  <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800" onClick={() => { setMenuOpen(false); onStart(); }}>
                    <Play className="h-4 w-4" /> بدء التنفيذ
                  </button>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </li>
  );
}
