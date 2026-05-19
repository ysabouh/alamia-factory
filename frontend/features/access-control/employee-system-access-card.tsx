"use client";

import * as React from "react";
import { KeyRound, Link2, Shield, Unlink, UserPlus } from "lucide-react";

import { WfmField, WfmInput, WfmSelect } from "@/components/workforce/atlas";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFactoryAuth } from "@/contexts/factory-auth-context";
import { systemUserToEmployeePatch, UsersApiError, usersApi, type SystemUserJson } from "@/lib/api/users-client";
import type { ManagedEmployee } from "@/features/workforce/employee-management/model";

import { permissionLabel, roleLabel } from "./permission-labels";

type LinkMode = "create" | "existing";

const cardInner = "rounded-sm border border-atlas-rule bg-atlas-canvas/60 p-3";

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
    <section className="rounded-sm border border-atlas-rule bg-atlas-paper p-5 shadow-atlasCard" dir="rtl">
      <div className="flex items-center gap-2 border-b border-atlas-rule pb-3">
        <Shield className="h-5 w-5 text-atlas-brand" aria-hidden />
        <AccessCardHeader />
      </div>

      {info ? (
        <p className="mt-3 rounded-sm border border-atlas-brand/30 bg-atlas-brand/10 px-3 py-2 text-sm text-atlas-ink">{info}</p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-sm border border-atlas-danger/35 bg-atlas-danger/10 px-3 py-2 text-sm text-atlas-danger">{error}</p>
      ) : null}

      {!su ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-atlas-muted">
            ربط الموظف بحساب دخول للنظام. بيانات العامل (الاسم، الراتب…) تُحفظ بزر «حفظ التعديلات» في أعلى الصفحة.
          </p>

          {canManageUsers ? (
            <>
              <LinkModeTabs linkMode={linkMode} setLinkMode={setLinkMode} />

              {linkMode === "create" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <WfmField id="link-email" label="البريد (تسجيل الدخول)" className="sm:col-span-2">
                    <WfmInput id="link-email" value={linkEmail} onChange={(e) => setLinkEmail(e.target.value)} />
                  </WfmField>
                  <WfmField id="link-password" label="كلمة المرور">
                    <WfmInput
                      id="link-password"
                      type="password"
                      value={linkPassword}
                      onChange={(e) => setLinkPassword(e.target.value)}
                    />
                  </WfmField>
                  <WfmField id="link-role" label="الدور">
                    <WfmSelect id="link-role" value={linkRole} onChange={(e) => setLinkRole(e.target.value)}>
                      {roleOptions.map((r) => (
                        <option key={r} value={r}>
                          {roleLabel(r)}
                        </option>
                      ))}
                    </WfmSelect>
                  </WfmField>
                  <Button
                    type="button"
                    variant="atlasPrimary"
                    className="rounded-sm sm:col-span-2"
                    disabled={busy}
                    onClick={() => void createAccount()}
                  >
                    <UserPlus className="h-4 w-4" />
                    إنشاء حساب وربطه
                  </Button>
                </div>
              ) : (
                <ExistingLinkForm
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
            <p className="text-xs text-atlas-warning">يتطلب صلاحية users.manage</p>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-sm border border-atlas-rule bg-atlas-canvas px-2 py-1 font-mono text-xs text-atlas-slate">
              {su.email}
            </span>
            {su.roles.map((r) => (
              <span key={r} className="rounded-sm bg-atlas-brand/15 px-2 py-1 text-xs text-atlas-brand">
                {roleLabel(r)}
              </span>
            ))}
          </div>

          {me?.email === su.email ? (
            <p className="rounded-sm border border-atlas-brand/30 bg-atlas-brand/10 px-3 py-2 text-xs text-atlas-ink">
              <KeyRound className="mb-1 inline h-3.5 w-3.5" /> حسابك الحالي — بعد تعديل الصلاحيات سجّل الخروج ثم الدخول مجدداً.
            </p>
          ) : null}

          {canManageUsers ? (
            <div className={cn("grid gap-3 sm:grid-cols-2", cardInner)}>
              <p className="text-xs font-semibold text-atlas-muted sm:col-span-2">تعديل الحساب المرتبط</p>
              <WfmField id="edit-email" label="البريد" className="sm:col-span-2">
                <WfmInput id="edit-email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </WfmField>
              <WfmField id="edit-password" label="كلمة مرور جديدة (اتركها فارغة إن لم تُرد التغيير)" className="sm:col-span-2">
                <WfmInput
                  id="edit-password"
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="8 أحرف على الأقل"
                />
              </WfmField>
              <Button type="button" variant="atlasPrimary" size="sm" className="rounded-sm" disabled={busy} onClick={() => void saveAccount()}>
                حفظ بيانات الحساب
              </Button>
              <Button type="button" variant="atlasOutline" size="sm" className="rounded-sm" disabled={busy} onClick={() => void unlinkAccount()}>
                <Unlink className="h-3.5 w-3.5" />
                إلغاء الربط
              </Button>
            </div>
          ) : null}

          <div>
            <p className="mb-2 text-xs font-semibold text-atlas-muted">الصلاحيات</p>
            <div className="flex flex-wrap gap-1.5">
              {su.permissions.map((p) => (
                <span
                  key={p}
                  title={p}
                  className="rounded-sm border border-atlas-rule bg-atlas-canvas px-2 py-0.5 text-[10px] text-atlas-slate"
                >
                  {permissionLabel(p)}
                </span>
              ))}
            </div>
          </div>

          {canManageUsers ? (
            <div className="space-y-2 border-t border-atlas-rule pt-3">
              <p className="text-xs text-atlas-muted">الأدوار</p>
              <div className="flex flex-wrap gap-2">
                {roleOptions.map((r) => {
                  const on = roles.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      disabled={busy}
                      onClick={() => setRoles(on ? roles.filter((x) => x !== r) : [...roles, r])}
                      className={cn(
                        "rounded-sm border px-3 py-1.5 text-xs transition-colors",
                        on
                          ? "border-atlas-brand/50 bg-atlas-brand/15 text-atlas-brand"
                          : "border-atlas-rule text-atlas-muted hover:border-atlas-brand/30"
                      )}
                    >
                      {roleLabel(r)}
                    </button>
                  );
                })}
              </div>
              <Button type="button" variant="atlasPrimary" size="sm" className="rounded-sm" disabled={busy} onClick={() => void saveRoles()}>
                حفظ الأدوار
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

function AccessCardHeader() {
  return (
    <div>
      <h3 className="text-sm font-bold text-atlas-ink">حساب النظام والربط بالموظف</h3>
      <p className="text-xs text-atlas-muted">حساب دخول Laravel — منفصل عن بيانات العامل في النموذج</p>
    </div>
  );
}

function LinkModeTabs({
  linkMode,
  setLinkMode
}: {
  linkMode: LinkMode;
  setLinkMode: (m: LinkMode) => void;
}) {
  return (
    <div className="flex gap-2 rounded-sm border border-atlas-rule bg-atlas-canvas/50 p-1">
      <button
        type="button"
        className={cn(
          "flex-1 rounded-sm px-3 py-2 text-xs font-medium transition-colors",
          linkMode === "create" ? "bg-atlas-brand/15 text-atlas-brand" : "text-atlas-muted hover:text-atlas-slate"
        )}
        onClick={() => setLinkMode("create")}
      >
        <UserPlus className="mb-0.5 inline h-3.5 w-3.5" /> حساب جديد
      </button>
      <button
        type="button"
        className={cn(
          "flex-1 rounded-sm px-3 py-2 text-xs font-medium transition-colors",
          linkMode === "existing" ? "bg-atlas-brand/15 text-atlas-brand" : "text-atlas-muted hover:text-atlas-slate"
        )}
        onClick={() => setLinkMode("existing")}
      >
        <Link2 className="mb-0.5 inline h-3.5 w-3.5" /> ربط حساب موجود
      </button>
    </div>
  );
}

function ExistingLinkForm(props: {
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
      <WfmField id="existing-user" label="مستخدم بدون موظف مرتبط" className="sm:col-span-2">
        <WfmSelect id="existing-user" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
          <option value="">— اختر مستخدماً —</option>
          {unlinkedUsers.map((u) => (
            <option key={u.id} value={String(u.id)}>
              {u.name} ({u.email})
            </option>
          ))}
        </WfmSelect>
      </WfmField>
      {unlinkedUsers.length === 0 ? (
        <p className="text-xs text-atlas-warning sm:col-span-2">
          لا يوجد مستخدمون غير مرتبطين. أنشئ حساباً جديداً أو ألغِ ربط مستخدم من موظف آخر.
        </p>
      ) : null}
      <WfmField id="existing-role" label="الدور بعد الربط" className="sm:col-span-2">
        <WfmSelect id="existing-role" value={linkRole} onChange={(e) => setLinkRole(e.target.value)}>
          {roleOptions.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </WfmSelect>
      </WfmField>
      <Button
        type="button"
        variant="atlasPrimary"
        className="rounded-sm sm:col-span-2"
        disabled={busy || !selectedUserId}
        onClick={onLink}
      >
        <Link2 className="h-4 w-4" />
        ربط الحساب المحدد
      </Button>
    </div>
  );
}
