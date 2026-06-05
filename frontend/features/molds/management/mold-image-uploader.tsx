"use client";

import { useCallback, useState } from "react";
import { Upload, X, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WfmSelect } from "@/components/workforce/atlas";
import { cn } from "@/lib/utils";
import {
  MOLD_IMAGE_TYPES,
  moldsApi,
  type MoldImageJson,
  type MoldImageType
} from "@/lib/api/molds-client";

const imageTypeLabel = (t: string | null) =>
  MOLD_IMAGE_TYPES.find((x) => x.value === t)?.label ?? t ?? "صورة";

export function MoldImageUploader({
  moldId,
  images,
  onChange,
  canManage
}: {
  moldId: string;
  images: MoldImageJson[];
  onChange: () => void;
  canManage: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<MoldImageType>("photo");

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!canManage) return;
      setBusy(true);
      setError(null);
      try {
        const list = Array.from(files);
        for (let i = 0; i < list.length; i++) {
          await moldsApi.uploadImage(moldId, list[i], {
            imageType: uploadType,
            isPrimary: uploadType === "photo" && images.length === 0 && i === 0
          });
        }
        onChange();
      } catch {
        setError("فشل رفع الصورة");
      } finally {
        setBusy(false);
      }
    },
    [canManage, images.length, moldId, onChange, uploadType]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) void uploadFiles(e.dataTransfer.files);
  };

  const grouped = MOLD_IMAGE_TYPES.map((t) => ({
    ...t,
    items: images.filter((img) => (img.imageType ?? "photo") === t.value)
  }));

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[180px]">
            <p className="mb-1 text-xs text-muted-foreground">نوع الصورة</p>
            <WfmSelect value={uploadType} onChange={(e) => setUploadType(e.target.value as MoldImageType)}>
              {MOLD_IMAGE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </WfmSelect>
          </div>
        </div>
      )}

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
          <p className="text-sm text-muted-foreground">اسحب الصور هنا — {imageTypeLabel(uploadType)}</p>
          <label className="mt-2 cursor-pointer">
            <span className="text-sm font-medium text-primary">اختر ملفات</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              disabled={busy}
              onChange={(e) => e.target.files && void uploadFiles(e.target.files)}
            />
          </label>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {grouped.map((group) =>
        group.items.length > 0 ? (
          <div key={group.value} className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{group.label}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((img) => (
                <div key={img.id} className="group relative overflow-hidden rounded-lg border border-border/50 bg-card/30">
                  <div className="relative aspect-video bg-muted/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2">
                    {img.isPrimary ? (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        رئيسية
                      </span>
                    ) : canManage && group.value === "photo" ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => void moldsApi.setPrimaryImage(img.id).then(onChange)}
                      >
                        تعيين رئيسية
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">{imageTypeLabel(img.imageType)}</span>
                    )}
                    {canManage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive"
                        onClick={() => {
                          if (window.confirm("حذف هذه الصورة؟")) {
                            void moldsApi.deleteImage(img.id).then(onChange);
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
          </div>
        ) : null
      )}

      {images.length === 0 && !canManage && (
        <p className="text-sm text-muted-foreground">لا صور مرفوعة.</p>
      )}
    </div>
  );
}
