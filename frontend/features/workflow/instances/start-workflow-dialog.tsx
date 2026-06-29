"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { WORKFLOW_PRIORITY_LABELS } from "@/features/workflow/workflow-labels";
import { canStartTemplate } from "@/features/workflow/templates/workflow-template-status";
import {
  WorkflowApiError,
  workflowApi,
  type WorkflowInstanceJson,
  type WorkflowTemplateJson
} from "@/lib/api/workflow-client";

type Props = {
  open: boolean;
  onClose: () => void;
  onStarted?: (instance: WorkflowInstanceJson) => void;
  /** When set, template picker is hidden and this template is used. */
  template?: WorkflowTemplateJson | null;
};

export function StartWorkflowDialog({ open, onClose, onStarted, template: fixedTemplate }: Props) {
  const [templates, setTemplates] = useState<WorkflowTemplateJson[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateId, setTemplateId] = useState<number | "">("");
  const [priority, setPriority] = useState("normal");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTemplate = useMemo(() => {
    if (fixedTemplate) return fixedTemplate;
    if (templateId === "") return null;
    return templates.find((t) => t.id === templateId) ?? null;
  }, [fixedTemplate, templateId, templates]);

  const loadTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const res = await workflowApi.listTemplates({ active: true, pageSize: 100 });
      setTemplates(res.data.filter(canStartTemplate));
    } catch {
      setTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setDueDate("");
    if (fixedTemplate) {
      setTemplateId(fixedTemplate.id);
      setPriority(fixedTemplate.defaultPriority ?? "normal");
    } else {
      setTemplateId("");
      setPriority("normal");
      void loadTemplates();
    }
  }, [open, fixedTemplate, loadTemplates]);

  useEffect(() => {
    if (selectedTemplate?.defaultPriority) {
      setPriority(selectedTemplate.defaultPriority);
    }
  }, [selectedTemplate?.id, selectedTemplate?.defaultPriority]);

  if (!open) return null;

  const startable = fixedTemplate ? canStartTemplate(fixedTemplate) : true;

  const submit = async () => {
    const id = fixedTemplate?.id ?? (templateId === "" ? null : templateId);
    if (!id) {
      setError("اختر قالب سير العمل");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const instance = await workflowApi.startInstance({
        templateId: id,
        priority,
        dueDate: dueDate || null
      });
      onStarted?.(instance);
      onClose();
    } catch (e) {
      setError(e instanceof WorkflowApiError ? e.message : "فشل بدء التنفيذ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
      <div
        className="w-full max-w-md rounded-lg border border-atlas-border bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        role="dialog"
        aria-labelledby="start-workflow-title"
      >
        <h3 id="start-workflow-title" className="text-sm font-bold text-atlas-ink dark:text-zinc-100">
          بدء تنفيذ سير العمل
        </h3>

        {fixedTemplate ? (
          <p className="mt-2 text-sm text-atlas-muted">
            القالب: <span className="font-medium text-atlas-ink dark:text-zinc-200">{fixedTemplate.name}</span>
            {fixedTemplate.publishedVersion ? (
              <span className="ms-1 text-xs">(v{fixedTemplate.publishedVersion.version})</span>
            ) : null}
          </p>
        ) : (
          <div className="mt-3">
            <label className="mb-1 block text-xs text-atlas-muted">قالب سير العمل</label>
            <select
              className="atlas-input w-full"
              value={templateId}
              disabled={loadingTemplates || busy}
              onChange={(e) => setTemplateId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">{loadingTemplates ? "جاري التحميل..." : "— اختر قالباً —"}</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
            {!loadingTemplates && templates.length === 0 ? (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                لا توجد قوالب نشطة بنسخة منشورة. انشر قالباً من المصمم أولاً.
              </p>
            ) : null}
          </div>
        )}

        {!startable && fixedTemplate ? (
          <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
            لا يمكن البدء: تأكد أن القالب نشط وله نسخة منشورة بمراحل معرّفة.
          </p>
        ) : (
          <>
            <div className="mt-3">
              <label className="mb-1 block text-xs text-atlas-muted">الأولوية</label>
              <select
                className="atlas-input w-full"
                value={priority}
                disabled={busy}
                onChange={(e) => setPriority(e.target.value)}
              >
                {Object.entries(WORKFLOW_PRIORITY_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs text-atlas-muted">تاريخ الاستحقاق (اختياري)</label>
              <input
                type="date"
                className="atlas-input w-full"
                value={dueDate}
                disabled={busy}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </>
        )}

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="atlas-btn-secondary text-sm" onClick={onClose} disabled={busy}>
            إلغاء
          </button>
          <button
            type="button"
            className="atlas-btn-primary text-sm disabled:opacity-50"
            disabled={busy || !startable || (!fixedTemplate && templateId === "")}
            onClick={() => void submit()}
          >
            {busy ? "جاري البدء..." : "بدء التنفيذ"}
          </button>
        </div>
      </div>
    </div>
  );
}
