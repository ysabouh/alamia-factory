import { ProductDetailWorkspace } from "@/features/products/management/product-detail-workspace";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetailWorkspace productId={id} />;
}
