import { QualityInspectionWorkspace } from "@/features/production/quality-inspection-workspace";

type Props = { params: Promise<{ id: string }> };

export default async function ProductionOrderInspectPage({ params }: Props) {
  const { id } = await params;
  return <QualityInspectionWorkspace orderId={id} mode="create" />;
}
