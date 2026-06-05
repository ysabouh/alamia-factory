"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ProductForm } from "@/features/products/management/product-form";
import {
  detailToFormValues,
  type ProductFormValues
} from "@/features/products/management/product-form-schema";
import {
  ProductDocumentUploader,
  ProductImageUploader
} from "@/features/products/management/product-uploaders";
import { machinesApi } from "@/lib/api/machines-client";
import { moldsApi } from "@/lib/api/molds-client";
import {
  productsApi,
  ProductsApiError,
  type ProductDetailJson,
  type ProductDocumentJson,
  type ProductImageJson,
  type ProductMastersJson,
  type ProductPayload
} from "@/lib/api/products-client";

export function ProductFormWorkspace({ productId }: { productId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(productId);

  const [masters, setMasters] = useState<ProductMastersJson | null>(null);
  const [materialProducts, setMaterialProducts] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [molds, setMolds] = useState<Array<{ id: string; moldCode: string; moldName: string }>>([]);
  const [machines, setMachines] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [initial, setInitial] = useState<ProductFormValues | undefined>();
  const [detail, setDetail] = useState<ProductDetailJson | null>(null);
  const [images, setImages] = useState<ProductImageJson[]>([]);
  const [documents, setDocuments] = useState<ProductDocumentJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [mastersRes, productsRes, moldsRes, machinesRes] = await Promise.all([
          productsApi.masters(),
          productsApi.list({ pageSize: 100, productType: "raw_material" }),
          moldsApi.list({ pageSize: 100 }),
          machinesApi.list({ pageSize: 100, isActive: true })
        ]);
        setMasters(mastersRes.data);
        setMaterialProducts(
          productsRes.data.map((p) => ({ id: p.id, code: p.productCode, name: p.productNameAr }))
        );
        setMolds(moldsRes.data.map((m) => ({ id: m.id, moldCode: m.moldCode, moldName: m.moldName })));
        setMachines(machinesRes.data.map((m) => ({ id: m.id, code: m.code, name: m.name })));

        if (productId) {
          const res = await productsApi.show(productId);
          setDetail(res.data);
          setInitial(detailToFormValues(res.data));
          setImages(res.data.images ?? []);
          setDocuments(res.data.documents ?? []);
        }
        setError(null);
      } catch (e) {
        setError(e instanceof ProductsApiError ? e.message : "تعذر التحميل");
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  const onSubmit = async (payload: ProductPayload) => {
    setBusy(true);
    setError(null);
    try {
      if (isEdit && productId) {
        await productsApi.update(productId, payload);
        router.push(`/ar/products/${productId}` as Route);
      } else {
        const res = await productsApi.create(payload);
        router.push(`/ar/products/${res.data.id}` as Route);
      }
    } catch (e) {
      setError(e instanceof ProductsApiError ? e.message : "فشل الحفظ");
      setBusy(false);
    }
  };

  if (loading || !masters) {
    return <p className="text-muted-foreground">جاري التحميل…</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{isEdit ? "تعديل منتج" : "إضافة منتج"}</h1>
        <Button variant="outline" asChild>
          <Link href={"/ar/products/registry" as Route}>رجوع للسجل</Link>
        </Button>
      </div>

      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <ProductForm
        masters={masters}
        materialProducts={materialProducts}
        molds={molds as never}
        machines={machines as never}
        initial={initial}
        onSubmit={onSubmit}
        busy={busy}
        submitLabel={isEdit ? "حفظ التعديلات" : "إنشاء المنتج"}
      />

      {isEdit && productId && detail && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border/60 p-4">
            <h2 className="mb-3 font-medium">الصور</h2>
            <ProductImageUploader productId={productId} images={images} onChange={setImages} />
          </div>
          <div className="rounded-lg border border-border/60 p-4">
            <h2 className="mb-3 font-medium">المستندات</h2>
            <ProductDocumentUploader productId={productId} documents={documents} onChange={setDocuments} />
          </div>
        </div>
      )}
    </div>
  );
}
