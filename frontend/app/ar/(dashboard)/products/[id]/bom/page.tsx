import { ProductBomEditorWorkspace } from "@/features/products/management/product-bom-editor-workspace";

export default async function ProductBomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductBomEditorWorkspace productId={id} />;
}
