"use client";

import { ShieldCheck } from "lucide-react";

import { useFactoryAuth } from "@/contexts/factory-auth-context";

import { permissionLabel, roleLabel } from "./permission-labels";

export function CurrentUserPermissionsPanel() {
  const { user, can } = useFactoryAuth();
  if (!user) return null;

  const roles = user.roles ?? [];
  const permissions = user.permissions ?? [];
  const canEditEmployees = can("workforce.manage_employees");

  return (
    <section className="rounded-sm border border-atlas-brand/25 bg-atlas-brandSoft/50 p-5 shadow-atlasCard" dir="rtl">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-atlas-brand" aria-hidden />
        <div>
          <h2 className="text-sm font-bold text-atlas-ink">جلسة الدخول الحالية</h2>
          <p className="text-xs text-atlas-muted">
            {user.name} · <span className="font-mono">{user.email}</span>
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {roles.length === 0 ? (
          <span className="text-xs text-atlas-muted">لا أدوار مرتبطة</span>
        ) : (
          roles.map((r) => (
            <span key={r} className="rounded-sm bg-atlas-brand/15 px-2 py-0.5 text-xs font-medium text-atlas-brand">
              {roleLabel(r)}
            </span>
          ))
        )}
      </div>

      <p className="mt-3 text-xs text-atlas-muted">
        تعديل الموظفين:{" "}
        {canEditEmployees ? (
          <span className="font-semibold text-atlas-success">مسموح</span>
        ) : (
          <span className="font-semibold text-atlas-danger">غير مسموح — تحتاج workforce.manage_employees</span>
        )}
      </p>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-medium text-atlas-brand">
          عرض كل الصلاحيات ({permissions.length})
        </summary>
        <div className="mt-2 flex flex-wrap gap-1">
          {permissions.map((p) => (
            <span
              key={p}
              title={p}
              className="rounded-sm border border-atlas-rule bg-atlas-paper px-1.5 py-0.5 text-[10px] text-atlas-slate"
            >
              {permissionLabel(p)}
            </span>
          ))}
        </div>
      </details>
    </section>
  );
}
