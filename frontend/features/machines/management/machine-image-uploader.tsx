"use client";

import { useCallback, useState } from "react";
import { Star, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { resolveMediaUrl } from "@/lib/api/resolve-media-url";
import { cn } from "@/lib/utils";
import { machinesApi, MachinesApiError, type MachineImageJson } from "@/lib/api/machines-client";

export function MachineImageUploader({
  machineId,
  images,
  onChange,
  canManage
}: {
  machineId: string;
  images: MachineImageJson[];
  onChange: () => void;
  canManage: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!canManage) return;
      setBusy(true);
      setError(null);
      try {
        const list = Array.from(files);
        for (let i = 0; i < list.length; i++) {
          await machinesApi.uploadImage(machineId, list[i], {
            isPrimary: images.length === 0 && i === 0
          });
        }
        onChange();
      } catch (e) {
        setError(e instanceof MachinesApiError ? e.message : "فشل رفع الصورة");
      } finally {
        setBusy(false);
      }
    },
    [canManage, images.length, machineId, onChange]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) void uploadFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors",
            dragging ? "border-primary bg-primary/5" : "border-border/60 bg-card/20"
          )}
        >
          <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">اسحب صورة الماكينة هنا</p>
          <label className="mt-2 cursor-pointer">
            <span className="text-sm font-medium text-primary">اختر ملفاً</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={busy}
              onChange={(e) => e.target.files && void uploadFiles(e.target.files)}
            />
          </label>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {images.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img) => (
            <div key={img.id} className="group relative overflow-hidden rounded-lg border border-border/50 bg-card/30">
              <div className="relative aspect-video bg-muted/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resolveMediaUrl(img.imageUrl)} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="flex items-center justify-between gap-2 p-2">
                {img.isPrimary ? (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    رئيسية
                  </span>
                ) : canManage ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => void machinesApi.setPrimaryImage(img.id).then(onChange)}
                  >
                    تعيين رئيسية
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">صورة</span>
                )}
                {canManage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive"
                    onClick={() => {
                      if (window.confirm("حذف هذه الصورة؟")) {
                        void machinesApi.deleteImage(img.id).then(onChange);
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !canManage && <p className="text-sm text-muted-foreground">لا صورة مرفوعة.</p>
      )}
    </div>
  );
}
