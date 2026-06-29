"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Eye,
  GitBranch,
  Layers,
  Plus,
  Search,
  Workflow
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  WfmTable,
  WfmTableBody,
  WfmTableCell,
  WfmTableHead,
  WfmTableHeader,
  WfmTableRow
} from "@/components/workforce/atlas";
import { useFactoryAuth } from "@/contexts/factory-auth-context";
import {
  matchesTemplateCategory,
  matchesTemplateFilter,
  matchesTemplateSearch,
  readinessBadgeVariant,
  summarizeTemplates,
  templateCategoryLabel,
  templatePriorityLabel,
  templateReadinessLabel,
  type TemplateListFilter
} from "@/features/workflow/templates/workflow-template-list-utils";
import { getTemplateReadiness } from "@/features/workflow/templates/workflow-template-status";
import { WorkflowTemplatesKpiStrip } from "@/features/workflow/templates/workflow-templates-kpi-strip";
import { WorkflowApiError, workflowApi, type WorkflowTemplateJson } from "@/lib/api/workflow-client";

function TemplateNameCell({ template }: { template: WorkflowTemplateJson }) {
  return (
    <div className="min-w-[200px] max-w-[280px] space-y-1 py-0.5">
      <p className="font-mono text-[11px] font-bold text-atlas-brand">{template.code}</p>
      <p className="text-sm font-semibold leading-snug text-atlas-ink dark:text-zinc-100">{template.name}</p>
      {template.description ? (
        <p className="line-clamp-2 text-xs leading-snug text-atlas-muted">{template.description}</p>
      ) : null}
    </div>
  );
}

function VersionCell({ template }: { template: WorkflowTemplateJson }) {
  if (!template.publishedVersion) {
    return (
      <div className="min-w-[100px]">
        <p className="text-sm text-atlas-muted">—</p>
        <p className="mt-0.5 text-[11px] text-amber-600">لم يُنشر بعد</p>
      </div>
    );
  }

  const stageCount = template.publishedVersion.stages?.length;

  return (
    <div className="min-w-[100px]">
      <p className="text-sm font-bold text-atlas-ink dark:text-zinc-100">v{template.publishedVersion.version}</p>
      {stageCount != null ? (
        <p className="mt-0.5 text-[11px] text-atlas-muted">
          {stageCount} {stageCount === 1 ? "مرحلة" : "مراحل"}
        </p>
      ) : null}
    </div>
  );
}

