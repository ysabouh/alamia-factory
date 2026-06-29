"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useFactoryAuth } from "@/contexts/factory-auth-context";
import { CreateDirectTaskForm } from "@/features/direct-tasks/create/create-direct-task-form";
import { CreateDirectTaskHeader } from "@/features/direct-tasks/create/create-direct-task-header";
import { CreateDirectTaskSidebar } from "@/features/direct-tasks/create/create-direct-task-sidebar";
import { CreateDirectTaskStickyActions } from "@/features/direct-tasks/create/create-direct-task-sticky-actions";
import { useCreateDirectTaskForm } from "@/features/direct-tasks/create/use-create-direct-task-form";

export function CreateDirectTaskWorkspace() {
  const router = useRouter();
  const { can } = useFactoryAuth();
  const canCreate = can("direct_tasks.create");
  const {
    values,
    patch,
    errors,
    saving,
    draftLoading,
    pendingFiles,
    setPendingFiles,
    saveDraftNow,
    submit,
    validate
  } = useCreateDirectTaskForm();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canCreate) {
    return <p className="p-6 text-atlas-muted">ليس لديك صلاحية إنشاء مهام مباشرة.</p>;
  }

  if (draftLoading) {
    return <p className="p-6 text-atlas-muted">جاري تحميل المسودة...</p>;
  }

  const handleCreate = async () => {
    setError(null);
    try {
      const task = await submit();
      router.push(`/ar/workflow/direct-tasks/${task.id}`);
    } catch (e) {
      if (e instanceof Error && e.message === "validation") {
        setError("يرجى تصحيح الحقول المطلوبة قبل الإنشاء");
      } else {
        setError(e instanceof Error ? e.message : "فشل إنشاء المهمة");
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col dark:bg-zinc-950">
      <CreateDirectTaskHeader saving={saving} onSaveDraft={() => void saveDraftNow()} onCreate={() => void handleCreate()} />

      {error ? (
        <p className="mx-4 mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 md:mx-6">{error}</p>
      ) : null}

      <div className="flex-1 px-4 py-5 md:px-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <CreateDirectTaskForm
            values={values}
            errors={errors}
            pendingFiles={pendingFiles}
            onPatch={patch}
            onFilesChange={setPendingFiles}
          />
          <CreateDirectTaskSidebar
            values={values}
            attachmentCount={pendingFiles.length}
            onPatch={patch}
          />
        </div>
      </div>

      <CreateDirectTaskStickyActions
        saving={saving}
        onCancel={() => router.push("/ar/workflow/direct-tasks")}
        onSaveDraft={() => void saveDraftNow()}
        onPreview={() => setPreviewOpen(true)}
        onCreate={() => void handleCreate()}
      />

      {previewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setPreviewOpen(false)}>
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-bold">معاينة المهمة</h2>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-atlas-muted">العنوان</dt><dd className="font-semibold">{values.title || "—"}</dd></div>
              <div><dt className="text-atlas-muted">الوصف</dt><dd className="whitespace-pre-wrap">{values.description || "—"}</dd></div>
              <div><dt className="text-atlas-muted">المسؤولون</dt><dd>{values.assignments.map((a) => a.label).join("، ") || "—"}</dd></div>
              <div><dt className="text-atlas-muted">بنود القائمة</dt><dd>{values.checklist.length}</dd></div>
            </dl>
            <button type="button" className="atlas-btn-primary mt-6 w-full" onClick={() => setPreviewOpen(false)}>
              إغلاق
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
