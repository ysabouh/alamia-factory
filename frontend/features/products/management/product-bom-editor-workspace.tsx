"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WfmField, WfmInput, WfmSelect } from "@/components/workforce/atlas";
import { BomTreeView } from "@/features/products/management/bom-tree-view";
import { assemblyApi, AssemblyApiError, type BomComponentType } from "@/lib/api/assembly-client";
import { productsApi, ProductsApiError } from "@/lib/api/products-client";

const COMPONENT_TYPES: { value: BomComponentType; label: string }[] = [
  { value: "component", label: "مكوّن" },
  { value: "subassembly", label: "تجميع فرعي" },
  { value: "packaging", label: "تغليف" },
  { value: "raw_material", label: "مادة خام" },
  { value: "consumable", label: "مستهلكات" }
];

export function ProductBomEditorWorkspace({ productId }: { productId: string }) {
  const [productName, setProductName] = useState("");
  const [tree, setTree] = useState<Awaited<ReturnType<typeof assemblyApi.bomTree>>["data"]["tree"]>([]);
  const [costRollup, setCostRollup] = useState<{ rolledUpCost: number } | undefined>();
  const [components, setComponents] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [childProductId, setChildProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [componentType, setComponentType] = useState<BomComponentType>("component");
  const [wastePercentage, setWastePercentage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [productRes, treeRes, listRes] = await Promise.all([
        productsApi.show(productId),
        assemblyApi.bomTree(productId),
        productsApi.list({ pageSize: 100 })
      ]);
      setProductName(productRes.data.productNameAr);
      setTree(treeRes.data.tree);
      setCostRollup(treeRes.data.costRollup);
      setComponents(
        listRes.data
          .filter((p) => p.id !== productId)
          .map((p) => ({ id: p.id, code: p.productCode, name: p.productNameAr }))
      );
      setError(null);
    } catch (e) {
      setError(e instanceof AssemblyApiError || e instanceof ProductsApiError ? e.message : "تعذر التحميل");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  const addLine = async () => {
    if (!childProductId) return;
    setBusy(true);
    setError(null);
    try {
      await assemblyApi.addBomLine(productId, {
        childProductId,
        quantity: Number(quantity) || 1,
        componentType,
        wastePercentage: wastePercentage ? Number(wastePercentage) : undefined
      });
      setChildProductId("");
      setQuantity("1");
      await load();
    } catch (e) {
      setError(e instanceof AssemblyApiError ? e.message : "فشل الإضافة");
    } finally {
      setBusy(false);
    }
  };

  const removeLine = async (lineId: string) => {
    setBusy(true);
    try {
      await assemblyApi.deleteBomLine(lineId);
      await load();
    } catch {
      setError("تعذر الحذف");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="text-muted-foreground">جاري التحميل…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">محرّر BOM — {productName}</h1>
          <p className="text-sm text-muted-foreground">هيكل تجميع متعدد المستويات</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/ar/products/${productId}` as Route}>تفاصيل المنتج</Link>
        </Button>
      </div>

      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">إضافة مكوّن</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-5">
          <WfmField label="المنتج المكوّن" className="sm:col-span-2">
            <WfmSelect value={childProductId} onChange={(e) => setChildProductId(e.target.value)}>
              <option value="">اختر</option>
              {components.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </WfmSelect>
          </WfmField>
          <WfmField label="الكمية">
            <WfmInput type="number" min={0.0001} step="0.0001" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </WfmField>
          <WfmField label="نوع المكوّن">
            <WfmSelect value={componentType} onChange={(e) => setComponentType(e.target.value as BomComponentType)}>
              {COMPONENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </WfmSelect>
          </WfmField>
          <WfmField label="هدر %">
            <WfmInput type="number" min={0} max={100} value={wastePercentage} onChange={(e) => setWastePercentage(e.target.value)} />
          </WfmField>
          <Button type="button" disabled={busy} onClick={() => void addLine()} className="self-end">
            <Plus className="ml-2 h-4 w-4" />
            إضافة
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">شجرة BOM</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <BomTreeView tree={tree} costRollup={costRollup} />
          <div className="mt-4 space-y-1 border-t border-border/40 pt-3">
            {tree.map((node) => (
              <div key={node.id} className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{node.childProductCode}</span>
                <Button type="button" size="icon" variant="ghost" disabled={busy} onClick={() => void removeLine(node.id!)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
