"use client";

import { useEffect, useState } from "react";
import { ImageIcon, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MachineImageUploader } from "@/features/machines/management/machine-image-uploader";
import { resolveMediaUrl } from "@/lib/api/resolve-media-url";
import { cn } from "@/lib/utils";
import type { MachineImageJson } from "@/lib/api/machines-client";

export function MachineFormImageField({
  machineId,
  images,
  imageUrl,
  pendingFile,
  onPendingFileChange,
  onImagesChange,
  disabled
}: {
  machineId?: string;
  images?: MachineImageJson[];
  imageUrl?: string | null;
  pendingFile: File | null;
  onPendingFileChange: (file: File | null) => void;
  onImagesChange?: () => void;
  disabled?: boolean;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  if (machineId) {
    return (
      <MachineImageUploader
        machineId={machineId}
        images={images ?? []}
        canManage={!disabled}
        onChange={() => onImagesChange?.()}
      />
    );
  }

  const existingPreview = imageUrl?.trim() ? resolveMediaUrl(imageUrl) : "";

  const pickFile = (file: File | null) => {
    if (!file || disabled) return;
    if (!file.type.startsWith("image/")) return;
    onPendingFileChange(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) pickFile(file);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border/60 bg-card/20",
          disabled && "pointer-events-none opacity-60"
        )}
      >
        <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">اسحب صورة الماكينة هنا (اختياري)</p>
        <label className="mt-2 cursor-pointer">
          <span className="text-sm font-medium text-primary">اختر ملفاً</span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={disabled}
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      {previewUrl ? (
        <div className="relative mx-auto max-w-xs overflow-hidden rounded-lg border border-border/50 bg-card/30">
          <div className="relative aspect-video bg-muted/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="flex items-center justify-between gap-2 p-2">
            <span className="text-xs text-muted-foreground">سيتم رفعها بعد إنشاء الماكينة</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive"
              disabled={disabled}
              onClick={() => onPendingFileChange(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : existingPreview ? (
        <div className="relative mx-auto max-w-xs overflow-hidden rounded-lg border border-border/50 bg-card/30">
          <div className="relative aspect-video bg-muted/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={existingPreview} alt="" className="h-full w-full object-cover" />
          </div>
          <p className="p-2 text-center text-xs text-muted-foreground">الصورة الحالية — اختر ملفاً جديداً لاستبدالها بعد الحفظ</p>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <ImageIcon className="h-4 w-4" />
          لا صورة محددة
        </div>
      )}
    </div>
  );
}
