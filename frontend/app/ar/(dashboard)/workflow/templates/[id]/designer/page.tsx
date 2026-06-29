"use client";

import { useParams } from "next/navigation";
import dynamic from "next/dynamic";

const WorkflowDesignerPageClient = dynamic(
  () =>
    import("@/features/workflow/designer/workflow-designer-page-client").then(
      (mod) => mod.WorkflowDesignerPageClient
    ),
  {
    ssr: false,
    loading: () => <p className="p-6 text-atlas-muted">جاري تحميل المصمم...</p>
  }
);

export default function WorkflowDesignerPage() {
  const params = useParams();
  const rawId = params?.id;
  const templateId = typeof rawId === "string" ? Number(rawId) : Number(rawId?.[0]);

  if (!templateId || Number.isNaN(templateId)) {
    return <p className="p-6 text-red-600">معرّف القالب غير صالح.</p>;
  }

  return <WorkflowDesignerPageClient templateId={templateId} />;
}
