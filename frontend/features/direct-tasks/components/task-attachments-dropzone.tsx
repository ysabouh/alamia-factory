"use client";

import { useCallback, useState } from "react";
import { CloudUpload, FileIcon, X } from "lucide-react";

type Props = {
  files: File[];
  onChange: (files: File[]) => void;
  maxBytes?: number;
};

const DEFAULT_MAX = 10 * 1024 * 1024;

export function TaskAttachmentsDropzone({ files, onChange, maxBytes = DEFAULT_MAX }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback(
    (list: FileList | File[]) => {
      const incoming = Array.from(list);
      const valid: File[] = [];
      for (const f of incoming) {
        if (f.size > maxBytes) {
          setError(`الملف ${f.name} يتجاوز الحد المسموح`);
          continue;
        }
        valid.push(f);
      }
      if (valid.length) onChange([...files, ...valid]);
    },
    [files, maxBytes, onChange]
  );

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragOver ? "border-atlas-brand bg-atlas-brand/5" : "border-atlas-rule bg-atlas-canvas/30 dark:border-zinc-700"
        }`}
      >
        <CloudUpload className="mb-3 h-10 w-10 text-atlas-muted" />
        <p className="text-sm font-medium text-atlas-ink dark:text-zinc-200">اسحب الملفات هنا أو انقر للاختيار</p>
        <p className="mt-1 text-xs text-atlas-muted">PDF، JPG، PNG، Excel، فيديو — حد أقصى {Math.round(maxBytes / 1024 / 1024)}MB</p>
        <label className="mt-4 cursor-pointer text-sm font-semibold text-atlas-brand hover:underline">
          اختيار ملفات
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
        </label>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between rounded-lg border border-atlas-rule px-3 py-2 text-sm dark:border-zinc-700">
              <span className="flex items-center gap-2">
                <FileIcon className="h-4 w-4 text-atlas-muted" />
                {f.name}
              </span>
              <button type="button" onClick={() => onChange(files.filter((_, idx) => idx !== i))}>
                <X className="h-4 w-4 text-atlas-muted hover:text-red-500" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
