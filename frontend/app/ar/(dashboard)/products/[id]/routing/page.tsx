import { ProductRoutingWorkspace } from "@/features/manufacturing/routing/product-routing-workspace";

export default async function ProductRoutingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductRoutingWorkspace productId={id} />;
}
