"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, ChevronDown, ChevronLeft, Loader2, Plus, Settings2, Trash2 } from "lucide-react";

import { WfmInput, WfmSelect } from "@/components/workforce/atlas";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { workforceApi } from "@/lib/api/workforce-client";
import {
  workforceMastersApi,
  type DepartmentMaster,
  type HallMaster
} from "@/lib/api/workforce-masters-client";

import type {
  DepartmentOrgPositionJson,
  DepartmentTreeNode,
  FactoryOrgSettings
} from "./org-chart/org-chart-types";
import {
  departmentFormFromRow,
  departmentFormToPayload,
  DepartmentForm,
  emptyDepartmentForm,
  validateDepartmentForm
} from "@/features/workforce/masters/forms/department-form";

import { DepartmentEmployeesPanel } from "./factory-org/department-employees-panel";
import type { OrgChartEmployeeNode } from "./org-chart/org-chart-types";

function DeptTreeRow({
  node,
  depth,
  selectedId,
  onSelect
}: {
  node: DepartmentTreeNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(depth < 2);
  const hasKids = (node.children?.length ?? 0) > 0;
  const active = selectedId === node.id;

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        className={cn(
          "flex w-full items-center gap-1 rounded-sm px-2 py-1.5 text-start text-sm transition-colors",
          active ? "bg-atlas-brand/15 font-medium text-atlas-brand" : "text-atlas-ink hover:bg-atlas-surface"
        )}
        style={{ paddingInlineStart: `${8 + depth * 16}px` }}
      >
        {hasKids ? (
          <span
            role="button"
            tabIndex={0}
            className="shrink-0 rounded p-0.5 hover:bg-atlas-paper"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.stopPropagation();
                setOpen((v) => !v);
              }
            }}
          >
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </span>
        ) : (
          <span className="w-4" />
        )}
        <Building2 className="h-3.5 w-3.5 shrink-0 opacity-60" />
        <div className="min-w-0 flex-1">
          <span className="block truncate">{node.name}</span>
          {node.managerName ? (
            <span className="block truncate text-[10px] text-atlas-muted">مدير: {node.managerName}</span>
          ) : null}
        </div>
        <span className="font-mono text-[10px] text-atlas-muted">{node.code}</span>
        {node.isLeaf ? (
          <span className="ms-auto rounded bg-emerald-500/10 px-1 text-[10px] text-emerald-700">نهائي</span>
        ) : null}
      </button>
      {open && hasKids
        ? node.children!.map((c) => (
            <DeptTreeRow key={c.id} node={c} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
          ))
        : null}
    </div>
  );
}

function flattenDeptTree(nodes: DepartmentTreeNode[], excludeId?: string): { id: string; label: string; depth: number }[] {
  const out: { id: string; label: string; depth: number }[] = [];
  const walk = (list: DepartmentTreeNode[], depth: number) => {
    for (const n of list) {
      if (n.id !== excludeId) {
        out.push({ id: n.id, label: `${"—".repeat(depth)} ${n.name} (${n.code})`, depth });
      }
      if (n.children?.length) walk(n.children, depth + 1);
    }
  };
  walk(nodes, 0);
  return out;
}

