"use client";

import Link from "next/link";
import type { Route } from "next";

import { cn } from "@/lib/utils";
import { buildEmployeeAttendanceReportHref } from "@/lib/attendance/payroll-weeks";

import type { OrgChartEmployeeNode } from "./org-chart-types";

export type ContextMenuState = {
  x: number;
  y: number;
  employee: OrgChartEmployeeNode;
} | null;

export function OrgChartContextMenu({
  menu,
  onClose,
  canManage,
  onChangeManager,
  onChangePosition
}: {
  menu: ContextMenuState;
  onClose: () => void;
  canManage: boolean;
  onChangeManager?: (employee: OrgChartEmployeeNode) => void;
  onChangePosition?: (employee: OrgChartEmployeeNode) => void;
}) {
  if (!menu) return null;
  const emp = menu.employee;
  const id = emp.id;

  const items: { label: string; href?: Route; onClick?: () => void; separator?: boolean }[] = [
    ...(canManage && onChangeManager
      ? [
          {
            label: "تغيير المدير المباشر",
            onClick: () => onChangeManager(emp)
          }
        ]
      : []),
    ...(canManage && onChangePosition && emp.departmentId
      ? [
          {
            label: "تعيين المنصب التنظيمي",
            onClick: () => onChangePosition(emp)
          }
        ]
      : []),
    { label: "عرض الملف", href: `/ar/workforce/employees/${id}` as Route },
    ...(canManage ? [{ label: "تعديل الموظف", href: `/ar/workforce/employees/${id}/edit` as Route }] : []),
    {
      label: "الحضور",
      href: buildEmployeeAttendanceReportHref(id) as Route
    },
    {
      label: "الأداء",
      href: `/ar/workforce/employees/${id}#performance` as Route
    },
    {
      label: "تكليفات الإنتاج",
      href: `/ar/production/orders?workerId=${id}` as Route
    }
  ];

  return (
    <>
      <div className="fixed inset-0 z-[100]" onClick={onClose} onContextMenu={(e) => e.preventDefault()} />
      <div
        className="fixed z-[101] min-w-[220px] rounded-sm border border-atlas-rule bg-atlas-paper py-1 shadow-atlasCard"
        style={{ left: menu.x, top: menu.y }}
      >
        <p className="border-b border-atlas-rule px-3 py-2 text-xs font-semibold text-atlas-ink">
          {emp.fullName}
        </p>
        {emp.managerName ? (
          <p className="border-b border-atlas-rule px-3 py-1.5 text-[11px] text-atlas-muted">
            المدير: {emp.managerName}
          </p>
        ) : null}
        {items.map((item) =>
          item.href ? (
            <Link
              key={item.label}
              href={item.href}
              className="block px-3 py-2 text-sm text-atlas-ink hover:bg-atlas-surface"
              onClick={onClose}
            >
              {item.label}
            </Link>
          ) : (
            <button
              key={item.label}
              type="button"
              className={cn(
                "block w-full px-3 py-2 text-start text-sm hover:bg-atlas-surface",
                item.label === "تغيير المدير المباشر" || item.label === "تعيين المنصب التنظيمي"
                  ? "font-medium text-atlas-brand"
                  : "text-atlas-ink"
              )}
              onClick={() => {
                item.onClick?.();
                onClose();
              }}
            >
              {item.label}
            </button>
          )
        )}
      </div>
    </>
  );
}
