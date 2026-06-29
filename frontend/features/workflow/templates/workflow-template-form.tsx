"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { workflowApi } from "@/lib/api/workflow-client";

export function WorkflowTemplateFormWorkspace() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("custom");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const t = await workflowApi.createTemplate({ code, name, category });
      const versionId = t.versions?.[0]?.id ?? t.publishedVersion?.id;
      router.push(versionId ? `/ar/workflow/templates/${t.id}/designer` : `/ar/workflow/templates`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل الإنشاء");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg p-6 dark:bg-zinc-950">
      <h1 className="mb-4 text-xl font-bold">قالب سير عمل جديد</h1>
      <form onSubmit={submit} className="space-y-4 rounded-lg border border-atlas-border bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <div>
          <label className="text-xs text-atlas-muted">الرمز</label>
          <input className="atlas-input mt-1 w-full" value={code} onChange={(e) => setCode(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs text-atlas-muted">الاسم</label>
          <input className="atlas-input mt-1 w-full" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs text-atlas-muted">التصنيف</label>
          <select className="atlas-input mt-1 w-full" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="production">الإنتاج</option>
            <option value="maintenance">الصيانة</option>
            <option value="quality">الجودة</option>
            <option value="purchasing">المشتريات</option>
            <option value="warehouse">المستودعات</option>
            <option value="hr">الموارد البشرية</option>
            <option value="administration">الإدارة</option>
            <option value="custom">مخصص</option>
          </select>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button type="submit" disabled={saving} className="atlas-btn-primary w-full">
          {saving ? "جاري الإنشاء..." : "إنشاء والانتقال للمصمم"}
        </button>
      </form>
    </div>
  );
}