export function FactoryOrgWorkspace({
  canManage,
  canAssignEmployees = false
}: {
  canManage: boolean;
  canAssignEmployees?: boolean;
}) {
  const [tree, setTree] = useState<DepartmentTreeNode[]>([]);
  const [halls, setHalls] = useState<HallMaster[]>([]);
  const [employees, setEmployees] = useState<{ id: string; fullName: string }[]>([]);
  const [orgEmployees, setOrgEmployees] = useState<OrgChartEmployeeNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [positions, setPositions] = useState<DepartmentOrgPositionJson[]>([]);
  const [isLeaf, setIsLeaf] = useState(false);
  const [factorySettings, setFactorySettings] = useState<FactoryOrgSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deptForm, setDeptForm] = useState(emptyDepartmentForm());
  const [showNewDept, setShowNewDept] = useState(false);
  const [posForm, setPosForm] = useState({ name: "", code: "", vacancyCount: 0 });
  const [busy, setBusy] = useState(false);

  const selectedNode = findNode(tree, selectedId);
  const deptEmployees = useMemo(
    () => (selectedId ? orgEmployees.filter((e) => e.departmentId === selectedId) : []),
    [orgEmployees, selectedId]
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, h, fs, org] = await Promise.all([
        workforceMastersApi.getDepartmentTree(),
        workforceMastersApi.listHallsForSelect(),
        workforceApi.getFactoryOrgSettings(),
        workforceApi.getOrgChart()
      ]);
      setTree(t);
      setHalls(h);
      setFactorySettings(fs.data);
      setEmployees(
        org.data.employees.map((e) => ({ id: e.id, fullName: e.fullName }))
      );
      setOrgEmployees(org.data.employees);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل التحميل");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!selectedId) {
      setPositions([]);
      setIsLeaf(false);
      return;
    }
    void (async () => {
      try {
        const res = await workforceMastersApi.listOrgPositions(selectedId);
        setPositions(res.data);
        setIsLeaf(res.meta.isLeaf);
        const show = await workforceMastersApi.list<DepartmentMaster>("departments", { pageSize: 100 });
        const row = show.data.find((d) => d.id === selectedId);
        if (row) setDeptForm(departmentFormFromRow(row));
      } catch {
        setPositions([]);
      }
    })();
  }, [selectedId]);

  const parentOptions = flattenDeptTree(tree, showNewDept ? undefined : selectedId ?? undefined);

  async function saveDept() {
    if (!canManage) return;
    const validationError = validateDepartmentForm(deptForm);
    if (validationError) {
      setError(validationError);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload = {
        ...departmentFormToPayload(deptForm),
        parentId: deptForm.parentId || null
      };
      if (showNewDept) {
        await workforceMastersApi.create("departments", payload);
        setShowNewDept(false);
      } else if (selectedId) {
        await workforceMastersApi.update("departments", selectedId, payload);
      }
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الحفظ");
    } finally {
      setBusy(false);
    }
  }

  async function addPosition() {
    if (!selectedId || !canManage || !isLeaf) return;
    setBusy(true);
    try {
      await workforceMastersApi.createOrgPosition(selectedId, {
        name: posForm.name.trim(),
        code: posForm.code.trim(),
        vacancyCount: posForm.vacancyCount
      });
      setPosForm({ name: "", code: "", vacancyCount: 0 });
      const res = await workforceMastersApi.listOrgPositions(selectedId);
      setPositions(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل إضافة المنصب");
    } finally {
      setBusy(false);
    }
  }

  async function removePosition(posId: string) {
    if (!selectedId || !canManage) return;
    setBusy(true);
    try {
      await workforceMastersApi.deleteOrgPosition(selectedId, posId);
      const res = await workforceMastersApi.listOrgPositions(selectedId);
      setPositions(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الحذف");
    } finally {
      setBusy(false);
    }
  }

  async function saveFactorySettings() {
    if (!factorySettings || !canManage) return;
    setBusy(true);
    try {
      const res = await workforceApi.updateFactoryOrgSettings(factorySettings);
      setFactorySettings(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل حفظ الإعدادات");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-atlas-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
        جاري تحميل هيكل المصنع…
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="rounded-sm border border-atlas-rule bg-atlas-paper p-3">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-atlas-ink">شجرة الأقسام</h3>
          {canManage ? (
            <Button
              type="button"
              size="sm"
              variant="atlasOutline"
              className="h-7 gap-1 rounded-sm text-xs"
              onClick={() => {
                setShowNewDept(true);
                setSelectedId(null);
                setDeptForm({ ...emptyDepartmentForm(), parentId: "" });
              }}
            >
              <Plus className="h-3 w-3" />
              قسم
            </Button>
          ) : null}
        </div>
        <div className="max-h-[480px] overflow-y-auto">
          {tree.map((n) => (
            <DeptTreeRow key={n.id} node={n} depth={0} selectedId={selectedId} onSelect={(id) => { setShowNewDept(false); setSelectedId(id); }} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {error ? <div className="rounded-sm border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div> : null}

        <div className="rounded-sm border border-atlas-rule bg-atlas-paper p-4">
          <div className="mb-3 flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-atlas-brand" />
            <h3 className="text-sm font-semibold">إعدادات المصنع</h3>
          </div>
          {factorySettings ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs text-atlas-muted sm:col-span-2">
                اسم المصنع في الهيكل
                <WfmInput
                  className="mt-1 w-full"
                  value={factorySettings.title}
                  disabled={!canManage}
                  onChange={(e) => setFactorySettings({ ...factorySettings, title: e.target.value })}
                />
              </label>
              <label className="block text-xs text-atlas-muted sm:col-span-2">
                المدير العام
                <WfmSelect
                  className="mt-1 w-full"
                  value={factorySettings.generalManagerEmployeeId ?? ""}
                  disabled={!canManage}
                  onChange={(e) =>
                    setFactorySettings({
                      ...factorySettings,
                      generalManagerEmployeeId: e.target.value || null
                    })
                  }
                >
                  <option value="">— غير معيّن —</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName}
                    </option>
                  ))}
                </WfmSelect>
              </label>
              {canManage ? (
                <Button type="button" variant="atlasPrimary" className="rounded-sm sm:col-span-2" disabled={busy} onClick={() => void saveFactorySettings()}>
                  حفظ الإعدادات
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        {(selectedId || showNewDept) ? (
          <div className="rounded-sm border border-atlas-rule bg-atlas-paper p-4">
            <h3 className="mb-3 text-sm font-semibold">{showNewDept ? "قسم جديد" : `تعديل: ${selectedNode?.name ?? ""}`}</h3>
            <label className="mb-3 block text-xs text-atlas-muted">
              القسم الأب
              <WfmSelect
                className="mt-1 w-full"
                value={deptForm.parentId ?? ""}
                disabled={!canManage}
                onChange={(e) => setDeptForm({ ...deptForm, parentId: e.target.value })}
              >
                <option value="">— قسم رئيسي (تحت المدير العام) —</option>
                {parentOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </WfmSelect>
            </label>
            <DepartmentForm values={deptForm} onChange={setDeptForm} halls={halls} disabled={!canManage} />
            {canManage ? (
              <Button type="button" variant="atlasPrimary" className="mt-4 rounded-sm" disabled={busy} onClick={() => void saveDept()}>
                حفظ القسم
              </Button>
            ) : null}
          </div>
        ) : null}

        {selectedId && isLeaf ? (
          <div className="rounded-sm border border-atlas-rule bg-atlas-paper p-4">
            <h3 className="mb-3 text-sm font-semibold">المناصب التنظيمية (قسم نهائي)</h3>
            <ul className="mb-4 space-y-2">
              {positions.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-sm border border-atlas-rule px-3 py-2 text-sm">
                  <span>
                    {p.name} <span className="font-mono text-xs text-atlas-muted">({p.code})</span>
                  </span>
                  {canManage ? (
                    <button type="button" className="text-red-600 hover:text-red-800" onClick={() => void removePosition(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </li>
              ))}
              {positions.length === 0 ? <p className="text-sm text-atlas-muted">لا توجد مناصب بعد.</p> : null}
            </ul>
            {canManage ? (
              <div className="grid gap-2 sm:grid-cols-3">
                <WfmInput placeholder="اسم المنصب" value={posForm.name} onChange={(e) => setPosForm({ ...posForm, name: e.target.value })} />
                <WfmInput placeholder="الرمز" value={posForm.code} onChange={(e) => setPosForm({ ...posForm, code: e.target.value.toUpperCase() })} />
                <Button type="button" variant="atlasOutline" className="rounded-sm gap-1" disabled={busy} onClick={() => void addPosition()}>
                  <Plus className="h-4 w-4" />
                  إضافة منصب
                </Button>
              </div>
            ) : null}
          </div>
        ) : selectedId ? (
          <p className="rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            المناصب التنظيمية تُضاف فقط في الأقسام النهائية (بدون أقسام فرعية نشطة).
          </p>
        ) : null}

        {selectedId && !showNewDept ? (
          <DepartmentEmployeesPanel
            departmentId={selectedId}
            departmentName={selectedNode?.name ?? ""}
            isLeaf={isLeaf}
            positions={positions}
            employees={deptEmployees}
            canAssign={canAssignEmployees}
            onChanged={reload}
          />
        ) : null}
      </div>
    </div>
  );
}

function findNode(nodes: DepartmentTreeNode[], id: string | null): DepartmentTreeNode | null {
  if (!id) return null;
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNode(n.children ?? [], id);
    if (found) return found;
  }
  return null;
}
