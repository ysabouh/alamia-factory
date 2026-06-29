"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Camera,
  CheckCircle2,
  ClipboardList,
  Copy,
  FileText,
  HelpCircle,
  MessageSquare,
  MoreVertical,
  Play,
  Send,
  X
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useFactoryAuth } from "@/contexts/factory-auth-context";
import { CHECKLIST_ITEM_TYPE_LABELS } from "@/features/direct-tasks/create/create-direct-task-labels";
import {
  ComposerMode,
  DirectTaskCommentItem,
  DirectTaskProblemAlerts,
  composerIcon,
  composerPlaceholder,
  composerTitle
} from "@/features/direct-tasks/detail/direct-task-comment-item";
import { DirectTaskAssigneeStrip } from "@/features/direct-tasks/detail/direct-task-assignee-strip";
import {
  categoryLabel,
  formatExecutionWindow,
  formatRelativeTime,
  isImageAttachment,
  priorityLabel,
  priorityTone,
  statusLabel,
  statusTone,
  typeLabel
} from "@/features/direct-tasks/detail/direct-task-detail-utils";
import { directTasksApi, type DirectTaskJson } from "@/lib/api/direct-tasks-client";
import { resolveMediaUrl } from "@/lib/api/resolve-media-url";
import { cn } from "@/lib/utils";

const LARAVEL_ORIGIN = (process.env.NEXT_PUBLIC_LARAVEL_ORIGIN ?? "http://127.0.0.1:8000").replace(/\/$/, "");

function fileUrl(path: string): string {
  if (path.startsWith("http")) return resolveMediaUrl(path);
  return `${LARAVEL_ORIGIN}/storage/${path.replace(/^\/+/, "")}`;
}

type TabId = "details" | "attachments" | "comments" | "activity";

const ACTIVE = new Set(["assigned", "accepted", "in_progress", "waiting_review", "pending"]);

function toneClass(tone: "success" | "warning" | "danger" | "info" | "neutral") {
  switch (tone) {
    case "success":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "warning":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "danger":
      return "bg-red-50 text-red-700 border-red-200";
    case "info":
      return "bg-sky-50 text-sky-700 border-sky-200";
    default:
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
  }
}

function SummaryPill({ label, value, tone = "neutral", icon }: { label: string; value: string; tone?: "success" | "warning" | "danger" | "info" | "neutral"; icon?: React.ReactNode }) {
  return (
    <div className="min-w-[120px] flex-1 rounded-xl border border-atlas-rule bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <p className="text-[11px] text-atlas-muted">{label}</p>
      <div className={cn("mt-1 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold", toneClass(tone))}>
        {icon}
        {value}
      </div>
    </div>
  );
}

