"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import {
  Ban,
  Building2,
  CalendarCheck,
  Coins,
  Gauge,
  MoreHorizontal,
  ShieldAlert,
  Shuffle,
  Wallet
} from "lucide-react";

import { WfmModal, WfmSelect } from "@/components/workforce/atlas";
import { IndustrialSelect, SfModal } from "@/components/smart-factory";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useEmployeeRegistry } from "./employee-registry-context";
import type { ManagedEmployee } from "./model";

function statusIdByCode(catalog: NonNullable<ReturnType<typeof useEmployeeRegistry>["catalog"]>, code: string): string | undefined {
  return catalog.statuses.find((s) => s.code.toUpperCase() === code.toUpperCase())?.id;
}

export function EmployeeQuickActions({
  employee,
  variant = "row",
  className,
  onPatched
}: {
  employee: ManagedEmployee;
  variant?: "row" | "detail";
  className?: string;
  onPatched?: (e: ManagedEmployee) => void;
}) {
  const { catalog, patchEmployeeFields, refetchCurrentList, listSource } = useEmployeeRegistry();
  const apiLocked = listSource === "dashboard";
  const [shiftOpen, setShiftOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const [rewardOpen, setRewardOpen] = useState(false);
  const [penaltyOpen, setPenaltyOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [nextShiftId, setNextShiftId] = useState(employee.shiftId ?? "");
  const [nextDeptId, setNextDeptId] = useState(employee.departmentId ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setNextShiftId(employee.shiftId ?? catalog?.shifts[0]?.id ?? "");
  }, [employee.shiftId, catalog?.shifts]);

  useEffect(() => {
    setNextDeptId(employee.departmentId ?? catalog?.departments[0]?.id ?? "");
  }, [employee.departmentId, catalog?.departments]);

  const applyShift = async () => {
    if (apiLocked) return;
    if (!nextShiftId) return;
    setBusy(true);
    try {
      const updated = await patchEmployeeFields(employee.id, { shiftId: nextShiftId });
      onPatched?.(updated);
      await refetchCurrentList();
    } finally {
      setBusy(false);
      setShiftOpen(false);
    }
  };

  const applyDept = async () => {
    if (apiLocked) return;
    if (!nextDeptId) return;
    setBusy(true);
    try {
      const updated = await patchEmployeeFields(employee.id, { departmentId: nextDeptId });
      onPatched?.(updated);
      await refetchCurrentList();
    } finally {
      setBusy(false);
      setDeptOpen(false);
    }
  };

  const suspend = async () => {
    if (apiLocked) return;
    const sid = catalog ? statusIdByCode(catalog, "SUSP_REST") : undefined;
    if (!sid) return;
    setBusy(true);
    try {
      const updated = await patchEmployeeFields(employee.id, { statusId: sid, isActive: true });
      onPatched?.(updated);
      await refetchCurrentList();
    } finally {
      setBusy(false);
      setSuspendOpen(false);
    }
  };

  const approveLeave = async () => {
    if (apiLocked) return;
    const sid = catalog ? statusIdByCode(catalog, "ON_LEAVE") : undefined;
    if (!sid) return;
    setBusy(true);
    try {
      const updated = await patchEmployeeFields(employee.id, { statusId: sid, isActive: true });
      onPatched?.(updated);
      await refetchCurrentList();
    } finally {
      setBusy(false);
    }
  };

  const btnClass =
    variant === "row"
      ? "h-8 rounded-md border border-sf-stroke/40 bg-sf-panel px-2 text-[11px] text-sf-copy hover:border-sf-accentCool/45"
      : "h-9 rounded-sm gap-1.5 px-3 text-xs";
  const btnVariant = variant === "detail" ? "atlasOutline" : "sfGhost";
  const Modal = variant === "detail" ? WfmModal : SfModal;
  const Select = variant === "detail" ? WfmSelect : IndustrialSelect;
  const cancelVariant = variant === "detail" ? "atlasOutline" : "sfGhost";
  const confirmVariant = variant === "detail" ? "atlasPrimary" : "sfAccent";
  const dangerVariant = variant === "detail" ? "atlasOutline" : "sfDanger";

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Button type="button" variant={btnVariant} className={btnClass} disabled={busy || apiLocked} onClick={() => setShiftOpen(true)}>
        <Shuffle className="h-3.5 w-3.5" />
        وردية
      </Button>
      <Button type="button" variant={btnVariant} className={btnClass} disabled={busy || apiLocked} onClick={() => setDeptOpen(true)}>
        <Building2 className="h-3.5 w-3.5" />
        قسم
      </Button>
      <Button type="button" variant={btnVariant} className={btnClass} disabled={busy} onClick={() => setRewardOpen(true)}>
        <Coins className="h-3.5 w-3.5" />
        مكافأة
      </Button>
      <Button type="button" variant={btnVariant} className={btnClass} disabled={busy} onClick={() => setPenaltyOpen(true)}>
        <ShieldAlert className="h-3.5 w-3.5" />
        جزاء
      </Button>
      <Button type="button" variant={btnVariant} className={btnClass} disabled={busy || apiLocked} onClick={approveLeave}>
        <CalendarCheck className="h-3.5 w-3.5" />
        إجازة
      </Button>
      <Button type="button" variant={btnVariant} className={btnClass} disabled={busy || apiLocked} onClick={() => setSuspendOpen(true)}>
        <Ban className="h-3.5 w-3.5" />
        تعليق
      </Button>
      <Link
        href={"/ar/workforce/employees" as Route}
        className={cn("inline-flex items-center gap-1", btnClass)}
        title="عرض الحضور في السجل"
      >
        <Gauge className="h-3.5 w-3.5" />
        حضور
      </Link>
      <Link href={"/ar/workforce/finance" as Route} className={cn("inline-flex items-center gap-1", btnClass)}>
        <Wallet className="h-3.5 w-3.5" />
        رواتب
      </Link>
      {variant === "detail" ? (
        <span className="inline-flex items-center gap-1 text-[10px] text-atlas-muted">
          <MoreHorizontal className="h-3 w-3" aria-hidden />
          {apiLocked
            ? "عرض احتياطي — أوامر الـ API معطّلة"
            : "أوامر سريعة — الوردية/القسم/الحالة عبر واجهة الـ API"}
        </span>
      ) : null}

      <Modal
        open={shiftOpen}
        onOpenChange={setShiftOpen}
        title="تغيير الوردية"
        description={employee.fullName}
        footer={
          <>
            <Button variant={cancelVariant} type="button" className="rounded-sm" onClick={() => setShiftOpen(false)}>
              إلغاء
            </Button>
            <Button variant={confirmVariant} type="button" className="rounded-sm" disabled={busy} onClick={applyShift}>
              تأكيد
            </Button>
          </>
        }
      >
        <Select value={nextShiftId} onChange={(e) => setNextShiftId(e.target.value)} className="w-full">
          {(catalog?.shifts ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Modal>

      <Modal
        open={deptOpen}
        onOpenChange={setDeptOpen}
        title="نقل القسم"
        description={employee.fullName}
        footer={
          <>
            <Button variant={cancelVariant} type="button" className="rounded-sm" onClick={() => setDeptOpen(false)}>
              إلغاء
            </Button>
            <Button variant={confirmVariant} type="button" className="rounded-sm" disabled={busy} onClick={applyDept}>
              تأكيد
            </Button>
          </>
        }
      >
        <Select value={nextDeptId} onChange={(e) => setNextDeptId(e.target.value)} className="w-full">
          {(catalog?.departments ?? []).map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      </Modal>

      <Modal
        open={rewardOpen}
        onOpenChange={setRewardOpen}
        title="إضافة مكافأة"
        description="غير مرتبط بجدول في قاعدة البيانات حالياً"
        footer={
          <>
            <Button variant={cancelVariant} type="button" className="rounded-sm" onClick={() => setRewardOpen(false)}>
              إلغاء
            </Button>
            <Button variant={confirmVariant} type="button" className="rounded-sm" onClick={() => setRewardOpen(false)}>
              حسناً
            </Button>
          </>
        }
      >
        <p className={cn("text-sm", variant === "detail" ? "text-atlas-muted" : "text-sf-muted")}>
          تسجيل المكافآت يتطلب جداول رواتب/حوافز في الـ API. يمكنك تعديل الراتب أو الملاحظات من نموذج التعديل.
        </p>
      </Modal>

      <Modal
        open={penaltyOpen}
        onOpenChange={setPenaltyOpen}
        title="إضافة جزاء"
        footer={
          <>
            <Button variant={cancelVariant} type="button" className="rounded-sm" onClick={() => setPenaltyOpen(false)}>
              إلغاء
            </Button>
            <Button variant={dangerVariant} type="button" className="rounded-sm" onClick={() => setPenaltyOpen(false)}>
              حسناً
            </Button>
          </>
        }
      >
        <p className={cn("text-sm", variant === "detail" ? "text-atlas-muted" : "text-sf-muted")}>
          الجزاءات غير مربوطة بتخزين دائم بعد — استخدم الملاحظات أو تكامل الرواتب لاحقاً.
        </p>
      </Modal>

      <Modal
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        title="تعليق الموظف"
        description="تعيين حالة التوظيف إلى موقوف مؤقتًا (SUSPENDED)"
        footer={
          <>
            <Button variant={cancelVariant} type="button" className="rounded-sm" onClick={() => setSuspendOpen(false)}>
              إلغاء
            </Button>
            <Button variant={dangerVariant} type="button" className="rounded-sm" disabled={busy} onClick={suspend}>
              تعليق
            </Button>
          </>
        }
      >
        <p className={cn("text-sm", variant === "detail" ? "text-atlas-muted" : "text-sf-muted")}>
          يُحدّث السجل في قاعدة البيانات عبر PATCH.
        </p>
      </Modal>
    </div>
  );
}
