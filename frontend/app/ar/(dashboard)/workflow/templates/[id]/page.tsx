import { WorkflowTemplateDetailWorkspace } from "@/features/workflow/templates/workflow-template-detail-workspace";

export default async function WorkflowTemplateDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WorkflowTemplateDetailWorkspace templateId={Number(id)} />;
}
