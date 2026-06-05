"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { detailToFormValues, MoldForm } from "@/features/molds/management/mold-form";
import { machinesApi, MachinesApiError, type MachineJson } from "@/lib/api/machines-client";
import { moldsApi, MoldsApiError, type MoldPayload, type ProductJson } from "@/lib/api/molds-client";

export function MoldFormWorkspace({ moldId }: { moldId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(moldId);

  const [products, setProducts] = useState<ProductJson[]>([]);
  const [machines, setMachines] = useState<MachineJson[]>([]);
  const [initial, setInitial] = useState<ReturnType<typeof detailToFormValues> | undefined>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [productsRes, machinesRes] = await Promise.all([
          moldsApi.listProducts(),
          machinesApi.list({ pageSize: 100, isActive: true })
        ]);
        setProducts(productsRes.data);
        setMachines(machinesRes.data);
        if (moldId) {
          const m = await moldsApi.show(moldId);
          setInitial(detailToFormValues(m.data));
        }
        setError(null);
      } catch (e) {
        if (e instanceof MoldsApiError || e instanceof MachinesApiError) {
          setError(e.message);
        } else if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("تعذر التحميل");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [moldId]);

  const onSubmit = async (payload: MoldPayload) => {
    setBusy(true);
    setError(null);
    try {
      if (isEdit && moldId) {
        await moldsApi.update(moldId, payload);
        router.push(`/ar/molds/${moldId}` as Route);
      } else {
        const res = await moldsApi.create(payload);
        router.push(`/ar/molds/${res.data.id}` as Route);
      }
    } catch (e) {
      setError(e instanceof MoldsApiError ? e.message : "فشل الحفظ");
      setBusy(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">جاري التحميل…</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{isEdit ? "تعديل قالب" : "إضافة قالب"}</h1>
        <Button variant="outline" asChild>
          <Link href={"/ar/molds/registry" as Route}>رجوع للسجل</Link>
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <MoldForm
        products={products}
        machines={machines}
        initial={initial}
        onSubmit={onSubmit}
        busy={busy}
        submitLabel={isEdit ? "حفظ التعديلات" : "إنشاء القالب"}
      />
    </div>
  );
}
