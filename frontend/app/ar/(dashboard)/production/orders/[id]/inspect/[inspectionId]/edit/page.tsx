import { QualityInspectionWorkspace } from "@/features/production/quality-inspection-workspace";

type Props = { params: Promise<{ id: string; inspectionId: string }> };

export default async function ProductionOrderInspectEditPage({ params }: Props) {
  const { id, inspectionId } = await params;
  return <QualityInspectionWorkspace orderId={id} inspectionId={inspectionId} mode="edit" />;
}
