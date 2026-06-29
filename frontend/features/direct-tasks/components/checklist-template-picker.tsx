"use client";

import { useEffect, useState } from "react";
import { FileStack } from "lucide-react";

import { directTasksApi, type ChecklistTemplateJson } from "@/lib/api/direct-tasks-client";

type Props = {
  onApply: (items: ChecklistTemplateJson["items"]) => void;
};

export function ChecklistTemplatePicker({ onApply }: Props) {
  const [templates, setTemplates] = useState<ChecklistTemplateJson[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void directTasksApi.checklistTemplates().then((res) => setTemplates(res.data));
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="atlas-btn-secondary inline-flex items-center gap-1 text-xs"
      >
        <FileStack className="h-3.5 w-3.5" />
        اختيار قالب
      </button>
      {open ? (
        <div className="absolute end-0 z-20 mt-1 min-w-[220px] rounded-lg border border-atlas-rule bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              className="block w-full px-3 py-2 text-start text-sm hover:bg-atlas-canvas dark:hover:bg-zinc-800"
              onClick={() => {
                onApply(t.items);
                setOpen(false);
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
