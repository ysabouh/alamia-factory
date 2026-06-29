"use client";

import { useRouter } from "next/navigation";
import { Check, Save, X } from "lucide-react";

type Props = {
  saving: boolean;
  onSaveDraft: () => void;
  onCreate: () => void;
};

export function CreateDirectTaskHeader({ saving, onSaveDraft, onCreate }: Props) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 border-b border-atlas-rule bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-atlas-muted hover:bg-atlas-canvas dark:hover:bg-zinc-800"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-atlas-ink dark:text-zinc-100">إنشاء مهمة جديدة</h1>
            <p className="text-xs text-atlas-muted sm:text-sm">
              أنشئ مهمة مباشرة أو دورية وقم بإسنادها للموظفين ومتابعة دورة حياتها
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={onSaveDraft}
            className="atlas-btn-secondary hidden items-center gap-1 text-sm sm:inline-flex"
          >
            <Save className="h-4 w-4" />
            حفظ كمسودة
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onCreate}
            className="atlas-btn-primary inline-flex items-center gap-1 text-sm"
          >
            <Check className="h-4 w-4" />
            {saving ? "جاري الحفظ..." : "إنشاء المهمة"}
          </button>
        </div>
      </div>
    </header>
  );
}
