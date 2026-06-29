"use client";

import Link from "next/link";
import { ArrowRight, GitBranch } from "lucide-react";

export function WorkflowInstanceHeader() {
  return (
    <header className="border-b border-atlas-rule bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-3 px-4 py-3 md:px-6">
        <Link
          href="/ar/workflow/instances"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-atlas-muted transition hover:bg-atlas-canvas hover:text-atlas-ink dark:hover:bg-zinc-800"
          aria-label="العودة إلى التنفيذات"
        >
          <ArrowRight className="h-5 w-5" />
        </Link>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-atlas-canvas text-atlas-brand dark:bg-zinc-800">
          <GitBranch className="h-4 w-4" strokeWidth={2.25} />
        </div>

        <h1 className="truncate text-base font-bold text-atlas-ink dark:text-zinc-100 md:text-lg">
          تفاصيل سير العمل
        </h1>
      </div>
    </header>
  );
}
