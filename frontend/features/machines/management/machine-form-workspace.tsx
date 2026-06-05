"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  detailToFormValues,
  MachineForm
} from "@/features/machines/management/machine-form";
import {
  machinesApi,
  MachinesApiError,
  type MachinePayload,
  type MachineTypeJson
} from "@/lib/api/machines-client";

export function MachineFormWorkspace({ machineId }: { machineId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(machineId);

  const [types, setTypes] = useState<MachineTypeJson[]>([]);
  const [initial, setInitial] = useState<ReturnType<typeof detailToFormValues> | undefined>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const typesRes = await machinesApi.listTypes({ isActive: true });
        setTypes(typesRes.data);
        if (machineId) {
          const m = await machinesApi.show(machineId);
          setInitial(detailToFormValues(m.data));
        }
        setError(null);
      } catch (e) {
        setError(e instanceof MachinesApiError ? e.message : "تعذر التحميل");
      } finally {
        setLoading(false);
      }
    })();
  }, [machineId]);

  const onSubmit = async (payload: MachinePayload) => {
    setBusy(true);
    setError(null);
    try {
      if (isEdit && machineId) {
        await machinesApi.update(machineId, payload);
        router.push(`/ar/machines/${machineId}` as Route);
      } else {
        const res = await machinesApi.create(payload);
        router.push(`/ar/machines/${res.data.id}` as Route);
      }
    } catch (e) {
      setError(e instanceof MachinesApiError ? e.message : "فشل الحفظ");
      setBusy(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">جاري التحميل…</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{isEdit ? "تعديل ماكينة" : "إضافة ماكينة"}</h1>
        <Button variant="outline" asChild>
          <Link href={"/ar/machines/registry" as Route}>رجوع للسجل</Link>
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <MachineForm
        types={types}
        initial={initial}
        onSubmit={onSubmit}
        busy={busy}
        submitLabel={isEdit ? "حفظ التعديلات" : "إنشاء الماكينة"}
      />
    </div>
  );
}
