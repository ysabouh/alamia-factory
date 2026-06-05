"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { QualityChecklistForm } from "@/features/production/quality-checklist-form";
import { productsApi, ProductsApiError } from "@/lib/api/products-client";

export default function ProductQualityChecklistPage() {
  const params = useParams<{ id: string }>();
  const [productName, setProductName] = useState<string | undefined>();

  useEffect(() => {
    if (!params.id) return;
    void productsApi
      .show(params.id)
      .then((res) => setProductName(res.data.productNameAr))
      .catch((e: ProductsApiError) => {
        if (e.status !== 404) console.error(e);
      });
  }, [params.id]);

  if (!params.id) return null;

  return <QualityChecklistForm productId={params.id} productName={productName} />;
}
