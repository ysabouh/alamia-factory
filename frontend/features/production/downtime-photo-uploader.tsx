"use client";

import { useCallback, useRef, useState } from "react";
import { ImageIcon, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  productionApi,
  ProductionApiError,
  type MachineDowntimePhotoJson
} from "@/lib/api/production-client";
import { resolveMediaUrl } from "@/lib/api/resolve-media-url";

type Props = {
  downtimeId: string;
  photos: MachineDowntimePhotoJson[];
  onChange: (photos: MachineDowntimePhotoJson[]) => void;
  disabled?: boolean;
};

function previewUrl(photo: MachineDowntimePhotoJson) {
  const base = resolveMediaUrl(photo.filePath);
  if (!base) return "";
  const v = photo.uploadedAt ? encodeURIComponent(photo.uploadedAt) : photo.id;
  return `${base}${base.includes("?") ? "&" : "?"}v=${v}`;
}

export function DowntimePhotoUploader({ downtimeId, photos, onChange, disabled }: Props) {
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replacingPhotoId, setReplacingPhotoId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (files: FileList | null) => {
      if (!files?.length || disabled) return;
      setBusy(true);
      setError(null);
      try {
        const next = [...photos];
        for (const file of Array.from(files)) {
          const res = await productionApi.uploadDowntimePhoto(downtimeId, file);
          next.push(res.data);
        }
        onChange(next);
      } catch (e) {
        setError(e instanceof ProductionApiError ? e.message : "فشل رفع الصورة");
      } finally {
        setBusy(false);
        if (uploadInputRef.current) uploadInputRef.current.value = "";
      }
    },
    [disabled, downtimeId, onChange, photos]
  );

  const replace = useCallback(
    async (photoId: string, files: FileList | null) => {
      const file = files?.[0];
      if (!file || disabled) return;
      setBusy(true);
      setError(null);
      try {
        const res = await productionApi.replaceDowntimePhoto(photoId, file);
        onChange(photos.map((p) => (p.id === photoId ? res.data : p)));
      } catch (e) {
        setError(e instanceof ProductionApiError ? e.message : "فشل استبدال الصورة");
      } finally {
        setBusy(false);
        setReplacingPhotoId(null);
        if (replaceInputRef.current) replaceInputRef.current.value = "";
      }
    },
    [disabled, onChange, photos]
  );

  const remove = async (photoId: string) => {
    if (disabled || busy) return;
    if (!window.confirm("حذف هذه الصورة؟")) return;
    setBusy(true);
    setError(null);
    try {
      await productionApi.deleteDowntimePhoto(photoId);
      onChange(photos.filter((p) => p.id !== photoId));
    } catch (e) {
      const msg = e instanceof ProductionApiError ? e.message : "فشل الحذف";
      setError(msg.includes("No query results") ? "الصورة غير موجودة أو حُذفت مسبقاً" : msg);
    } finally {
      setBusy(false);
    }
  };

  const startReplace = (photoId: string) => {
    if (disabled || busy) return;
    setReplacingPhotoId(photoId);
    replaceInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">صور العطل</p>
        {!disabled ? (
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => uploadInputRef.current?.click()}>
            <ImageIcon className="ml-1 h-4 w-4" />
            رفع صورة
          </Button>
        ) : null}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">معاينة</TableHead>
            <TableHead>اسم الملف</TableHead>
            <TableHead>تاريخ الرفع</TableHead>
            {!disabled ? <TableHead className="w-28 text-center">إجراءات</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {photos.length ? (
            photos.map((photo) => (
              <TableRow key={photo.id}>
                <TableCell>
                  <a href={previewUrl(photo)} target="_blank" rel="noreferrer">
                    <img
                      src={previewUrl(photo)}
                      alt={photo.fileName}
                      className="h-14 w-14 rounded border border-border object-cover"
                    />
                  </a>
                </TableCell>
                <TableCell>{photo.fileName ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {photo.uploadedAt ? new Date(photo.uploadedAt).toLocaleString("ar") : "—"}
                </TableCell>
                {!disabled ? (
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={busy}
                        title="استبدال الصورة"
                        onClick={() => startReplace(photo.id)}
                      >
                        <Pencil className="h-4 w-4 text-primary" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={busy}
                        title="حذف الصورة"
                        onClick={() => void remove(photo.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={disabled ? 3 : 4} className="text-center text-muted-foreground">
                لا توجد صور — اضغط «رفع صورة»
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => void upload(e.target.files)}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (replacingPhotoId) void replace(replacingPhotoId, e.target.files);
        }}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {busy ? (
        <p className="text-xs text-muted-foreground">
          {replacingPhotoId ? "جاري استبدال الصورة…" : "جاري الرفع…"}
        </p>
      ) : null}
    </div>
  );
}

export async function uploadDowntimePhotos(downtimeId: string, files: File[]) {
  for (const file of files) {
    await productionApi.uploadDowntimePhoto(downtimeId, file);
  }
}
