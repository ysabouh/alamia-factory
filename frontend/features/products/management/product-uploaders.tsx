"use client";

import { useCallback, useRef, useState } from "react";
import { FileText, ImagePlus, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  productsApi,
  ProductsApiError,
  type ProductDetailJson,
  type ProductDocumentJson,
  type ProductImageJson,
  type ProductImageType
} from "@/lib/api/products-client";

const IMAGE_TYPES: { value: ProductImageType; label: string }[] = [
  { value: "main", label: "رئيسية" },
  { value: "technical", label: "فنية" },
  { value: "packaging", label: "تغليف" },
  { value: "marketing", label: "تسويق" },
  { value: "drawing", label: "رسم" }
];

export function ProductImageUploader({
  productId,
  images,
  onChange
}: {
  productId: string;
  images: ProductImageJson[];
  onChange: (images: ProductImageJson[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [imageType, setImageType] = useState<ProductImageType>("main");
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      setBusy(true);
      setError(null);
      try {
        let next = [...images];
        for (const file of Array.from(files)) {
          const res = await productsApi.uploadImage(productId, file, imageType, next.length === 0);
          next = [...next.filter((i) => i.id !== res.data.id), res.data];
        }
        onChange(next);
      } catch (e) {
        setError(e instanceof ProductsApiError ? e.message : "فشل رفع الصورة");
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [imageType, images, onChange, productId]
  );

  const remove = async (id: string) => {
    setBusy(true);
    try {
      await productsApi.deleteImage(id);
      onChange(images.filter((i) => i.id !== id));
    } catch {
      setError("تعذر حذف الصورة");
    } finally {
      setBusy(false);
    }
  };

  const setPrimary = async (id: string) => {
    setBusy(true);
    try {
      const res = await productsApi.setPrimaryImage(id);
      onChange(images.map((i) => ({ ...i, isPrimary: i.id === res.data.id })));
    } catch {
      setError("تعذر تعيين الصورة الرئيسية");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/10 p-8 transition hover:bg-muted/20"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void upload(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">اسحب الصور أو انقر للرفع</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void upload(e.target.files)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm text-muted-foreground">نوع الصورة:</label>
        <select
          className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          value={imageType}
          onChange={(e) => setImageType(e.target.value as ProductImageType)}
        >
          {IMAGE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {busy && <span className="text-xs text-muted-foreground">جاري الرفع…</span>}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((img) => (
          <div key={img.id} className="relative overflow-hidden rounded-lg border border-border/60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.imageUrl} alt="" className="aspect-video w-full object-cover" />
            <div className="flex items-center justify-between gap-2 p-2 text-xs">
              <span>{img.imageType}</span>
              <div className="flex gap-1">
                {!img.isPrimary && (
                  <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void setPrimary(img.id)}>
                    رئيسية
                  </Button>
                )}
                {img.isPrimary && <span className="text-primary">★ رئيسية</span>}
                <Button type="button" size="icon" variant="ghost" disabled={busy} onClick={() => void remove(img.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {!images.length && (
          <div className="col-span-full flex items-center gap-2 text-sm text-muted-foreground">
            <ImagePlus className="h-4 w-4" />
            لا توجد صور بعد
          </div>
        )}
      </div>
    </div>
  );
}

export function ProductDocumentUploader({
  productId,
  documents,
  onChange
}: {
  productId: string;
  documents: ProductDocumentJson[];
  onChange: (docs: ProductDocumentJson[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [docName, setDocName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const upload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !docName.trim()) {
      setError("أدخل اسم المستند واختر ملفاً");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await productsApi.uploadDocument(productId, file, docName.trim(), "pdf");
      onChange([...documents, res.data]);
      setDocName("");
    } catch (e) {
      setError(e instanceof ProductsApiError ? e.message : "فشل رفع المستند");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          className="min-w-[200px] flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="اسم المستند"
          value={docName}
          onChange={(e) => setDocName(e.target.value)}
        />
        <Button type="button" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
          <Upload className="ml-2 h-4 w-4" />
          رفع PDF / ملف
        </Button>
        <input ref={inputRef} type="file" className="hidden" onChange={(e) => void upload(e.target.files)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <ul className="space-y-2">
        {documents.map((d) => (
          <li key={d.id} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {d.documentName}
            </span>
            <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
              فتح
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export type { ProductDetailJson };