export function WorkflowTemplatesRegistry() {
  const router = useRouter();
  const { can } = useFactoryAuth();
  const canView = can("workflow.templates.view") || can("workflow.templates.manage");
  const canManage = can("workflow.templates.manage");

  const [rows, setRows] = useState<WorkflowTemplateJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TemplateListFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const load = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      setError("ليس لديك صلاحية عرض القوالب. تأكد من صلاحية workflow.templates.view أو workflow.templates.manage");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await workflowApi.listTemplates({ pageSize: 100 });
      setRows(res.data);
    } catch (e) {
      setRows([]);
      setError(e instanceof WorkflowApiError ? e.message : "تعذّر تحميل القوالب");
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => summarizeTemplates(rows), [rows]);

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(rows.map((r) => r.category).filter(Boolean)))],
    [rows]
  );

  const filteredRows = useMemo(
    () =>
      rows.filter(
        (r) =>
          matchesTemplateFilter(r, statusFilter) &&
          matchesTemplateCategory(r, categoryFilter) &&
          matchesTemplateSearch(r, search)
      ),
    [rows, statusFilter, categoryFilter, search]
  );

  return (
    <div className="space-y-5 p-4 md:p-6 dark:bg-zinc-950">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-atlas-brand/10 text-atlas-brand">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-atlas-ink dark:text-zinc-100">قوالب سير العمل</h1>
                <p className="text-sm text-atlas-muted">تصميم وإدارة قوالب BPM قابلة لإعادة الاستخدام</p>
              </div>
            </div>
          </div>
          {canManage ? (
            <Link href="/ar/workflow/templates/new" className="atlas-btn-primary inline-flex items-center gap-2 text-sm">
              <Plus className="h-4 w-4" />
              قالب جديد
            </Link>
          ) : null}
        </div>

        <WorkflowTemplatesKpiStrip
          summary={summary}
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <div className="rounded-xl border border-atlas-rule bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-atlas-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالرمز، الاسم، التصنيف، أو الوصف..."
              className="ps-9"
            />
          </div>
          {categories.length > 2 ? (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    categoryFilter === cat
                      ? "bg-atlas-brand text-white shadow-sm"
                      : "bg-atlas-canvas text-atlas-muted hover:bg-atlas-brand/10 hover:text-atlas-brand dark:bg-zinc-800"
                  }`}
                >
                  {cat === "all" ? "كل التصنيفات" : templateCategoryLabel(cat)}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <WfmTable>
        <WfmTableHeader>
          <WfmTableRow>
            <WfmTableHead className="min-w-[220px]">القالب</WfmTableHead>
            <WfmTableHead>التصنيف</WfmTableHead>
            <WfmTableHead>النسخة المنشورة</WfmTableHead>
            <WfmTableHead>الأولوية</WfmTableHead>
            <WfmTableHead>الحالة</WfmTableHead>
            <WfmTableHead className="text-end">إجراء</WfmTableHead>
          </WfmTableRow>
        </WfmTableHeader>
        <WfmTableBody>
          {loading ? (
            <WfmTableRow>
              <WfmTableCell colSpan={6} className="py-14 text-center text-atlas-muted">
                جاري تحميل القوالب...
              </WfmTableCell>
            </WfmTableRow>
          ) : filteredRows.length === 0 ? (
            <WfmTableRow>
              <WfmTableCell colSpan={6} className="py-14 text-center">
                <GitBranch className="mx-auto mb-3 h-10 w-10 text-atlas-muted opacity-60" />
                <p className="font-medium text-atlas-ink dark:text-zinc-200">
                  {rows.length === 0 ? "لا توجد قوالب بعد" : "لا توجد نتائج مطابقة للبحث"}
                </p>
                <p className="mt-1 text-sm text-atlas-muted">
                  {rows.length === 0
                    ? "أنشئ أول قالب لسير عمل قابل لإعادة الاستخدام"
                    : "جرّب تغيير كلمات البحث أو الفلاتر"}
                </p>
                {rows.length === 0 && canManage ? (
                  <Link
                    href="/ar/workflow/templates/new"
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-atlas-brand hover:underline"
                  >
                    <Plus className="h-4 w-4" />
                    إنشاء قالب جديد
                  </Link>
                ) : null}
              </WfmTableCell>
            </WfmTableRow>
          ) : (
            filteredRows.map((template) => {
              const readiness = getTemplateReadiness(template);
              return (
                <WfmTableRow
                  key={template.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/ar/workflow/templates/${template.id}`)}
                >
                  <WfmTableCell>
                    <TemplateNameCell template={template} />
                  </WfmTableCell>
                  <WfmTableCell>
                    <Badge variant="outline">{templateCategoryLabel(template.category)}</Badge>
                    {template.department?.name ? (
                      <p className="mt-1 text-[11px] text-atlas-muted">{template.department.name}</p>
                    ) : null}
                  </WfmTableCell>
                  <WfmTableCell>
                    <VersionCell template={template} />
                  </WfmTableCell>
                  <WfmTableCell>
                    <span className="text-sm">{templatePriorityLabel(template.defaultPriority)}</span>
                  </WfmTableCell>
                  <WfmTableCell>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant={template.isActive ? "info" : "secondary"}>
                        {template.isActive ? "نشط" : "غير نشط"}
                      </Badge>
                      <Badge variant={readinessBadgeVariant(readiness)}>{templateReadinessLabel(template)}</Badge>
                    </div>
                  </WfmTableCell>
                  <WfmTableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Link
                        href={`/ar/workflow/templates/${template.id}`}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-atlas-brand transition hover:bg-atlas-brand/10"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        عرض
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                      {canManage ? (
                        <Link
                          href={`/ar/workflow/templates/${template.id}/designer`}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-atlas-brand transition hover:bg-atlas-brand/10"
                        >
                          <Workflow className="h-3.5 w-3.5" />
                          مصمم
                        </Link>
                      ) : null}
                    </div>
                  </WfmTableCell>
                </WfmTableRow>
              );
            })
          )}
        </WfmTableBody>
      </WfmTable>

      {!loading && filteredRows.length > 0 ? (
        <p className="text-center text-xs text-atlas-muted">
          عرض {filteredRows.length} من {rows.length} قالب
        </p>
      ) : null}
    </div>
  );
}
