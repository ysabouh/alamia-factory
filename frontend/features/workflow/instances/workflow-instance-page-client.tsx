"use client";

import dynamic from "next/dynamic";

const WorkflowInstanceWorkspace = dynamic(
  () =>
    import("@/features/workflow/instances/workflow-instance-workspace").then(
      (mod) => mod.WorkflowInstanceWorkspace
    ),
  {
    ssr: false,
    loading: () => <p className="p-6 text-atlas-muted">جاري تحميل تفاصيل التنفيذ...</p>
  }
);

export function WorkflowInstancePageClient({ instanceId }: { instanceId: number }) {
  return <WorkflowInstanceWorkspace instanceId={instanceId} />;
}
