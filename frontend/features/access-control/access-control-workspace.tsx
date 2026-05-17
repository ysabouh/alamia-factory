"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { Shield } from "lucide-react";

import {
  WfmPageHeader,
  WfmTable,
  WfmTableBody,
  WfmTableCell,
  WfmTableHead,
  WfmTableHeader,
  WfmTableRow
} from "@/components/workforce/atlas";
import { Button } from "@/components/ui/button";
import { useFactoryAuth } from "@/contexts/factory-auth-context";
import { usersApi, type SystemUserJson } from "@/lib/api/users-client";

import { permissionLabel, roleLabel } from "./permission-labels";
import { CurrentUserPermissionsPanel } from "./current-user-permissions-panel";

export function AccessControlWorkspace() {
  const { can } = useFactoryAuth();
  const canManage = can("users.manage");
  const [users, setUsers] = React.useState<SystemUserJson[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!canManage) {
      setLoading(false);
      return;
    }
    void usersApi
      .list({ pageSize: 100 })
      .then((res) => setUsers(res.data ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "تعذر التحميل"))
      .finally(() => setLoading(false));
  }, [canManage]);

  return (
    <div className="space-y-6" dir="rtl">
      <WfmPageHeader
        kicker="الصلاحيات · Access Control"
        title="المستخدمون والصلاحيات"
        description="ربط حسابات الدخول بالموظفين وأدوار Spatie"
        icon={<Shield className="h-3.5 w-3.5 text-atlas-brand" aria-hidden />}
        actions={
          <Button variant="atlasOutline" asChild>
            <Link href={"/ar/workforce/employees" as Route}>سجل العاملين</Link>
          </Button>
        }
      />

      <CurrentUserPermissionsPanel />

      {!canManage ? (
        <div className="rounded-sm border border-atlas-warning/40 bg-atlas-warning/10 p-6 text-sm text-atlas-ink">
          <p className="font-semibold">عرض فقط</p>
          <p className="mt-2 text-atlas-muted">
            إدارة المستخدمين تتطلب <span className="font-mono text-xs">users.manage</span>. يمكنك رؤية صلاحياتك
            أعلاه.
          </p>
        </div>
      ) : loading ? (
        <p className="text-sm text-atlas-muted">جاري التحميل…</p>
      ) : error ? (
        <p className="rounded-sm border border-atlas-danger/35 bg-atlas-danger/10 px-4 py-3 text-sm text-atlas-danger">
          {error}
        </p>
      ) : users.length === 0 ? (
        <p className="rounded-sm border border-atlas-rule bg-atlas-paper px-4 py-8 text-center text-sm text-atlas-muted">
          لا يوجد مستخدمون في النظام.
        </p>
      ) : (
        <WfmTable>
          <WfmTableHeader>
            <WfmTableRow>
              <WfmTableHead>المستخدم</WfmTableHead>
              <WfmTableHead>الموظف</WfmTableHead>
              <WfmTableHead>الأدوار</WfmTableHead>
              <WfmTableHead>صلاحيات</WfmTableHead>
            </WfmTableRow>
          </WfmTableHeader>
          <WfmTableBody>
            {users.map((u) => {
              const roles = u.roles ?? [];
              const permissions = u.permissions ?? [];
              return (
                <WfmTableRow key={u.id}>
                  <WfmTableCell>
                    <p className="font-medium text-atlas-ink">{u.name}</p>
                    <p className="font-mono text-xs text-atlas-muted">{u.email}</p>
                  </WfmTableCell>
                  <WfmTableCell>
                    {u.employee ? (
                      <Link
                        href={`/ar/workforce/employees/${u.employee.id}` as Route}
                        className="text-atlas-brand hover:underline"
                      >
                        {u.employee.fullName}
                      </Link>
                    ) : (
                      <span className="text-atlas-muted">—</span>
                    )}
                  </WfmTableCell>
                  <WfmTableCell>
                    <div className="flex flex-wrap gap-1">
                      {roles.map((r) => (
                        <span
                          key={r}
                          className="rounded-sm bg-atlas-brand/15 px-1.5 py-0.5 text-[10px] font-medium text-atlas-brand"
                        >
                          {roleLabel(r)}
                        </span>
                      ))}
                    </div>
                  </WfmTableCell>
                  <WfmTableCell className="text-xs text-atlas-muted">{permissions.length} صلاحية</WfmTableCell>
                </WfmTableRow>
              );
            })}
          </WfmTableBody>
        </WfmTable>
      )}

      {canManage && users.length > 0 ? (
        <details className="rounded-sm border border-atlas-rule bg-atlas-paper p-4 shadow-atlasCard">
          <summary className="cursor-pointer text-sm font-semibold text-atlas-ink">
            تفاصيل الصلاحيات لكل مستخدم
          </summary>
          <div className="mt-4 space-y-4">
            {users.map((u) => {
              const permissions = u.permissions ?? [];
              return (
                <div key={u.id} className="rounded-sm border border-atlas-rule bg-atlas-canvas p-3">
                  <p className="text-sm font-medium text-atlas-ink">{u.email}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {permissions.map((p) => (
                      <span
                        key={p}
                        className="rounded-sm border border-atlas-rule bg-atlas-paper px-1.5 py-0.5 text-[10px] text-atlas-slate"
                      >
                        {permissionLabel(p)}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      ) : null}
    </div>
  );
}
