"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

import { workflowApi, WorkflowApiError, type WorkflowTemplateJson, type WorkflowVersionJson } from "@/lib/api/workflow-client";

const WorkflowDesignerWorkspace = dynamic(
  () =>
    import("@/features/workflow/designer/workflow-designer-workspace").then(
      (mod) => mod.WorkflowDesignerWorkspace
    ),
  {
    ssr: false,
    loading: () => <p className="py-8 text-center text-sm text-atlas-muted">جاري تحميل لوحة الرسم...</p>
  }
);

function resolveEditableVersion(t: WorkflowTemplateJson): WorkflowVersionJson | null {
  const drafts = (t.versions ?? []).filter((v) => v.status === "draft");
  if (drafts.length > 0) {
    return [...drafts].sort((a, b) => b.version - a.version)[0] ?? null;
  }

  const fromList = t.versions?.[0];
  if (fromList) return fromList;

  return t.publishedVersion ?? null;
}

function enrichVersionForDesigner(
  editable: WorkflowVersionJson,
  published: WorkflowVersionJson | null | undefined
): WorkflowVersionJson {
  const defNodes = editable.definitionJson?.nodes ?? [];
  if (defNodes.length > 0) return editable;
  if (!published) return editable;

  const pubNodes = published.definitionJson?.nodes ?? [];
  const pubStages = published.stages ?? [];
  if (pubNodes.length === 0 && pubStages.length === 0) return editable;

  return {
    ...editable,
    definitionJson: pubNodes.length > 0 ? published.definitionJson : editable.definitionJson,
    stages: (editable.stages?.length ?? 0) > 0 ? editable.stages : published.stages,
    transitions: (editable.transitions?.length ?? 0) > 0 ? editable.transitions : published.transitions,
  };
}

type Props = {
  templateId: number;
};

export function WorkflowDesignerPageClient({ templateId }: Props) {
  const [template, setTemplate] = useState<WorkflowTemplateJson | null>(null);
  const [version, setVersion] = useState<WorkflowVersionJson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let t = await workflowApi.getTemplate(templateId);
      let editable = resolveEditableVersion(t);

      if (!editable || editable.status === "published") {
        const created = await workflowApi.createVersion(templateId);
        t = await workflowApi.getTemplate(templateId);
        editable = t.versions?.find((v) => v.id === created.id) ?? created;
      }

      if (!editable?.id) {
        setError("لا توجد نسخة قابلة للتعديل.");
        setTemplate(null);
        setVersion(null);
        return;
      }

      const fullVersion = await workflowApi.getVersion(editable.id);
      setTemplate(t);
      setVersion(enrichVersionForDesigner(fullVersion, t.publishedVersion));
    } catch (e) {
      setTemplate(null);
      setVersion(null);
      setError(e instanceof WorkflowApiError ? e.message : "تعذّر تحميل المصمم");
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="p-6 text-atlas-muted">جاري تحميل المصمم...</p>;
  }

  if (error || !template || !version) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error ?? "تعذّر فتح المصمم"}</p>
        <Link href={`/ar/workflow/templates/${templateId}`} className="mt-3 inline-block text-sm text-atlas-brand hover:underline">
          العودة لتفاصيل القالب
        </Link>
      </div>
    );
  }

  const nodeCount = version.definitionJson?.nodes?.length ?? version.stages?.length ?? 0;

  return (
    <div className="space-y-3 p-4 dark:bg-zinc-950">
      <div>
        <Link href={`/ar/workflow/templates/${templateId}`} className="text-xs text-atlas-brand hover:underline">
          ← تفاصيل القالب
        </Link>
        <h1 className="text-lg font-bold">{template.name}</h1>
        <p className="text-xs text-atlas-muted">
          مصمم سير العمل — نسخة v{version.version} ({version.status === "draft" ? "مسودة" : version.status})
          {nodeCount > 0 ? ` · ${nodeCount} عقدة` : ""}
        </p>
      </div>
      <WorkflowDesignerWorkspace versionId={version.id} initialVersion={version} onSaved={load} />
    </div>
  );
}
