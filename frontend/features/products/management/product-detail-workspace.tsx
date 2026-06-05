"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Edit, GitBranch, Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFactoryAuth } from "@/contexts/factory-auth-context";
import {
  ProductRoutingFlow,
  ProductRoutingSummaryCards
} from "@/features/manufacturing/routing/product-routing-flow";
import { operationTypeLabels } from "@/features/manufacturing/routing/routing-ui";
import {
  manufacturingModeBadgeVariant,
  manufacturingModeLabels,
  manufacturingTypeLabels,
  productStatusLabels,
  productTypeLabels
} from "@/features/products/management/product-status-ui";
import {
  ProductDocumentUploader,
  ProductImageUploader
} from "@/features/products/management/product-uploaders";
import {
  productsApi,
  ProductsApiError,
  type ProductDetailJson,
  type ProductDocumentJson,
  type ProductImageJson
} from "@/lib/api/products-client";
import { routingApi, RoutingApiError, type ProductRoutingJson } from "@/lib/api/routing-client";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value ?? "—"}</p>
    </div>
  );
}

function SectionCard({
  title,
  action,
  children
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function ProductDetailWorkspace({ productId }: { productId: string }) {
  const { can } = useFactoryAuth();
  const canManage = can("products.manage");

  const [product, setProduct] = useState<ProductDetailJson | null>(null);
  const [routing, setRouting] = useState<ProductRoutingJson | null>(null);
  const [images, setImages] = useState<ProductImageJson[]>([]);
  const [documents, setDocuments] = useState<ProductDocumentJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [productRes, routingRes] = await Promise.all([
          productsApi.show(productId),
          routingApi.routing(productId)
        ]);
        setProduct(productRes.data);
        setRouting(routingRes.data);
        setImages(productRes.data.images ?? []);
        setDocuments(productRes.data.documents ?? []);
        setError(null);
      } catch (e) {
        setError(
          e instanceof ProductsApiError || e instanceof RoutingApiError
            ? e.message
            : "تعذر التحميل"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  if (loading) return <p className="text-muted-foreground">جاري التحميل…</p>;
  if (error || !product) return <p className="text-destructive">{error ?? "غير موجود"}</p>;

  const mode = product.manufacturingMode ?? routing?.manufacturingMode ?? "manufactured";
  const operations = product.operations ?? [];
  const assignedMachines = routing?.assignedMachines ?? product.assignedMachines ?? [];
  const assignedMolds = routing?.assignedMolds ?? product.assignedMolds ?? [];
  const machineParams = routing?.machineParameters ?? [];
  const qcSpecs = routing?.qcSpecifications ?? [];
  const packagingOps = routing?.packagingOperations ?? [];
  const manufacturingOps = operations.filter(
    (op) => !["packaging", "labeling"].includes(op.operationType)
  );

  return (
    <div className="space-y-6">
      {/* Header — Product Information */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt="" className="h-24 w-24 rounded-lg object-cover" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-muted/30">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold">{product.productNameAr}</h1>
            <p className="text-muted-foreground">
              {product.productCode} · {product.sku}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge>{productTypeLabels[product.productType]}</Badge>
              <Badge variant={manufacturingModeBadgeVariant(mode)}>
                {manufacturingModeLabels[mode] ?? mode}
              </Badge>
              {product.manufacturingType && (
                <Badge variant="secondary">
                  {manufacturingTypeLabels[product.manufacturingType]}
                </Badge>
              )}
              <Badge variant="outline">{productStatusLabels[product.productStatus]}</Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={"/ar/products/registry" as Route}>السجل</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/ar/products/${productId}/routing` as Route}>
              <GitBranch className="ml-2 h-4 w-4" />
              مسار الإنتاج
            </Link>
          </Button>
          {canManage && (
            <Button variant="outline" asChild>
              <Link href={`/ar/products/${productId}/bom` as Route}>محرّر BOM</Link>
            </Button>
          )}
          {canManage && (
            <Button variant="outline" asChild>
              <Link href={`/ar/products/${productId}/quality-checklist` as Route}>قالب فحص الجودة</Link>
            </Button>
          )}
          {canManage && (
            <Button asChild>
              <Link href={`/ar/products/${productId}/edit` as Route}>
                <Edit className="ml-2 h-4 w-4" />
                تعديل
              </Link>
            </Button>
          )}
        </div>
      </div>

      {routing && <ProductRoutingSummaryCards routing={routing} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="معلومات المنتج">
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow label="المادة" value={product.plasticMaterialName} />
            <InfoRow label="اللون" value={product.colorName} />
            <InfoRow label="الوزن (غ)" value={product.productWeight} />
            <InfoRow label="زمن الدورة (ث)" value={product.standardCycleTime} />
            <InfoRow label="الهدف/ساعة" value={product.targetOutputPerHour} />
            <InfoRow label="الأبعاد" value={product.dimensions} />
            <InfoRow label="التصنيف" value={product.categoryName} />
            <InfoRow label="الباركود" value={product.barcode} />
            <InfoRow label="وضع التصنيع" value={manufacturingModeLabels[mode]} />
          </div>
        </SectionCard>

        <SectionCard title="متطلبات الجودة (منتج)">
          {product.qualitySpec ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow label="تسامح الوزن" value={product.qualitySpec.weightTolerance} />
              <InfoRow
                label="اختبار ضغط"
                value={product.qualitySpec.pressureTestRequired ? "نعم" : "لا"}
              />
              <InfoRow
                label="اختبار تسرب"
                value={product.qualitySpec.leakTestRequired ? "نعم" : "لا"}
              />
              <InfoRow
                label="فحص بصري"
                value={product.qualitySpec.visualInspectionRequired ? "نعم" : "لا"}
              />
              <InfoRow label="ملاحظات QC" value={product.qualitySpec.qcNotes} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">لم تُعرّف مواصفات جودة على مستوى المنتج</p>
          )}
        </SectionCard>
      </div>

      {/* Production Routing Visualization */}
      {routing && (
        <SectionCard
          title="مسار الإنتاج — مخطط العمليات"
          action={
            canManage ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/ar/products/${productId}/routing` as Route}>إدارة المسار</Link>
              </Button>
            ) : undefined
          }
        >
          <ProductRoutingFlow routing={routing} />
        </SectionCard>
      )}

      {/* BOM Structure */}
      <SectionCard
        title="BOM — قائمة المواد"
        action={
          canManage ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/ar/products/${productId}/bom` as Route}>محرّر BOM</Link>
            </Button>
          ) : undefined
        }
      >
        {product.bom?.length ? (
          <ul className="space-y-2 text-sm">
            {product.bom.map((b) => (
              <li
                key={b.id ?? b.materialProductId}
                className="flex justify-between border-b border-border/40 py-2"
              >
                <span>
                  {b.materialProductCode ?? b.childProductCode} —{" "}
                  {b.materialProductName ?? b.childProductName}
                  {b.componentType && (
                    <Badge variant="outline" className="mr-2">
                      {b.componentType}
                    </Badge>
                  )}
                </span>
                <span>
                  {b.quantity} {b.unitName ?? ""}{" "}
                  {b.wastePercentage ? `(+${b.wastePercentage}% هدر)` : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">لا توجد مواد — يمكن إضافة BOM حتى للمنتجات المصنّعة</p>
        )}
      </SectionCard>

      {/* Manufacturing Operations */}
      <SectionCard title="عمليات التصنيع">
        {manufacturingOps.length ? (
          <div className="space-y-3">
            {manufacturingOps.map((op) => (
              <div key={op.id} className="rounded border border-border/50 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {op.sequenceOrder}. {op.operationName}
                  </span>
                  <Badge variant="outline">{operationTypeLabels[op.operationType]}</Badge>
                  {op.machineCode && <Badge variant="secondary">{op.machineCode}</Badge>}
                  {op.moldCode && <Badge variant="secondary">{op.moldCode}</Badge>}
                  {op.qcRequired && <Badge>QC</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{op.operationCode}</p>
                {op.materialConsumptions?.length ? (
                  <ul className="mt-2 text-xs text-muted-foreground">
                    {op.materialConsumptions.map((m) => (
                      <li key={m.id ?? m.materialProductId}>
                        استهلاك: {m.materialProductCode} × {m.plannedQuantity}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">لا عمليات — أضفها من مسار الإنتاج</p>
        )}
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Assigned Machines */}
        <SectionCard title="الماكينات المخصصة">
          {assignedMachines.length ? (
            <ul className="space-y-2 text-sm">
              {assignedMachines.map((m) => (
                <li key={m.machineId} className="flex justify-between border-b border-border/40 py-2">
                  <span>
                    {m.machineCode} — {m.machineName}
                  </span>
                  <span className="text-muted-foreground">{m.operationIds.length} عملية</span>
                </li>
              ))}
            </ul>
          ) : product.machineSettings?.length ? (
            <ul className="space-y-2 text-sm">
              {product.machineSettings.map((s) => (
                <li key={s.id ?? s.machineId} className="text-muted-foreground">
                  {s.machineCode} — {s.machineName}{" "}
                  <Badge variant="outline" className="mr-1">
                    قديم
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">لا ماكينات مخصصة</p>
          )}
        </SectionCard>

        {/* Assigned Molds */}
        <SectionCard title="القوالب المخصصة">
          {assignedMolds.length ? (
            <ul className="space-y-2 text-sm">
              {assignedMolds.map((m) => (
                <li key={m.moldId} className="flex justify-between border-b border-border/40 py-2">
                  <Link href={`/ar/molds/${m.moldId}` as Route} className="text-primary hover:underline">
                    {m.moldCode} — {m.moldName}
                  </Link>
                  <span className="text-muted-foreground">{m.operationIds.length} عملية</span>
                </li>
              ))}
            </ul>
          ) : product.molds?.length ? (
            <ul className="space-y-2 text-sm">
              {product.molds.map((m) => (
                <li key={m.id ?? m.moldId}>
                  <Link href={`/ar/molds/${m.moldId}` as Route} className="text-primary hover:underline">
                    {m.moldCode} — {m.moldName}
                  </Link>{" "}
                  <Badge variant="outline">قديم</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">لا قوالب مخصصة</p>
          )}
        </SectionCard>
      </div>

      {/* Machine Parameters */}
      <SectionCard title="معاملات الماكينة">
        {machineParams.length ? (
          <div className="space-y-3">
            {machineParams.map((p, idx) => (
              <div key={`${p.operationId}-${p.machineId}-${idx}`} className="rounded border border-border/40 p-3 text-sm">
                <p className="font-medium">
                  {p.operationName} — {p.machineCode}
                </p>
                <p className="text-muted-foreground">
                  حقن: {p.injectionPressure ?? "—"} · holding: {p.holdingPressure ?? "—"} · تبريد:{" "}
                  {p.coolingTime ?? "—"} · قالب: {p.moldTemperature ?? "—"} · shot:{" "}
                  {p.shotWeight ?? "—"}
                </p>
                {p.setupNotes && <p className="mt-1 text-xs text-muted-foreground">{p.setupNotes}</p>}
              </div>
            ))}
          </div>
        ) : product.machineSettings?.length ? (
          <div className="space-y-2 text-sm">
            {product.machineSettings.map((s) => (
              <div key={s.id ?? s.machineId} className="rounded border border-border/40 p-2">
                <p className="font-medium">
                  {s.machineCode} — {s.machineName}{" "}
                  <Badge variant="outline">قديم</Badge>
                </p>
                <p className="text-muted-foreground">
                  دورة: {s.cycleTime ?? "—"}ث · حقن: {s.injectionPressure ?? "—"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">لا معاملات — تُعرّف ضمن عمليات التصنيع</p>
        )}
      </SectionCard>

      {/* QC Specifications */}
      <SectionCard title="مواصفات QC (عمليات)">
        {qcSpecs.length ? (
          <ul className="space-y-2 text-sm">
            {qcSpecs.map((q, idx) => (
              <li key={`${q.operationId}-${q.inspectionType}-${idx}`} className="border-b border-border/40 py-2">
                <span className="font-medium">{q.operationName}</span> — {q.inspectionType}:{" "}
                {q.toleranceMin ?? "—"} – {q.toleranceMax ?? "—"}
                {q.inspectionFrequency && (
                  <span className="text-muted-foreground"> ({q.inspectionFrequency})</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">لا مواصفات QC على مستوى العمليات</p>
        )}
      </SectionCard>

      {/* Packaging Operations */}
      <SectionCard title="عمليات التغليف والتعبئة">
        {packagingOps.length ? (
          <ul className="space-y-2 text-sm">
            {packagingOps.map((op) => (
              <li key={op.id} className="flex justify-between border-b border-border/40 py-2">
                <span>
                  {op.sequenceOrder}. {op.operationName}
                </span>
                <Badge variant="outline">{operationTypeLabels[op.operationType]}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">لا عمليات تغليف</p>
        )}
      </SectionCard>

      {canManage && (
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="معرض الصور">
            <ProductImageUploader productId={productId} images={images} onChange={setImages} />
          </SectionCard>
          <SectionCard title="المستندات">
            <ProductDocumentUploader
              productId={productId}
              documents={documents}
              onChange={setDocuments}
            />
          </SectionCard>
        </div>
      )}
    </div>
  );
}
