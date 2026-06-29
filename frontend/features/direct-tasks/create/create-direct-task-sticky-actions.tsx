"use client";

import { Eye, Save, X } from "lucide-react";

type Props = {
  saving: boolean;
  onCancel: () => void;
  onSaveDraft: () => void;
  onPreview: () => void;
  onCreate: () => void;
};

export function CreateDirectTaskStickyActions({ saving, onCancel, onSaveDraft, onPreview, onCreate }: Props) {
  return (
    <div className="sticky bottom-0 z-30 border-t border-atlas-rule bg-white/95 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onCancel} className="atlas-btn-secondary inline-flex items-center gap-1 text-sm">
          <X className="h-4 w-4" />
          إلغاء
        </button>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={saving} onClick={onSaveDraft} className="atlas-btn-secondary inline-flex items-center gap-1 text-sm">
            <Save className="h-4 w-4" />
            حفظ مسودة
          </button>
          <button type="button" onClick={onPreview} className="atlas-btn-secondary inline-flex items-center gap-1 text-sm">
            <Eye className="h-4 w-4" />
            معاينة
          </button>
          <button type="button" disabled={saving} onClick={onCreate} className="atlas-btn-primary text-sm">
            {saving ? "جاري الإنشاء..." : "إنشاء المهمة"}
          </button>
        </div>
      </div>
    </div>
  );
}
