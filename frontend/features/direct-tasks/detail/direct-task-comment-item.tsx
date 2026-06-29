"use client";

import { AlertTriangle, HelpCircle, MessageSquare } from "lucide-react";

import type { DirectTaskCommentJson } from "@/lib/api/direct-tasks-client";
import { formatRelativeTime, initials } from "@/features/direct-tasks/detail/direct-task-detail-utils";
import { cn } from "@/lib/utils";

export function DirectTaskCommentItem({ comment }: { comment: DirectTaskCommentJson }) {
  const type = comment.commentType ?? "comment";
  const isProblem = type === "problem";
  const isHelp = type === "help";

  return (
    <li
      className={cn(
        "rounded-xl border p-3",
        isProblem
          ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40"
          : isHelp
            ? "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
            : "border-atlas-rule bg-white dark:border-zinc-700 dark:bg-zinc-900/50"
      )}
    >
      <div className="flex gap-2">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            isProblem ? "bg-red-200 text-red-800" : isHelp ? "bg-amber-200 text-amber-900" : "bg-atlas-brand/15 text-atlas-brand"
          )}
        >
          {initials(comment.userName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold">{comment.userName}</p>
            <span className="text-xs text-atlas-muted">{formatRelativeTime(comment.createdAt)}</span>
            {isProblem ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                <AlertTriangle className="h-3 w-3" />
                تنبيه — مشكلة
              </span>
            ) : null}
            {isHelp ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white">
                <HelpCircle className="h-3 w-3" />
                طلب مساعدة
              </span>
            ) : null}
          </div>
          <p className={cn("mt-1 text-sm", isProblem && "font-medium text-red-900 dark:text-red-100")}>{comment.body}</p>
        </div>
      </div>
    </li>
  );
}

export function DirectTaskProblemAlerts({ comments }: { comments: DirectTaskCommentJson[] }) {
  const problems = comments.filter((c) => (c.commentType ?? "comment") === "problem");
  if (problems.length === 0) return null;

  return (
    <div className="space-y-2">
      {problems.slice(0, 3).map((c) => (
        <div key={c.id} className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="text-xs font-bold">تنبيه — {c.userName}</p>
            <p>{c.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export type ComposerMode = "comment" | "problem" | "help";

export function composerTitle(mode: ComposerMode): string {
  switch (mode) {
    case "problem":
      return "الإبلاغ عن مشكلة";
    case "help":
      return "طلب مساعدة";
    default:
      return "إضافة تعليق";
  }
}

export function composerPlaceholder(mode: ComposerMode): string {
  switch (mode) {
    case "problem":
      return "صف المشكلة التي واجهتها أثناء تنفيذ المهمة...";
    case "help":
      return "اشرح نوع المساعدة المطلوبة...";
    default:
      return "اكتب تعليقك هنا...";
  }
}

export function composerIcon(mode: ComposerMode) {
  switch (mode) {
    case "problem":
      return <AlertTriangle className="h-4 w-4" />;
    case "help":
      return <HelpCircle className="h-4 w-4" />;
    default:
      return <MessageSquare className="h-4 w-4" />;
  }
}
