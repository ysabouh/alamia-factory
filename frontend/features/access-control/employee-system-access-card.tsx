"use client";

import * as React from "react";
import { KeyRound, Link2, Shield, Unlink, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { IndustrialInput, IndustrialSelect } from "@/components/smart-factory";
import { useFactoryAuth } from "@/contexts/factory-auth-context";
import { systemUserToEmployeePatch, UsersApiError, usersApi, type SystemUserJson } from "@/lib/api/users-client";
import type { ManagedEmployee } from "@/features/workforce/employee-management/model";

import { permissionLabel, roleLabel } from "./permission-labels";

type LinkMode = "create" | "existing";

export function EmployeeSystemAccessCard({
  employee,
  onUpdated
}: {
  employee: ManagedEmployee;
  onUpdated?: (patch: Partial<ManagedEmployee>) => void;
}) {
  const { can, user: me } = useFactoryAuth();
  const canManageUsers = can("users.manage");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);
  const [roles, setRoles] = React.useState<string[]>([]);
  const [catalogRoles, setCatalogRoles] = React.useState<string[]>([]);
  const [linkMode, setLinkMode] = React.useState<LinkMode>("create");
  const [unlinkedUsers, setUnlinkedUsers] = React.useState<SystemUserJson[]>([]);
  const [selectedUserId, setSelectedUserId] = React.useState("");
  const [linkEmail, setLinkEmail] = React.useState(employee.email || "");
  const [linkPassword, setLinkPassword] = React.useState("Admin@2026");
  const [editEmail, setEditEmail] = React.useState("");
  const [editPassword, setEditPassword] = React.useState("");
  const [linkRole, setLinkRole] = React.useState("supervisor");

  const su = employee.systemUser;

  const applySystemUser = React.useCallback(
    (u: NonNullable<ManagedEmployee["systemUser"]>) => {
      setRoles(u.roles);
      setEditEmail(u.email);
      onUpdated?.({ systemUser: u });
    },
    [onUpdated]
  );

  React.useEffect(() => {
    if (!canManageUsers) return;
    void usersApi
      .catalog()
      .then((c) => setCatalogRoles(c.roles.map((r) => r.name)))
      .catch(() => {});
  }, [canManageUsers]);

  React.useEffect(() => {
    setRoles(employee.systemUser?.roles ?? []);
    setLinkEmail(employee.email || "");
    setEditEmail(employee.systemUser?.email ?? "");
    setEditPassword("");
    setError(null);
    setInfo(null);
  }, [employee]);

  React.useEffect(() => {
    if (su || !canManageUsers) return;
    let cancelled = false;
    void usersApi
      .list({ employeeId: employee.id, pageSize: 1 })
      .then((res) => {
        if (cancelled) return;
        const found = res.data[0];
        if (found) {
          applySystemUser(systemUserToEmployeePatch(found).systemUser!);
          setInfo("تم العثور على حساب مرتبط مسبقاً بهذا الموظف.");
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [su, canManageUsers, employee.id, applySystemUser]);

  React.useEffect(() => {
    if (su || !canManageUsers || linkMode !== "existing") return;
    let cancelled = false;
    void usersApi
      .list({ unlinkedOnly: true, pageSize: 100 })
      .then((res) => {
        if (!cancelled) setUnlinkedUsers(res.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [su, canManageUsers, linkMode]);

  const roleOptions = catalogRoles.length ? catalogRoles : ["supervisor", "admin"];

  const saveRoles = async () => {
    if (!su || !canManageUsers) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const updated = await usersApi.update(su.id, { roles });
      applySystemUser({
        id: updated.id,
        email: updated.email,
        name: updated.name,
        isActive: updated.isActive,
        roles: updated.roles,
        permissions: updated.permissions
      });
      setInfo("تم حفظ الأدوار بنجاح.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل التحديث");
    } finally {
      setBusy(false);
    }
  };

  const saveAccount = async () => {
    if (!su || !canManageUsers) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const body: Record<string, unknown> = { email: editEmail.trim() };
      if (editPassword.trim().length >= 8) body.password = editPassword;
      const updated = await usersApi.update(su.id, body);
      applySystemUser({
        id: updated.id,
        email: updated.email,
        name: updated.name,
        isActive: updated.isActive,
        roles: updated.roles,
        permissions: updated.permissions
      });
      setEditPassword("");
      setInfo("تم تحديث بيانات الحساب.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل التحديث");
    } finally {
      setBusy(false);
    }
  };

  const unlinkAccount = async () => {
    if (!su || !canManageUsers) return;
    if (!window.confirm("إلغاء ربط هذا الحساب بالموظف؟ يبقى المستخدم في النظام دون موظف مرتبط.")) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await usersApi.update(su.id, { unlinkEmployee: true });
      onUpdated?.({ systemUser: null });
      setInfo("تم إلغاء الربط. يمكنك ربط حساب آخر أدناه.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل إلغاء الربط");
    } finally {
      setBusy(false);
    }
  };

  const createAccount = async () => {
    if (!canManageUsers) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const created = await usersApi.linkEmployee({
        employeeId: employee.id,
        email: linkEmail.trim(),
        password: linkPassword,
        roles: [linkRole]
      });
      applySystemUser({
        id: created.id,
        email: created.email,
        name: created.name,
        isActive: created.isActive,
        roles: created.roles,
        permissions: created.permissions
      });
      setInfo("تم إنشاء الحساب وربطه بالموظف.");
    } catch (e) {
      if (e instanceof UsersApiError && e.status === 409 && e.existingUser) {
        applySystemUser(systemUserToEmployeePatch(e.existingUser).systemUser!);
        setInfo(e.message);
        return;
      }
      setError(e instanceof Error ? e.message : "فشل إنشاء الحساب");
    } finally {
      setBusy(false);
    }
  };

  const linkExisting = async () => {
    if (!canManageUsers || !selectedUserId) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const linked = await usersApi.linkExistingUser({
        employeeId: employee.id,
        userId: Number(selectedUserId),
        roles: [linkRole]
      });
      applySystemUser({
        id: linked.id,
        email: linked.email,
        name: linked.name,
        isActive: linked.isActive,
        roles: linked.roles,
        permissions: linked.permissions
      });
      setInfo("تم ربط الحساب الموجود بالموظف.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الربط");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-sf-stroke/45 bg-sf-panel/50 p-5" dir="rtl">
      <div className="flex items-center gap-2 border-b border-sf-hairline/60 pb-3">
        <Shield className="h-5 w-5 text-sf-accentCool" aria-hidden />
        <MotionHeaderCopy />
      </div>

      {info ? (
        <p className="mt-3 rounded-lg border border-sf-accent/30 bg-sf-accent/10 px-3 py-2 text-sm text-sf-ink">{info}</p>
      ) : null}
      {error ? <p className="mt-3 rounded-lg border border-sf-alarm/35 bg-sf-alarm/10 px-3 py-2 text-sm text-sf-alarm">{error}</p> : null}

      {!su ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-sf-muted">
            ربط الموظف بحساب دخول للنظام. بيانات العامل (الاسم، الراتب…) تُحفظ بزر «حفظ التعديلات» في أعلى الصفحة.
          </p>

          {canManageUsers ? (
            <>
              <MotionLinkModeTabs linkMode={linkMode} setLinkMode={setLinkMode} />

              {linkMode === "create" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs text-sf-muted sm:col-span-2">
                    البريد (تسجيل الدخول)
                    <IndustrialInput className="mt-1 w-full" value={linkEmail} onChange={(e) => setLinkEmail(e.target.value)} />
                  </label>
                  <label className="block text-xs text-sf-muted">
                    كلمة المرور
                    <IndustrialInput
                      type="password"
                      className="mt-1 w-full"
                      value={linkPassword}
                      onChange={(e) => setLinkPassword(e.target.value)}
                    />
                  </label>
                  <label className="block text-xs text-sf-muted">
                    الدور
                    <IndustrialSelect className="mt-1 w-full" value={linkRole} onChange={(e) => setLinkRole(e.target.value)}>
                      {roleOptions.map((r) => (
                        <option key={r} value={r}>
                          {roleLabel(r)}
                        </option>
                      ))}
                    </IndustrialSelect>
                  </label>
                  <Button
                    type="button"
                    variant="sfAccent"
                    className="rounded-xl sm:col-span-2"
                    disabled={busy}
                    onClick={() => void createAccount()}
                  >
                    <UserPlus className="h-4 w-4" />
                    إنشاء حساب وربطه
                  </Button>
                </div>
              ) : (
                <MotionExistingLinkForm
                  unlinkedUsers={unlinkedUsers}
                  selectedUserId={selectedUserId}
                  setSelectedUserId={setSelectedUserId}
                  linkRole={linkRole}
                  setLinkRole={setLinkRole}
                  roleOptions={roleOptions}
                  busy={busy}
                  onLink={() => void linkExisting()}
                />
              )}
            </>
          ) : (
            <p className="text-xs text-sf-caution">يتطلب صلاحية users.manage</p>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-md border border-sf-stroke/40 bg-sf-deep px-2 py-1 font-mono text-xs">{su.email}</span>
            {su.roles.map((r) => (
              <span key={r} className="rounded-md bg-sf-accent/15 px-2 py-1 text-xs text-sf-accentCool">
                {roleLabel(r)}
              </span>
            ))}
          </div>

          {me?.email === su.email ? (
            <p className="rounded-lg border border-sf-accent/30 bg-sf-accent/10 px-3 py-2 text-xs">
              <KeyRound className="mb-1 inline h-3.5 w-3.5" /> حسابك الحالي — بعد تعديل الصلاحيات سجّل الخروج ثم الدخول مجدداً.
            </p>
          ) : null}

          {canManageUsers ? (
            <div className="grid gap-3 rounded-lg border border-sf-hairline/50 bg-sf-deep/40 p-3 sm:grid-cols-2">
              <p className="text-xs font-semibold text-sf-muted sm:col-span-2">تعديل الحساب المرتبط</p>
              <label className="block text-xs text-sf-muted sm:col-span-2">
                البريد
                <IndustrialInput className="mt-1 w-full" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </label>
              <label className="block text-xs text-sf-muted sm:col-span-2">
                كلمة مرور جديدة (اتركها فارغة إن لم تُرد التغيير)
                <IndustrialInput
                  type="password"
                  className="mt-1 w-full"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="8 أحرف على الأقل"
                />
              </label>
              <Button type="button" variant="sfAccent" size="sm" disabled={busy} onClick={() => void saveAccount()}>
                حفظ بيانات الحساب
              </Button>
              <Button type="button" variant="sfGhost" size="sm" disabled={busy} onClick={() => void unlinkAccount()}>
                <Unlink className="h-3.5 w-3.5" />
                إلغاء الربط
              </Button>
            </div>
          ) : null}

          <div>
            <p className="mb-2 text-xs font-semibold text-sf-muted">الصلاحيات</p>
            <div className="flex flex-wrap gap-1.5">
              {su.permissions.map((p) => (
                <span key={p} title={p} className="rounded border border-sf-hairline/50 bg-sf-panel2 px-2 py-0.5 text-[10px]">
                  {permissionLabel(p)}
                </span>
              ))}
            </div>
          </div>

          {canManageUsers ? (
            <div className="space-y-2 border-t border-sf-hairline/50 pt-3">
              <p className="text-xs text-sf-muted">الأدوار</p>
              <div className="flex flex-wrap gap-2">
                {roleOptions.map((r) => {
                  const on = roles.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      disabled={busy}
                      onClick={() => setRoles(on ? roles.filter((x) => x !== r) : [...roles, r])}
                      className={`rounded-lg border px-3 py-1.5 text-xs ${
                        on ? "border-sf-accent/50 bg-sf-accent/20" : "border-sf-stroke/40 text-sf-muted"
                      }`}
                    >
                      {roleLabel(r)}
                    </button>
                  );
                })}
              </div>
              <Button type="button" variant="sfAccent" size="sm" disabled={busy} onClick={() => void saveRoles()}>
                حفظ الأدوار
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

function MotionHeaderCopy() {
  return (
    <div>
      <h3 className="text-sm font-bold text-sf-ink">حساب النظام والربط بالموظف</h3>
      <p className="text-xs text-sf-muted">حساب دخول Laravel — منفصل عن بيانات العامل في النموذج</p>
    </div>
  );
}

function MotionLinkModeTabs({
  linkMode,
  setLinkMode
}: {
  linkMode: LinkMode;
  setLinkMode: (m: LinkMode) => void;
}) {
  return (
    <div className="flex gap-2 rounded-lg border border-sf-hairline/50 p-1">
      <button
        type="button"
        className={`flex-1 rounded-md px-3 py-2 text-xs font-medium ${
          linkMode === "create" ? "bg-sf-accent/20 text-sf-accentCool" : "text-sf-muted"
        }`}
        onClick={() => setLinkMode("create")}
      >
        <UserPlus className="mb-0.5 inline h-3.5 w-3.5" /> حساب جديد
      </button>
      <button
        type="button"
        className={`flex-1 rounded-md px-3 py-2 text-xs font-medium ${
          linkMode === "existing" ? "bg-sf-accent/20 text-sf-accentCool" : "text-sf-muted"
        }`}
        onClick={() => setLinkMode("existing")}
      >
        <Link2 className="mb-0.5 inline h-3.5 w-3.5" /> ربط حساب موجود
      </button>
    </div>
  );
}

function MotionExistingLinkForm(props: {
  unlinkedUsers: SystemUserJson[];
  selectedUserId: string;
  setSelectedUserId: (v: string) => void;
  linkRole: string;
  setLinkRole: (v: string) => void;
  roleOptions: string[];
  busy: boolean;
  onLink: () => void;
}) {
  const {
    unlinkedUsers,
    selectedUserId,
    setSelectedUserId,
    linkRole,
    setLinkRole,
    roleOptions,
    busy,
    onLink
  } = props;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block text-xs text-sf-muted sm:col-span-2">
        مستخدم بدون موظف مرتبط
        <IndustrialSelect className="mt-1 w-full" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
          <option value="">— اختر مستخدماً —</option>
          {unlinkedUsers.map((u) => (
            <option key={u.id} value={String(u.id)}>
              {u.name} ({u.email})
            </option>
          ))}
        </IndustrialSelect>
      </label>
      {unlinkedUsers.length === 0 ? (
        <p className="text-xs text-sf-caution sm:col-span-2">
          لا يوجد مستخدمون غير مرتبطين. أنشئ حساباً جديداً أو ألغِ ربط مستخدم من موظف آخر.
        </p>
      ) : null}
      <label className="block text-xs text-sf-muted sm:col-span-2">
        الدور بعد الربط
        <IndustrialSelect className="mt-1 w-full" value={linkRole} onChange={(e) => setLinkRole(e.target.value)}>
          {roleOptions.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </IndustrialSelect>
      </label>
      <Button
        type="button"
        variant="sfAccent"
        className="rounded-xl sm:col-span-2"
        disabled={busy || !selectedUserId}
        onClick={onLink}
      >
        <Link2 className="h-4 w-4" />
        ربط الحساب المحدد
      </Button>
    </div>
  );
}
