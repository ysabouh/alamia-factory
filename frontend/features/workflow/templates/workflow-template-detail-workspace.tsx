"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Layers, Pencil, Play, Workflow } from "lucide-react";

import { useFactoryAuth } from "@/contexts/factory-auth-context";
import { StartWorkflowDialog } from "@/features/workflow/instances/start-workflow-dialog";
import {
  canStartTemplate,
  getTemplateReadiness,
  TEMPLATE_READINESS_HINTS
} from "@/features/workflow/templates/workflow-template-status";
import { WorkflowTemplateStatusBadges } from "@/features/workflow/templates/workflow-template-status-badges";
import {
  ASSIGNMENT_TYPE_LABELS,
  WORKFLOW_CATEGORY_LABELS,
  WORKFLOW_PRIORITY_LABELS
} from "@/features/workflow/workflow-labels";
import {
  assignmentConfigIsComplete,
  assignmentSummary,
  parseAssignmentConfig
} from "@/features/workflow/designer/workflow-stage-assignment";
import { WorkflowApiError, workflowApi, type WorkflowTemplateJson } from "@/lib/api/workflow-client";

const WorkflowTemplatePreviewMap = dynamic(
  () =>
    import("@/features/workflow/templates/workflow-template-preview-map").then(
      (mod) => mod.WorkflowTemplatePreviewMap
    ),
  {
    ssr: false,
    loading: () => (
      <section className="rounded-lg border border-atlas-border bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-sm text-atlas-muted">جاري تحميل معاينة التصميم...</p>
      </section>
    )
  }
);

type Props = {
  templateId: number;
};

