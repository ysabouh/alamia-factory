import { DirectTaskDetailWorkspace } from "@/features/direct-tasks/direct-task-detail-workspace";

export default async function DirectTaskDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const taskId = Number(id);
  if (!Number.isFinite(taskId)) {
    return <p className="p-6 text-atlas-muted">معرّف مهمة غير صالح</p>;
  }
  return <DirectTaskDetailWorkspace taskId={taskId} />;
}
