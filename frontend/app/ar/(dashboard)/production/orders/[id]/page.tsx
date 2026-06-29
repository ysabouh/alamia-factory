import { ProductionOrderDetailWorkspace } from "@/features/production/production-order-detail-workspace";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> };

export default async function ProductionOrderDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab } = await searchParams;
  return <ProductionOrderDetailWorkspace orderId={id} initialTab={tab} />;
}