export function WorkflowTemplateDetailWorkspace({ templateId }: Props) {
  const router = useRouter();
  const { can } = useFactoryAuth();
  const canView = can("workflow.templates.view") || can("workflow.templates.manage");
  const canManage = can("workflow.templates.manage");
  const canStart = can("workflow.instances.manage");

  const [template, setTemplate] = useState<WorkflowTemplateJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [startOpen, setStartOpen] = useState(false);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("custom");
  const [defaultPriority, setDefaultPriority] = useState("normal");
  const [isActive, setIsActive] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const t = await workflowApi.getTemplate(templateId);
      setTemplate(t);
      setCode(t.code);
      setName(t.name);
      setDescription(t.description ?? "");
      setCategory(t.category);
      setDefaultPriority(t.defaultPriority);
      setIsActive(t.isActive);
    } catch (e) {
      setError(e instanceof WorkflowApiError ? e.message : "تعذّر تحميل القالب");
      setTemplate(null);
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    if (canView) void load();
    else {
      setLoading(false);
      setError("ليس لديك صلاحية عرض القوالب");
    }
  }, [canView, load]);

  const save = async () => {
    if (!canManage) return;
    setSaving(true);
    setError(null);
    try {
      const t = await workflowApi.updateTemplate(templateId, {
        code,
        name,
        description: description || null,
        category,
        defaultPriority,
        isActive
      });
      setTemplate(t);
      setEditing(false);
    } catch (e) {
      setError(e instanceof WorkflowApiError ? e.message : "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const createDraftVersion = async () => {
    try {
      await workflowApi.createVersion(templateId);
      await load();
      router.push(`/ar/workflow/templates/${templateId}/designer`);
    } catch (e) {
      setError(e instanceof WorkflowApiError ? e.message : "فشل إنشاء نسخة");
    }
  };

  const archive = async () => {
    if (!confirm("أرشفة هذا القالب؟ سيصبح غير نشط ولن يظهر في بدء التنفيذ.")) return;
    try {
      await workflowApi.archiveTemplate(templateId);
      await load();
    } catch (e) {
      setError(e instanceof WorkflowApiError ? e.message : "فشل الأرشفة");
    }
  };

  const toggleActive = async () => {
    if (!canManage || !template) return;
    const next = !template.isActive;
    const msg = next
      ? "تفعيل هذا القالب؟ سيظهر في قائمة بدء التنفيذ (إذا كانت له نسخة منشورة)."
      : "إيقاف هذا القالب؟ لن يمكن بدء تنفيذات جديدة منه.";
    if (!confirm(msg)) return;
    setSaving(true);
    setError(null);
    try {
      const t = await workflowApi.updateTemplate(templateId, { isActive: next });
      setTemplate(t);
      setIsActive(t.isActive);
    } catch (e) {
      setError(e instanceof WorkflowApiError ? e.message : "فشل تحديث الحالة");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-atlas-muted">جاري التحميل...</p>;
  }

  if (!template) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error ?? "القالب غير موجود"}</p>
        <Link href="/ar/workflow/templates" className="mt-3 inline-block text-sm text-atlas-brand hover:underline">
          العودة للقائمة
        </Link>
      </div>
    );
  }

  const publishedStages = template.publishedVersion?.stages ?? [];
  const draftVersion = template.versions?.find((v) => v.status === "draft");
  const startReady = canStartTemplate(template);
  const readiness = getTemplateReadiness(template);

  return (
    <div className="space-y-4 p-4 dark:bg-zinc-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/ar/workflow/templates" className="inline-flex items-center gap-1 text-xs text-atlas-brand hover:underline">
            <ArrowRight className="h-3.5 w-3.5" />
            القوالب
          </Link>
          <h1 className="mt-1 text-xl font-bold text-atlas-ink dark:text-zinc-100">{template.name}</h1>
          <p className="font-mono text-xs text-atlas-muted">{template.code}</p>
          <div className="mt-2">
            <WorkflowTemplateStatusBadges template={template} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canStart ? (
            <button
              type="button"
              onClick={() => setStartOpen(true)}
              disabled={!startReady}
              title={
                startReady
                  ? "بدء تنفيذ جديد من النسخة المنشورة"
                  : "يتطلب قالباً نشطاً بنسخة منشورة ومراحل معرّفة"
              }
              className="atlas-btn-primary inline-flex items-center gap-1 text-sm disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              بدء تنفيذ
            </button>
          ) : null}
          {canManage ? (
            <>
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                className="atlas-btn-secondary inline-flex items-center gap-1 text-sm"
              >
                <Pencil className="h-4 w-4" />
                {editing ? "إلغاء التعديل" : "تعديل البيانات"}
              </button>
              <Link
                href={`/ar/workflow/templates/${templateId}/designer`}
                className="atlas-btn-primary inline-flex items-center gap-1 text-sm"
              >
                <Workflow className="h-4 w-4" />
                المصمم
              </Link>
            </>
          ) : null}
        </div>
      </div>

      <div
        className={`rounded-lg border px-4 py-3 text-sm ${
          readiness === "ready"
            ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"
            : readiness === "needs_publish"
              ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
              : "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        }`}
      >
        <p>{TEMPLATE_READINESS_HINTS[readiness]}</p>
        {canManage ? (
          <label className="mt-3 flex cursor-pointer items-center gap-2 font-medium">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-atlas-border"
              checked={template.isActive}
              disabled={saving}
              onChange={() => void toggleActive()}
            />
            القالب نشط (متاح لبدء التنفيذ عند وجود نسخة منشورة)
          </label>
        ) : null}
      </div>

      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <WorkflowTemplatePreviewMap
        version={template.publishedVersion ?? template.versions?.find((v) => v.status === "draft") ?? null}
        title={
          template.publishedVersion
            ? `معاينة التصميم (v${template.publishedVersion.version})`
            : "معاينة المسودة"
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-atlas-border bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="mb-3 text-sm font-bold">بيانات القالب</h2>
          {editing && canManage ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-atlas-muted">الرمز</label>
                <input className="atlas-input mt-1 w-full" value={code} onChange={(e) => setCode(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-atlas-muted">الاسم</label>
                <input className="atlas-input mt-1 w-full" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-atlas-muted">الوصف</label>
                <textarea
                  className="atlas-input mt-1 w-full"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-atlas-muted">التصنيف</label>
                <select className="atlas-input mt-1 w-full" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {Object.entries(WORKFLOW_CATEGORY_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-atlas-muted">الأولوية الافتراضية</label>
                <select
                  className="atlas-input mt-1 w-full"
                  value={defaultPriority}
                  onChange={(e) => setDefaultPriority(e.target.value)}
                >
                  {Object.entries(WORKFLOW_PRIORITY_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                نشط
              </label>
              <button type="button" disabled={saving} onClick={() => void save()} className="atlas-btn-primary w-full">
                {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
              </button>
            </div>
          ) : (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-atlas-muted">حالة القالب</dt>
                <dd>
                  <WorkflowTemplateStatusBadges template={template} />
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-atlas-muted">التصنيف</dt>
                <dd>{WORKFLOW_CATEGORY_LABELS[template.category] ?? template.category}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-atlas-muted">الأولوية</dt>
                <dd>{WORKFLOW_PRIORITY_LABELS[template.defaultPriority] ?? template.defaultPriority}</dd>
              </div>
              {template.description ? (
                <div>
                  <dt className="text-atlas-muted">الوصف</dt>
                  <dd className="mt-1 text-atlas-ink">{template.description}</dd>
                </div>
              ) : null}
            </dl>
          )}
        </section>

        <section className="rounded-lg border border-atlas-border bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">النسخ</h2>
            {canManage ? (
              <button type="button" onClick={() => void createDraftVersion()} className="text-xs text-atlas-brand hover:underline">
                + نسخة مسودة جديدة
              </button>
            ) : null}
          </div>
          <ul className="space-y-2 text-sm">
            {(template.versions ?? []).length === 0 ? (
              <li className="text-atlas-muted">لا توجد نسخ</li>
            ) : (
              (template.versions ?? []).map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between rounded-md border border-atlas-border px-3 py-2 dark:border-zinc-700"
                >
                  <span>
                    v{v.version} · {v.status === "published" ? "منشورة" : v.status === "draft" ? "مسودة" : "مؤرشفة"}
                  </span>
                  {canManage && v.status === "draft" ? (
                    <Link href={`/ar/workflow/templates/${templateId}/designer`} className="text-xs text-atlas-brand hover:underline">
                      فتح المصمم
                    </Link>
                  ) : null}
                </li>
              ))
            )}
          </ul>
          {canManage ? (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-atlas-border pt-3 dark:border-zinc-700">
              <button type="button" onClick={() => void archive()} className="atlas-btn-secondary text-xs">
                أرشفة القالب
              </button>
            </div>
          ) : null}
        </section>
      </div>

      <section className="rounded-lg border border-atlas-border bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
          <Layers className="h-4 w-4" />
          مراحل النسخة المنشورة
          {template.publishedVersion ? ` (v${template.publishedVersion.version})` : ""}
        </h2>
        {publishedStages.length === 0 ? (
          <p className="text-sm text-atlas-muted">لا توجد مراحل منشورة بعد. افتح المصمم وأنشئ مراحل ثم انشر النسخة.</p>
        ) : (
          <ol className="space-y-2">
            {publishedStages.map((s) => (
              <li key={s.id} className="rounded-md border border-atlas-border px-3 py-2 text-sm dark:border-zinc-700">
                <span className="font-medium">
                  {s.stageNumber}. {s.name}
                </span>
                <span className="ms-2 text-xs text-atlas-muted">
                  {ASSIGNMENT_TYPE_LABELS[s.assignmentType] ?? s.assignmentType}
                  {(() => {
                    const cfg = parseAssignmentConfig(s.assignmentConfig);
                    const label = assignmentSummary(s.assignmentType, cfg);
                    if (label) return ` · ${label}`;
                    if (!assignmentConfigIsComplete(s.assignmentType, cfg)) return " · بدون تعيين";
                    return "";
                  })()}
                  {s.slaDurationMinutes ? ` · SLA ${s.slaDurationMinutes}د` : ""}
                </span>
              </li>
            ))}
          </ol>
        )}
        {draftVersion && canManage ? (
          <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
            يوجد مسودة v{draftVersion.version} — يمكنك التعديل في المصمم قبل النشر.
          </p>
        ) : null}
      </section>

      <StartWorkflowDialog
        open={startOpen}
        template={template}
        onClose={() => setStartOpen(false)}
        onStarted={(instance) => router.push(`/ar/workflow/instances/${instance.id}`)}
      />
    </div>
  );
}
