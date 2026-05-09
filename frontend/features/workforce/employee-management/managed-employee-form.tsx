"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";

import { IndustrialField, IndustrialInput, IndustrialSelect } from "@/components/smart-factory";
import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/ui/form";
import { WorkforceApiError } from "@/lib/api/workforce-client";

import { useEmployeeRegistry } from "./employee-registry-context";
import type { WorkforceCatalogJson } from "./workforce-api-types";
import {
  employeeFormSchema,
  fullEmployeeEditSchema,
  type EmployeeFormInput,
  type FullEmployeeEditInput,
  type ManagedEmployee
} from "./model";

const emptyCreate: EmployeeFormInput = {
  employeeNumber: "",
  firstName: "",
  lastName: "",
  gender: "male",
  birthDate: "",
  phone: "",
  emergencyPhone: "",
  email: "",
  nationalId: "",
  address: "",
  hallId: "",
  departmentId: "",
  jobRoleId: "",
  shiftId: "",
  salary: 4000,
  overtimeRate: 15,
  hireDate: new Date().toISOString().slice(0, 10),
  photoUrl: "",
  notes: ""
};

function defaultsFromEmployee(e: ManagedEmployee): FullEmployeeEditInput {
  return {
    employeeNumber: e.employeeNumber,
    firstName: e.firstName,
    lastName: e.lastName,
    gender: e.gender,
    birthDate: e.birthDate,
    phone: e.phone,
    emergencyPhone: e.emergencyPhone,
    email: e.email,
    nationalId: e.nationalId,
    address: e.address,
    hallId: e.hallId ?? "",
    departmentId: e.departmentId ?? "",
    jobRoleId: e.jobRoleId ?? "",
    shiftId: e.shiftId ?? "",
    salary: e.salary,
    overtimeRate: e.overtimeRate,
    hireDate: e.hireDate,
    photoUrl: e.photoUrl ?? "",
    notes: e.notes,
    status: e.status,
    performanceScore: e.performanceScore,
    reliabilityScore: e.reliabilityScore,
    productionEff: e.productionEff,
    annualLeaveBalance: e.annualLeaveBalance
  };
}

