import { WorkflowInstancePageClient } from "@/features/workflow/instances/workflow-instance-page-client";

export default async function WorkflowInstancePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WorkflowInstancePageClient instanceId={Number(id)} />;
}