export function DirectTaskExecutionWorkspace({ taskId }: { taskId: number }) {
  const { can } = useFactoryAuth();
  const canView = can("direct_tasks.view");
  const canExecute = can("direct_tasks.execute");
  const [task, setTask] = useState<DirectTaskJson | null>(null);
  const [tab, setTab] = useState<TabId>("details");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [composerMode, setComposerMode] = useState<ComposerMode | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTask(await directTasksApi.get(taskId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر تحميل المهمة");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (canView) void load();
  }, [canView, load]);

  const run = async (fn: () => Promise<DirectTaskJson | void>) => {
    setBusy(true);
    setError(null);
    try {
      const next = await fn();
      if (next) setTask(next);
      else await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل تنفيذ الإجراء");
    } finally {
      setBusy(false);
    }
  };

  const checklist = task?.checklist ?? [];
  const firstOpenId = checklist.find((i) => !i.isCompleted)?.id;
  const progress = task?.progressPercent ?? 0;
  const canAct = canExecute && task != null && ACTIVE.has(task.status);

  const activity = useMemo(() => {
    if (!task) return [];
    const rows: { at: string; text: string }[] = [];
    if (task.createdAt) rows.push({ at: task.createdAt, text: "تم إنشاء المهمة" });
    if (task.startedAt) rows.push({ at: task.startedAt, text: "بدء التنفيذ" });
    if (task.completedAt) rows.push({ at: task.completedAt, text: "اكتملت المهمة" });
    for (const c of task.comments ?? []) {
      if (c.createdAt) {
        const label =
          c.commentType === "problem" ? `إبلاغ عن مشكلة — ${c.userName}` : c.commentType === "help" ? `طلب مساعدة — ${c.userName}` : `${c.userName}: تعليق`;
        rows.push({ at: c.createdAt, text: label });
      }
    }
    return rows.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [task]);

  if (!canView) return <p className="p-6 text-atlas-muted">ليس لديك صلاحية عرض المهام المباشرة.</p>;
  if (loading) return <p className="p-6 text-atlas-muted">جاري تحميل المهمة...</p>;
  if (!task) return <p className="p-6 text-atlas-muted">{error ?? "المهمة غير موجودة"}</p>;

  const assignees = task.assignments ?? [];
  const comments = task.comments ?? [];

  const submitComposer = async () => {
    if (!composerMode || !comment.trim()) return;
    await run(async () => {
      await directTasksApi.addComment(task.id, comment.trim(), composerMode);
      setComment("");
      setComposerMode(null);
    });
  };

  const openComposer = (mode: ComposerMode) => {
    setComposerMode(mode);
    setComment("");
    setTab(mode === "comment" ? tab : "comments");
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-atlas-canvas/40 pb-28 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-atlas-rule bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/ar/workflow/direct-tasks" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-atlas-muted hover:bg-atlas-canvas dark:hover:bg-zinc-800" aria-label="رجوع">
              <ArrowRight className="h-5 w-5" />
            </Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-atlas-brand/10 text-atlas-brand">
              <ClipboardList className="h-4 w-4" />
            </div>
            <h1 className="truncate text-base font-bold text-atlas-ink dark:text-zinc-100 md:text-lg">{task.title}</h1>
          </div>
        </div>
      </header>

      {error ? <p className="mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 md:mx-6">{error}</p> : null}

      <div className="px-4 pt-3 md:px-6">
        <DirectTaskProblemAlerts comments={comments} />
      </div>

      {/* Summary strip */}
      <div className="space-y-3 border-b border-atlas-rule bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900 md:px-6">
        <div className="flex flex-wrap gap-3">
          <SummaryPill label="الحالة" value={statusLabel(task.status)} tone={statusTone(task.status)} icon={<Play className="h-3 w-3" />} />
          <SummaryPill label="الأولوية" value={priorityLabel(task.priority)} tone={priorityTone(task.priority)} />
          <SummaryPill label="النوع" value={typeLabel(task.taskType)} tone="info" icon={<Calendar className="h-3 w-3" />} />
          <div className="min-w-[140px] flex-1 rounded-xl border border-atlas-rule bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-[11px] text-atlas-muted">رقم المهمة</p>
            <button type="button" className="mt-1 flex items-center gap-1 font-mono text-sm font-semibold text-atlas-brand" onClick={() => void navigator.clipboard.writeText(task.taskNumber)}>
              {task.taskNumber}
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="min-w-[220px] flex-[1.4] rounded-xl border border-atlas-rule bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-[11px] text-atlas-muted">المسؤولون ({assignees.length})</p>
            <div className="mt-3">
              <DirectTaskAssigneeStrip assignees={assignees} />
            </div>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="mb-1 flex justify-between text-xs text-atlas-muted">
              <span>نسبة الإنجاز</span>
              <span className="font-semibold text-emerald-600">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-atlas-rule bg-atlas-canvas/50 px-3 py-2 text-sm dark:border-zinc-700">
            <Calendar className="h-4 w-4 text-atlas-brand" />
            <span>{formatExecutionWindow(task.startDate, task.executionTime, task.expectedDurationMinutes)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-atlas-rule bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 md:px-6">
        <div className="flex gap-6 overflow-x-auto text-sm">
          {(
            [
              ["details", "تفاصيل المهمة"],
              ["attachments", `المرفقات (${task.attachments?.length ?? 0})`],
              ["comments", `التعليقات (${task.comments?.length ?? 0})`],
              ["activity", "سجل النشاط"]
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "shrink-0 border-b-2 py-3 font-medium transition",
                tab === id ? "border-atlas-brand text-atlas-brand" : "border-transparent text-atlas-muted hover:text-atlas-ink"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-5 md:px-6">
        {tab === "details" ? (
          <div className="grid gap-5 xl:grid-cols-12">
            {/* معلومات — يمين في RTL */}
            <aside className="space-y-4 xl:col-span-3">
              <section className="rounded-xl border border-atlas-rule bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                <h2 className="mb-3 text-sm font-bold">معلومات المهمة</h2>
                <dl className="space-y-2.5 text-sm">
                  <div className="flex justify-between gap-2"><dt className="text-atlas-muted">التصنيف</dt><dd>{categoryLabel(task.category)}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-atlas-muted">تاريخ الإنشاء</dt><dd>{task.createdAt ? new Date(task.createdAt).toLocaleString("ar-EG") : "—"}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-atlas-muted">أُنشئت بواسطة</dt><dd>{task.createdByName ?? "—"}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-atlas-muted">آخر تحديث</dt><dd>{formatRelativeTime(task.updatedAt)}</dd></div>
                </dl>
              </section>
              <section className="rounded-xl border border-atlas-rule bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                <h2 className="mb-2 text-sm font-bold">سبب الإرجاع</h2>
                <p className={cn("text-sm", task.rejectionReason ? "text-red-600" : "text-atlas-muted")}>{task.rejectionReason ?? "لا يوجد"}</p>
              </section>
              <section className="rounded-xl border border-atlas-rule bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                <h2 className="mb-3 text-sm font-bold">الملفات المرفقة</h2>
                <ul className="space-y-2">
                  {(task.attachments ?? []).slice(0, 3).map((f) => (
                    <li key={f.id}>
                      <a href={fileUrl(f.filePath)} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-atlas-rule px-2 py-2 text-sm hover:bg-atlas-canvas/60 dark:border-zinc-700">
                        <FileText className="h-4 w-4 text-red-500" />
                        <span className="truncate">{f.fileName}</span>
                      </a>
                    </li>
                  ))}
                </ul>
                {(task.attachments?.length ?? 0) > 0 ? (
                  <button type="button" className="mt-3 w-full text-center text-xs font-semibold text-atlas-brand" onClick={() => setTab("attachments")}>
                    عرض جميع الملفات
                  </button>
                ) : (
                  <p className="text-xs text-atlas-muted">لا توجد مرفقات</p>
                )}
              </section>
            </aside>

            {/* قائمة التحقق — الوسط */}
            <main className="xl:col-span-6">
              <section className="rounded-xl border border-atlas-rule bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-bold">
                    <CheckCircle2 className="h-4 w-4 text-atlas-brand" />
                    قائمة التحقق
                  </h2>
                  <Badge variant="outline">{task.checklistCompleted ?? 0}/{task.checklistTotal ?? checklist.length}</Badge>
                </div>
                <ul className="space-y-2">
                  {checklist.map((item) => {
                    const isActive = item.id === firstOpenId;
                    const completed = Boolean(item.isCompleted);
                    return (
                      <li
                        key={item.id}
                        className={cn(
                          "rounded-xl border px-3 py-3 transition",
                          completed ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20" : isActive ? "border-amber-300 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/20" : "border-atlas-rule dark:border-zinc-700"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={completed}
                            disabled={!canAct || busy}
                            onChange={(e) => {
                              if (!item.id) return;
                              void run(() => directTasksApi.updateChecklistItem(task.id, item.id!, { isCompleted: e.target.checked }));
                            }}
                            className="mt-1 h-4 w-4 rounded border-atlas-rule"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-medium text-sm">{item.label}</p>
                              <div className="flex items-center gap-2">
                                {completed ? <Badge variant="success">مكتمل</Badge> : isActive ? <Badge variant="warning">قيد التنفيذ</Badge> : item.isRequired ? <Badge variant="outline">إجباري</Badge> : null}
                                <button type="button" className="text-atlas-muted"><MoreVertical className="h-4 w-4" /></button>
                              </div>
                            </div>
                            <p className="mt-1 text-xs text-atlas-muted">{CHECKLIST_ITEM_TYPE_LABELS[item.itemType] ?? item.itemType}</p>
                            {item.itemType === "number" && canAct ? (
                              <Input
                                className="mt-2 h-8 text-sm"
                                placeholder="أدخل القيمة"
                                defaultValue={item.responseValue ?? ""}
                                onBlur={(e) => {
                                  if (!item.id) return;
                                  void run(() => directTasksApi.updateChecklistItem(task.id, item.id!, { responseValue: e.target.value, isCompleted: e.target.value.length > 0 }));
                                }}
                              />
                            ) : null}
                            {item.responseValue && item.itemType === "image" ? (
                              <img src={fileUrl(item.responseValue)} alt="" className="mt-2 h-16 w-24 rounded-md object-cover" />
                            ) : null}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {task.notes ? (
                  <button type="button" className="atlas-btn-secondary mt-4 w-full text-sm">عرض تعليمات تنفيذ المهمة</button>
                ) : null}
              </section>
            </main>

            {/* وصف + تعليقات — يسار في RTL */}
            <aside className="space-y-4 xl:col-span-3">
              <section className="rounded-xl border border-atlas-rule bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                <h2 className="mb-2 text-sm font-bold">وصف المهمة</h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-atlas-slate">{task.description}</p>
              </section>
              <section className="rounded-xl border border-atlas-rule bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                <h2 className="mb-3 text-sm font-bold">التعليقات</h2>
                <ul className="mb-3 max-h-56 space-y-2 overflow-y-auto">
                  {comments.map((c) => (
                    <DirectTaskCommentItem key={c.id} comment={c} />
                  ))}
                </ul>
                {canExecute ? (
                  <button type="button" className="atlas-btn-secondary w-full text-sm" onClick={() => openComposer("comment")}>
                    إضافة تعليق
                  </button>
                ) : null}
              </section>
            </aside>
          </div>
        ) : null}

        {tab === "attachments" ? (
          <section className="rounded-xl border border-atlas-rule bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="mb-4 text-sm font-bold">جميع المرفقات</h2>
            {(task.attachments ?? []).length === 0 ? (
              <p className="text-sm text-atlas-muted">لا توجد مرفقات</p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {(task.attachments ?? []).map((f) => {
                  const href = fileUrl(f.filePath);
                  const isImage = isImageAttachment(f.mimeType, f.fileName);
                  return (
                    <li key={f.id}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="group block overflow-hidden rounded-xl border border-atlas-rule transition hover:border-atlas-brand/40 hover:shadow-md dark:border-zinc-700"
                      >
                        {isImage ? (
                          <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                            <img
                              src={href}
                              alt={f.fileName}
                              className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="flex aspect-[4/3] items-center justify-center bg-atlas-canvas/60 dark:bg-zinc-800/80">
                            <FileText className="h-12 w-12 text-atlas-brand" />
                          </div>
                        )}
                        <div className="border-t border-atlas-rule px-3 py-2.5 dark:border-zinc-700">
                          <p className="truncate text-sm font-medium text-atlas-ink dark:text-zinc-100">{f.fileName}</p>
                          {f.fileSize ? (
                            <p className="mt-0.5 text-xs text-atlas-muted">{Math.round(f.fileSize / 1024)} ك.ب</p>
                          ) : null}
                        </div>
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ) : null}

        {tab === "comments" ? (
          <section className="mx-auto max-w-2xl rounded-xl border border-atlas-rule bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="mb-4 text-sm font-bold">التعليقات</h2>
            <ul className="space-y-3">
              {comments.map((c) => (
                <DirectTaskCommentItem key={c.id} comment={c} />
              ))}
            </ul>
          </section>
        ) : null}

        {tab === "activity" ? (
          <section className="mx-auto max-w-2xl rounded-xl border border-atlas-rule bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="mb-4 text-sm font-bold">سجل النشاط</h2>
            <ul className="space-y-3">
              {activity.map((row, i) => (
                <li key={i} className="flex justify-between gap-3 border-b border-atlas-rule pb-2 text-sm last:border-0 dark:border-zinc-700">
                  <span>{row.text}</span>
                  <span className="shrink-0 text-atlas-muted">{formatRelativeTime(row.at)}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {/* محرر التعليق / الإبلاغ */}
      {canAct && composerMode ? (
        <div className="fixed inset-x-0 bottom-[4.25rem] z-40 border-t border-atlas-rule bg-white px-4 py-3 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 md:px-6">
          <div className="mx-auto max-w-6xl">
            <div
              className={cn(
                "mb-2 flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-semibold",
                composerMode === "problem"
                  ? "bg-red-50 text-red-800 dark:bg-red-950/40"
                  : composerMode === "help"
                    ? "bg-amber-50 text-amber-900 dark:bg-amber-950/30"
                    : "bg-atlas-canvas text-atlas-ink"
              )}
            >
              <span className="inline-flex items-center gap-2">
                {composerIcon(composerMode)}
                {composerTitle(composerMode)}
              </span>
              <button type="button" onClick={() => { setComposerMode(null); setComment(""); }} className="text-atlas-muted hover:text-atlas-ink">
                <X className="h-4 w-4" />
              </button>
            </div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={composerPlaceholder(composerMode)}
              className="min-h-[88px] text-sm"
              autoFocus
            />
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" className="atlas-btn-secondary text-sm" onClick={() => { setComposerMode(null); setComment(""); }}>
                إلغاء
              </button>
              <button
                type="button"
                disabled={busy || !comment.trim()}
                className={cn("atlas-btn-primary text-sm", composerMode === "problem" && "bg-red-600 hover:bg-red-700")}
                onClick={() => void submitComposer()}
              >
                {composerMode === "problem" ? "إرسال التنبيه" : "إرسال"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* شريط الإجراءات */}
      {canAct ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-atlas-rule bg-white/95 px-4 py-3 shadow-lg backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95 md:px-6">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
            <button type="button" disabled={busy} className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 dark:border-zinc-600 dark:text-zinc-300" onClick={() => openComposer("help")}>
              <HelpCircle className="h-4 w-4" /> طلب مساعدة
            </button>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white" onClick={() => openComposer("problem")}>
                <AlertTriangle className="h-4 w-4" /> الإبلاغ عن مشكلة
              </button>
              <button type="button" disabled={busy} className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-2 text-xs font-medium text-white" onClick={() => void run(() => directTasksApi.submitForReview(task.id))}>
                <Send className="h-4 w-4" /> إرسال للمراجعة
              </button>
              <button type="button" disabled={busy} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white" onClick={() => openComposer("comment")}>
                <MessageSquare className="h-4 w-4" /> تعليق
              </button>
              <button type="button" disabled={busy} className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white" onClick={() => photoRef.current?.click()}>
                <Camera className="h-4 w-4" /> رفع صورة
              </button>
              <button type="button" disabled={busy} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white" onClick={() => void run(() => directTasksApi.complete(task.id))}>
                <CheckCircle2 className="h-4 w-4" /> استكمال المهمة
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <input ref={fileRef} type="file" className="hidden" onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        void run(async () => { await directTasksApi.uploadAttachment(task.id, file); });
        e.target.value = "";
      }} />
      <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        void run(async () => { await directTasksApi.uploadAttachment(task.id, file); });
        e.target.value = "";
      }} />
    </div>
  );
}