function SharedFields({
  register,
  errors,
  mode,
  catalog
}: {
  register: UseFormRegister<EmployeeFormInput & FullEmployeeEditInput>;
  errors: FieldErrors<EmployeeFormInput> | FieldErrors<FullEmployeeEditInput>;
  mode: "create" | "edit";
  catalog: WorkforceCatalogJson;
}) {
  const e = errors as FieldErrors<FullEmployeeEditInput>;
  return (
    <>
      <FormSection
        title="الهوية والربط الوظيفي"
        description="حقول أساسية للتشغيل الصناعي"
        className="border-sf-stroke/40 bg-sf-panel/60 text-sf-copy shadow-industrial [&_h3]:text-sf-ink [&_p]:text-sf-muted"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <IndustrialField id="employeeNumber" label="الرقم الوظيفي" required error={e.employeeNumber?.message}>
            <IndustrialInput id="employeeNumber" {...register("employeeNumber")} monospace />
          </IndustrialField>
          <IndustrialField id="nationalId" label="الهوية الوطنية" required error={e.nationalId?.message}>
            <IndustrialInput id="nationalId" {...register("nationalId")} />
          </IndustrialField>
          <IndustrialField id="firstName" label="الاسم الأول" required error={e.firstName?.message}>
            <IndustrialInput id="firstName" {...register("firstName")} />
          </IndustrialField>
          <IndustrialField id="lastName" label="اسم العائلة" required error={e.lastName?.message}>
            <IndustrialInput id="lastName" {...register("lastName")} />
          </IndustrialField>
          <IndustrialField id="gender" label="الجنس" required error={e.gender?.message}>
            <IndustrialSelect id="gender" {...register("gender")}>
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
              <option value="other">آخر</option>
            </IndustrialSelect>
          </IndustrialField>
          <IndustrialField id="birthDate" label="تاريخ الميلاد" required error={e.birthDate?.message}>
            <IndustrialInput id="birthDate" type="date" {...register("birthDate")} />
          </IndustrialField>
        </div>
      </FormSection>

      <FormSection
        title="الاتصال والعنوان"
        className="border-sf-stroke/40 bg-sf-panel/60 text-sf-copy shadow-industrial [&_h3]:text-sf-ink [&_p]:text-sf-muted"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <IndustrialField id="phone" label="الجوال" required error={e.phone?.message}>
            <IndustrialInput id="phone" type="tel" {...register("phone")} />
          </IndustrialField>
          <IndustrialField id="emergencyPhone" label="جوال الطوارئ" required error={e.emergencyPhone?.message}>
            <IndustrialInput id="emergencyPhone" type="tel" {...register("emergencyPhone")} />
          </IndustrialField>
          <IndustrialField id="email" label="البريد" required error={e.email?.message} className="md:col-span-2">
            <IndustrialInput id="email" type="email" {...register("email")} />
          </IndustrialField>
          <IndustrialField id="address" label="العنوان" required error={e.address?.message} className="md:col-span-2">
            <IndustrialInput id="address" {...register("address")} />
          </IndustrialField>
        </div>
      </FormSection>

      <FormSection
        title="التنظيم — قاعة، قسم، دور، وردية (قاعدة البيانات)"
        className="border-sf-stroke/40 bg-sf-panel/60 text-sf-copy shadow-industrial [&_h3]:text-sf-ink [&_p]:text-sf-muted"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <IndustrialField id="hallId" label="القاعة" required error={e.hallId?.message}>
            <IndustrialSelect id="hallId" {...register("hallId")}>
              {catalog.halls.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </IndustrialSelect>
          </IndustrialField>
          <IndustrialField id="departmentId" label="القسم" required error={e.departmentId?.message}>
            <IndustrialSelect id="departmentId" {...register("departmentId")}>
              {catalog.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </IndustrialSelect>
          </IndustrialField>
          <IndustrialField id="jobRoleId" label="الدور الوظيفي" required error={e.jobRoleId?.message}>
            <IndustrialSelect id="jobRoleId" {...register("jobRoleId")}>
              {catalog.jobRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </IndustrialSelect>
          </IndustrialField>
          <IndustrialField id="shiftId" label="الوردية" required error={e.shiftId?.message}>
            <IndustrialSelect id="shiftId" {...register("shiftId")}>
              {catalog.shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </IndustrialSelect>
          </IndustrialField>
        </div>
      </FormSection>

      <FormSection
        title="التعويضات والتواريخ"
        className="border-sf-stroke/40 bg-sf-panel/60 text-sf-copy shadow-industrial [&_h3]:text-sf-ink [&_p]:text-sf-muted"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <IndustrialField id="salary" label="الراتب الأساسي" required error={e.salary?.message}>
            <IndustrialInput id="salary" type="number" step="0.01" {...register("salary")} monospace />
          </IndustrialField>
          <IndustrialField id="overtimeRate" label="سعر ساعة إضافي" required error={e.overtimeRate?.message}>
            <IndustrialInput id="overtimeRate" type="number" step="0.01" {...register("overtimeRate")} monospace />
          </IndustrialField>
          <IndustrialField id="hireDate" label="تاريخ التعيين" required error={e.hireDate?.message}>
            <IndustrialInput id="hireDate" type="date" {...register("hireDate")} />
          </IndustrialField>
          <IndustrialField id="photoUrl" label="رابط صورة الموظف" error={e.photoUrl?.message}>
            <IndustrialInput id="photoUrl" type="url" placeholder="https://..." {...register("photoUrl")} />
          </IndustrialField>
          <IndustrialField id="notes" label="ملاحظات" error={e.notes?.message} className="md:col-span-2">
            <IndustrialInput id="notes" {...register("notes")} />
          </IndustrialField>
        </div>
      </FormSection>

      {mode === "edit" ? (
        <FormSection
          title="الأداء والحالة التشغيلية"
          description="تُحفظ في جدول الموظفين (الأداء، الموثوقية، كفاءة السلامة/الإنتاج)"
          className="border-sf-stroke/40 bg-sf-panel/60 text-sf-copy shadow-industrial [&_h3]:text-sf-ink [&_p]:text-sf-muted"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <IndustrialField id="status" label="حالة التوظيف" required error={e.status?.message}>
              <IndustrialSelect id="status" {...register("status")}>
                <option value="active">نشط</option>
                <option value="suspended">موقوف</option>
                <option value="probation">تحت المراقبة</option>
                <option value="terminated">منتهي</option>
              </IndustrialSelect>
            </IndustrialField>
            <IndustrialField id="performanceScore" label="درجة الأداء" required error={e.performanceScore?.message}>
              <IndustrialInput id="performanceScore" type="number" min={0} max={100} {...register("performanceScore")} monospace />
            </IndustrialField>
            <IndustrialField id="reliabilityScore" label="الموثوقية" required error={e.reliabilityScore?.message}>
              <IndustrialInput id="reliabilityScore" type="number" min={0} max={100} {...register("reliabilityScore")} monospace />
            </IndustrialField>
            <IndustrialField id="productionEff" label="كفاءة السلامة / إنتاج %" required error={e.productionEff?.message}>
              <IndustrialInput id="productionEff" type="number" min={0} max={100} {...register("productionEff")} monospace />
            </IndustrialField>
            <IndustrialField id="annualLeaveBalance" label="رصيد الإجازة (يوم)" required error={e.annualLeaveBalance?.message}>
              <IndustrialInput id="annualLeaveBalance" type="number" min={0} {...register("annualLeaveBalance")} monospace />
            </IndustrialField>
          </div>
        </FormSection>
      ) : null}
    </>
  );
}

export function ManagedEmployeeCreateForm() {
  const router = useRouter();
  const { catalog, catalogLoading, catalogError, createEmployee, hydrated } = useEmployeeRegistry();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<EmployeeFormInput>({ resolver: zodResolver(employeeFormSchema), defaultValues: emptyCreate });

  useEffect(() => {
    if (!catalog) return;
    form.reset({
      ...emptyCreate,
      hallId: catalog.halls[0]?.id ?? "",
      departmentId: catalog.departments[0]?.id ?? "",
      jobRoleId: catalog.jobRoles[0]?.id ?? "",
      shiftId: catalog.shifts[0]?.id ?? ""
    });
  }, [catalog, form]);

  if (catalogLoading || !hydrated || !catalog) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse space-y-6 rounded-xl border border-sf-hairline bg-sf-panel/40 p-8">
        <div className="h-8 w-1/3 rounded bg-sf-deep" />
        <div className="h-40 rounded-lg bg-sf-deep/80" />
      </div>
    );
  }

  if (catalogError) {
    return (
      <div className="mx-auto max-w-4xl rounded-xl border border-sf-alarm/40 bg-sf-alarm/10 p-6 text-sm text-sf-ink">
        تعذر تحميل المرجعيات من خادم القوى العاملة. تأكد من تشغيل workforce-api وضبط{" "}
        <span className="font-mono text-xs">NEXT_PUBLIC_WORKFORCE_API_URL</span> (مثال: http://localhost:4000/api/v1).
        <p className="mt-2 text-sf-muted">{catalogError}</p>
      </div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={form.handleSubmit(async (data) => {
        setSubmitError(null);
        try {
          await createEmployee(data);
          router.push("/ar/workforce/employees" as Route);
          router.refresh();
        } catch (err) {
          const msg = err instanceof WorkforceApiError ? err.message : err instanceof Error ? err.message : "فشل الإنشاء";
          setSubmitError(msg);
        }
      })}
      className="mx-auto max-w-4xl space-y-8"
    >
      <FormHeader mode="create" />
      {submitError ? <p className="rounded-lg border border-sf-alarm/35 bg-sf-alarm/10 px-3 py-2 text-sm text-sf-alarm">{submitError}</p> : null}
      <SharedFields register={form.register as never} errors={form.formState.errors} mode="create" catalog={catalog} />
    </motion.form>
  );
}

export function ManagedEmployeeEditForm({ employee }: { employee: ManagedEmployee }) {
  const router = useRouter();
  const { catalog, catalogLoading, catalogError, updateEmployee, hydrated } = useEmployeeRegistry();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<FullEmployeeEditInput>({
    resolver: zodResolver(fullEmployeeEditSchema),
    defaultValues: defaultsFromEmployee(employee)
  });

  useEffect(() => {
    form.reset(defaultsFromEmployee(employee));
  }, [employee, form]);

  if (catalogLoading || !hydrated || !catalog) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse space-y-6 rounded-xl border border-sf-hairline bg-sf-panel/40 p-8">
        <div className="h-8 w-1/3 rounded bg-sf-deep" />
        <div className="h-40 rounded-lg bg-sf-deep/80" />
      </div>
    );
  }

  if (catalogError) {
    return (
      <div className="mx-auto max-w-4xl rounded-xl border border-sf-alarm/40 bg-sf-alarm/10 p-6 text-sm text-sf-ink">
        تعذر تحميل المرجعيات. راجع اتصال <span className="font-mono text-xs">NEXT_PUBLIC_WORKFORCE_API_URL</span>.
        <p className="mt-2 text-sf-muted">{catalogError}</p>
      </div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={form.handleSubmit(async (data) => {
        setSubmitError(null);
        try {
          await updateEmployee(employee.id, data);
          router.push(`/ar/workforce/employees/${encodeURIComponent(employee.id)}` as Route);
          router.refresh();
        } catch (err) {
          const msg = err instanceof WorkforceApiError ? err.message : err instanceof Error ? err.message : "فشل الحفظ";
          setSubmitError(msg);
        }
      })}
      className="mx-auto max-w-4xl space-y-8"
    >
      <FormHeader mode="edit" />
      {submitError ? <p className="rounded-lg border border-sf-alarm/35 bg-sf-alarm/10 px-3 py-2 text-sm text-sf-alarm">{submitError}</p> : null}
      <SharedFields register={form.register as never} errors={form.formState.errors} mode="edit" catalog={catalog} />
    </motion.form>
  );
}

function FormHeader({ mode }: { mode: "create" | "edit" }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-sf-muted">WFM · FORM</p>
        <h1 className="mt-1 text-2xl font-bold text-sf-ink">{mode === "create" ? "تسجيل عامل جديد" : "تعديل بيانات العامل"}</h1>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="sfGhost" className="rounded-xl" asChild>
          <Link href={"/ar/workforce/employees" as Route}>رجوع</Link>
        </Button>
        <Button type="submit" variant="sfAccent" className="rounded-xl">
          {mode === "create" ? "إنشاء السجل" : "حفظ التعديلات"}
        </Button>
      </div>
    </div>
  );
}
