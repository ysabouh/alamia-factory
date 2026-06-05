import { ProductionOrderDetailWorkspace } from "@/features/production/production-order-detail-workspace";

type Props = { params: Promise<{ id: string }> };

export default async function ProductionOrderDetailPage({ params }: Props) {
  const { id } = await params;
  return <ProductionOrderDetailWorkspace orderId={id} />;
}
