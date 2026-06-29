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
  type MachineImageJson,
  type MachinePayload,
  type MachineTypeJson
} from "@/lib/api/machines-client";

export function MachineFormWorkspace({ machineId }: { machineId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(machineId);

  const [types, setTypes] = useState<MachineTypeJson[]>([]);
  const [initial, setInitial] = useState<ReturnType<typeof detailToFormValues> | undefined>();
  const [images, setImages] = useState<MachineImageJson[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMachine = async (id: string) => {
    const m = await machinesApi.show(id);
    setInitial(detailToFormValues(m.data));
    setImages(m.data.images ?? []);
    setImageUrl(m.data.imageUrl);
  };

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const typesRes = await machinesApi.listTypes({ isActive: true });
        setTypes(typesRes.data);
        if (machineId) {
          await loadMachine(machineId);
        } else {
          setInitial(undefined);
          setImages([]);
          setImageUrl(null);
          setPendingImageFile(null);
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
        if (pendingImageFile) {
          await machinesApi.uploadImage(machineId, pendingImageFile, { isPrimary: true });
        }
        router.push(`/ar/machines/${machineId}` as Route);
      } else {
        const res = await machinesApi.create(payload);
        if (pendingImageFile) {
          await machinesApi.uploadImage(res.data.id, pendingImageFile, { isPrimary: true });
        }
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
        machineId={machineId}
        images={images}
        imageUrl={imageUrl}
        pendingImageFile={pendingImageFile}
        onPendingImageFileChange={setPendingImageFile}
        onImagesChange={() => machineId && void loadMachine(machineId)}
        onSubmit={onSubmit}
        busy={busy}
        submitLabel={isEdit ? "حفظ التعديلات" : "إنشاء الماكينة"}
      />
    </div>
  );
}
