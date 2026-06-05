import { ProductFormWorkspace } from "@/features/products/management/product-form-workspace";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductFormWorkspace productId={id} />;
}
