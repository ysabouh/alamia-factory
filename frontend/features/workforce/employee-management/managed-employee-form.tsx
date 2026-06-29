"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useId, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Control, FieldErrors, FieldValues, Resolver, UseFormRegister } from "react-hook-form";
import { Controller, FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ImagePlus, Trash2, Upload } from "lucide-react";

import { WfmField, WfmInput, WfmSelect, WfmTextarea } from "@/components/workforce/atlas";
import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { WorkforceApiError } from "@/lib/api/workforce-client";
import { useFactoryAuth } from "@/contexts/factory-auth-context";

import { EmployeeSystemAccessCard } from "@/features/access-control/employee-system-access-card";

import { EmployeeManagerPicker } from "./components/employee-manager-picker";
import { SalaryCurrencyField } from "./components/salary-currency-field";
import { defaultCurrencyId, EMPTY_WORKFORCE_CATALOG } from "./workforce-employee-mapper";
import { useEmployeeRegistry } from "./employee-registry-context";
import type { WorkforceCatalogJson } from "./workforce-api-types";
import { workforceMastersApi } from "@/lib/api/workforce-masters-client";
import type { DepartmentOrgPositionJson } from "./org-chart/org-chart-types";
import {
  employeeFormSchemaWithCatalog,
  fullEmployeeEditSchemaWithCatalog,
  isGeneralManagerJobRole,
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
  orgPositionId: "",
  reportsToId: "",
  jobRoleId: "",
  shiftId: "",
  salary: 4000,
  currencyId: "",
  hireDate: new Date().toISOString().slice(0, 10),
  photoUrl: "",
  notes: ""
};

async function compressImageToDataUrl(file: File, maxW = 800, quality = 0.82): Promise<string> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error("تعذّر قراءة الصورة");
  let w = bitmap.width;
  let h = bitmap.height;
  if (w > maxW) {
    h = (h * maxW) / w;
    w = maxW;
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  let q = quality;
  let data = canvas.toDataURL("image/jpeg", q);
  while (data.length > 1_800_000 && q > 0.45) {
    q -= 0.07;
    data = canvas.toDataURL("image/jpeg", q);
  }
  if (data.length > 2_500_000) throw new Error("الصورة ما زالت كبيرة جداً بعد الضغط — جرّب صورة أصغر");
  return data;
}

function EmployeePhotoField({ control, disabled }: { control: Control<Record<string, unknown>>; disabled?: boolean }) {
  const inputId = useId();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <Controller
      name="photoUrl"
      control={control}
      render={({ field: { value, onChange } }) => {
        const src = typeof value === "string" && value.trim() !== "" ? value.trim() : null;
        return (
          <div className="space-y-3">
            <div
              className={cn(
                "relative flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-sm border-2 border-dashed p-4 transition-colors",
                disabled ? "border-atlas-rule/30 opacity-50" : "border-sf-accentCool/35 bg-atlas-canvas/40 hover:border-sf-accentCool/55"
              )}
            >
              <input
                id={inputId}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={disabled || busy}
                onChange={async (ev) => {
                  const f = ev.target.files?.[0];
                  ev.target.value = "";
                  if (!f) return;
                  setErr(null);
                  setBusy(true);
                  try {
                    onChange(await compressImageToDataUrl(f));
                  } catch (e) {
                    setErr(e instanceof Error ? e.message : "فشل التحميل");
                  } finally {
                    setBusy(false);
                  }
                }}
              />
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt=""
                  className="max-h-32 max-w-full rounded-lg border border-atlas-rule/50 object-contain shadow-inner"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-center text-atlas-muted">
                  <ImagePlus className="h-10 w-10 text-atlas-brand/80" aria-hidden />
                  <p className="text-sm">اسحب صورة هنا أو اختر ملفاً (JPEG / PNG / WebP)</p>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button type="button" variant="atlasOutline" className="h-9 rounded-lg gap-1.5 px-3 text-xs" asChild disabled={disabled || busy}>
                  <label htmlFor={inputId} className="cursor-pointer">
                    <Upload className="h-4 w-4" aria-hidden />
                    {busy ? "جاري الضغط…" : "اختيار صورة"}
                  </label>
                </Button>
                {src ? (
                  <Button
                    type="button"
                    variant="atlasOutline"
                    className="h-9 rounded-lg gap-1.5 px-3 text-xs text-sf-alarm"
                    disabled={disabled || busy}
                    onClick={() => onChange("")}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    إزالة
                  </Button>
                ) : null}
              </div>
            </div>
            {!src?.startsWith("data:") ? (
              <WfmField id="photoUrl-fallback" label="أو الصق رابط الصورة (اختياري)" error={undefined}>
                <WfmInput
                  id="photoUrl-fallback"
                  type="url"
                  placeholder="https://..."
                  value={src?.startsWith("http") ? src : ""}
                  onChange={(ev) => {
                    const v = ev.target.value.trim();
                    onChange(v);
                  }}
                  disabled={disabled}
                />
              </WfmField>
            ) : (
              <p className="text-xs text-atlas-muted">لاستخدام رابط بدلاً من الملف: احذف الصورة بالزر أعلاه ثم ألصق الرابط.</p>
            )}
            {err ? <p className="text-xs text-sf-alarm">{err}</p> : null}
          </div>
        );
      }}
    />
  );
}

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
    orgPositionId: e.orgPositionId ?? "",
    reportsToId: e.reportsToId ?? "",
    jobRoleId: e.jobRoleId ?? "",
    shiftId: e.shiftId ?? "",
    salary: e.salary,
    currencyId: e.currencyId ?? "",
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
  catalog,
  control,
  editEmployeeId
}: {
  register: UseFormRegister<EmployeeFormInput & FullEmployeeEditInput>;
  errors: FieldErrors<EmployeeFormInput> | FieldErrors<FullEmployeeEditInput>;
  mode: "create" | "edit";
  catalog: WorkforceCatalogJson;
  control: Control<FieldValues>;
  editEmployeeId?: string;
}) {
  const e = errors as FieldErrors<FullEmployeeEditInput>;
  const jobRoleId = useWatch({ control, name: "jobRoleId" }) ?? "";
  const departmentId = useWatch({ control, name: "departmentId" }) ?? "";
  const isGm = isGeneralManagerJobRole(String(jobRoleId), catalog);
  const { setValue } = useFormContext<FieldValues>();
  const [orgPositions, setOrgPositions] = useState<DepartmentOrgPositionJson[]>([]);
  const [deptIsLeaf, setDeptIsLeaf] = useState(false);

  useEffect(() => {
    if (isGm) setValue("reportsToId", "");
  }, [isGm, setValue]);

  useEffect(() => {
    if (!String(departmentId).trim()) {
      setOrgPositions([]);
      setDeptIsLeaf(false);
      return;
    }
    void (async () => {
      try {
        const res = await workforceMastersApi.listOrgPositions(String(departmentId).trim());
        setOrgPositions(res.data);
        setDeptIsLeaf(res.meta.isLeaf);
      } catch {
        setOrgPositions([]);
        setDeptIsLeaf(false);
      }
    })();
  }, [departmentId]);

  const opt = (items: { id: string; name: string }[]) => (
    <>
      <option value="">— بدون / لاحقاً —</option>
      {items.map((x) => (
        <option key={x.id} value={x.id}>
          {x.name}
        </option>
      ))}
    </>
  );
  return (
    <>
      <FormSection
        title="الهوية والربط الوظيفي"
        description="حقول أساسية للتشغيل الصناعي"
        className="border-atlas-rule/40 bg-atlas-paper/60 text-atlas-slate shadow-atlasCard [&_h3]:text-atlas-ink [&_p]:text-atlas-muted"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <WfmField id="employeeNumber" label="الرقم الوظيفي" required error={e.employeeNumber?.message}>
            <WfmInput id="employeeNumber" {...register("employeeNumber")} monospace />
          </WfmField>
          <WfmField id="nationalId" label="الهوية الوطنية" required error={e.nationalId?.message}>
            <WfmInput id="nationalId" {...register("nationalId")} />
          </WfmField>
          <WfmField id="firstName" label="الاسم الأول" required error={e.firstName?.message}>
            <WfmInput id="firstName" {...register("firstName")} />
          </WfmField>
          <WfmField id="lastName" label="اسم العائلة" required error={e.lastName?.message}>
            <WfmInput id="lastName" {...register("lastName")} />
          </WfmField>
          <WfmField id="gender" label="الجنس" required error={e.gender?.message}>
            <WfmSelect id="gender" {...register("gender")}>
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
              <option value="other">آخر</option>
            </WfmSelect>
          </WfmField>
          <WfmField id="birthDate" label="تاريخ الميلاد" required error={e.birthDate?.message}>
            <WfmInput id="birthDate" type="date" {...register("birthDate")} />
          </WfmField>
        </div>
      </FormSection>

      <FormSection
        title="الاتصال والعنوان"
        className="border-atlas-rule/40 bg-atlas-paper/60 text-atlas-slate shadow-atlasCard [&_h3]:text-atlas-ink [&_p]:text-atlas-muted"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <WfmField id="phone" label="الجوال" required error={e.phone?.message}>
            <WfmInput id="phone" type="tel" {...register("phone")} />
          </WfmField>
          <WfmField id="emergencyPhone" label="جوال الطوارئ" required error={e.emergencyPhone?.message}>
            <WfmInput id="emergencyPhone" type="tel" {...register("emergencyPhone")} />
          </WfmField>
          <WfmField id="email" label="البريد الإلكتروني (اختياري)" error={e.email?.message} className="md:col-span-2">
            <WfmInput id="email" type="email" placeholder="name@example.com" {...register("email")} />
          </WfmField>
          <WfmField id="address" label="العنوان" required error={e.address?.message} className="md:col-span-2">
            <WfmInput id="address" {...register("address")} />
          </WfmField>
        </div>
      </FormSection>

      <FormSection
        title="التنظيم — قاعة، قسم، دور، وردية (قاعدة البيانات)"
        description="يُحمّل من Laravel (/workforce/meta). إذا كانت القوائم فارغة راجع قاعدة البيانات والـ seed."
        className="border-atlas-rule/40 bg-atlas-paper/60 text-atlas-slate shadow-atlasCard [&_h3]:text-atlas-ink [&_p]:text-atlas-muted"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <WfmField id="hallId" label="القاعة" error={e.hallId?.message}>
            <WfmSelect id="hallId" {...register("hallId")}>{opt(catalog.halls)}</WfmSelect>
          </WfmField>
          <WfmField id="departmentId" label="القسم" error={e.departmentId?.message}>
            <WfmSelect id="departmentId" {...register("departmentId")}>{opt(catalog.departments)}</WfmSelect>
          </WfmField>
          {deptIsLeaf ? (
            <WfmField id="orgPositionId" label="المنصب التنظيمي" hint="اختياري — للأقسام النهائية فقط" error={e.orgPositionId?.message}>
              <WfmSelect id="orgPositionId" {...register("orgPositionId")}>
                <option value="">— بدون منصب —</option>
                {orgPositions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </WfmSelect>
            </WfmField>
          ) : null}
          <WfmField id="jobRoleId" label="الدور الوظيفي" error={e.jobRoleId?.message}>
            <WfmSelect id="jobRoleId" {...register("jobRoleId")}>{opt(catalog.jobRoles)}</WfmSelect>
          </WfmField>
          <WfmField id="shiftId" label="الوردية" error={e.shiftId?.message}>
            <WfmSelect id="shiftId" {...register("shiftId")}>{opt(catalog.shifts)}</WfmSelect>
          </WfmField>
          {isGm ? (
            <WfmField
              id="reportsToId"
              label="المدير المباشر"
              hint="دور المدير العام لا يتطلب مديراً مباشراً"
            >
              <WfmInput id="reportsToId" value="—" disabled readOnly />
            </WfmField>
          ) : (
            <WfmField id="reportsToId" label="المدير المباشر" required error={e.reportsToId?.message}>
              <Controller
                name="reportsToId"
                control={control}
                render={({ field }) => (
                  <EmployeeManagerPicker
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    excludeEmployeeId={editEmployeeId}
                  />
                )}
              />
            </WfmField>
          )}
        </div>
      </FormSection>

      <FormSection
        title="التعويضات والتواريخ"
        className="border-atlas-rule/40 bg-atlas-paper/60 text-atlas-slate shadow-atlasCard [&_h3]:text-atlas-ink [&_p]:text-atlas-muted"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <SalaryCurrencyField
            control={control}
            catalog={catalog}
            currencyError={e.currencyId?.message}
            salaryError={e.salary?.message}
          />
          <WfmField id="hireDate" label="تاريخ التعيين" required error={e.hireDate?.message}>
            <WfmInput id="hireDate" type="date" {...register("hireDate")} />
          </WfmField>
          <WfmField id="photoUrl" label="صورة الموظف" error={e.photoUrl?.message} className="md:col-span-2">
            <EmployeePhotoField control={control as unknown as Control<Record<string, unknown>>} />
          </WfmField>
          <WfmField id="notes" label="ملاحظات" error={e.notes?.message} className="md:col-span-2">
            <WfmTextarea id="notes" rows={5} placeholder="ملاحظات إدارية، شهادات، قيود…" {...register("notes")} />
          </WfmField>
        </div>
      </FormSection>

      {mode === "edit" ? (
        <FormSection
          title="الأداء والحالة التشغيلية"
          description="تُحفظ في جدول الموظفين (الأداء، الموثوقية، كفاءة السلامة/الإنتاج)"
          className="border-atlas-rule/40 bg-atlas-paper/60 text-atlas-slate shadow-atlasCard [&_h3]:text-atlas-ink [&_p]:text-atlas-muted"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <WfmField id="status" label="حالة التوظيف" required error={e.status?.message}>
              <WfmSelect id="status" {...register("status")}>
                <option value="active">نشط</option>
                <option value="suspended">موقوف</option>
                <option value="probation">تحت المراقبة</option>
                <option value="terminated">منتهي</option>
              </WfmSelect>
            </WfmField>
            <WfmField id="performanceScore" label="درجة الأداء" required error={e.performanceScore?.message}>
              <WfmInput id="performanceScore" type="number" min={0} max={100} {...register("performanceScore")} monospace />
            </WfmField>
            <WfmField id="reliabilityScore" label="الموثوقية" required error={e.reliabilityScore?.message}>
              <WfmInput id="reliabilityScore" type="number" min={0} max={100} {...register("reliabilityScore")} monospace />
            </WfmField>
            <WfmField id="productionEff" label="كفاءة السلامة / إنتاج %" required error={e.productionEff?.message}>
              <WfmInput id="productionEff" type="number" min={0} max={100} {...register("productionEff")} monospace />
            </WfmField>
            <WfmField id="annualLeaveBalance" label="رصيد الإجازة (يوم)" required error={e.annualLeaveBalance?.message}>
              <WfmInput id="annualLeaveBalance" type="number" min={0} {...register("annualLeaveBalance")} monospace />
            </WfmField>
          </div>
        </FormSection>
      ) : null}
    </>
  );
}

export function ManagedEmployeeCreateForm() {
  const { can } = useFactoryAuth();
  const { catalog, catalogLoading, catalogError, createEmployee, hydrated } = useEmployeeRegistry();
  const activeCatalog = catalog ?? EMPTY_WORKFORCE_CATALOG;

  if (catalogLoading && !catalog) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse space-y-6 rounded-sm border border-atlas-rule bg-atlas-paper/40 p-8">
        <div className="h-8 w-1/3 rounded bg-atlas-canvas" />
        <div className="h-40 rounded-lg bg-atlas-canvas/80" />
      </div>
    );
  }

  if (!hydrated && catalogLoading) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse space-y-6 rounded-sm border border-atlas-rule bg-atlas-paper/40 p-8">
        <div className="h-8 w-1/3 rounded bg-atlas-canvas" />
        <div className="h-40 rounded-lg bg-atlas-canvas/80" />
      </div>
    );
  }

  if (!can("workforce.manage_employees")) {
    return (
      <div className="mx-auto max-w-2xl rounded-sm border border-sf-caution/40 bg-sf-caution/10 p-6 text-center text-atlas-ink" dir="rtl">
        <p className="font-semibold">لا تملك صلاحية إضافة موظف</p>
        <p className="mt-2 text-sm text-atlas-muted">
          الصلاحية المطلوبة: <span className="font-mono text-xs">workforce.manage_employees</span>
        </p>
        <Button asChild type="button" variant="atlasPrimary" className="mt-6 rounded-sm">
          <Link href={"/ar/workforce/employees" as Route}>العودة للسجل</Link>
        </Button>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl animate-pulse space-y-6 rounded-sm border border-atlas-rule bg-atlas-paper/40 p-8">
          <div className="h-8 w-1/3 rounded bg-atlas-canvas" />
          <div className="h-40 rounded-lg bg-atlas-canvas/80" />
        </div>
      }
    >
      <ManagedEmployeeCreateFormBody
        catalog={activeCatalog}
        catalogError={catalogError}
        createEmployee={createEmployee}
      />
    </Suspense>
  );
}

function ManagedEmployeeCreateFormBody({
  catalog,
  catalogError,
  createEmployee
}: {
  catalog: WorkforceCatalogJson;
  catalogError: string | null;
  createEmployee: (data: EmployeeFormInput) => Promise<ManagedEmployee>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledDepartmentId = searchParams.get("departmentId") ?? "";
  const [submitError, setSubmitError] = useState<string | null>(null);
  const resolvedDepartmentId =
    prefilledDepartmentId && catalog.departments.some((d) => d.id === prefilledDepartmentId)
      ? prefilledDepartmentId
      : catalog.departments[0]?.id ?? "";
  const form = useForm<EmployeeFormInput>({
    resolver: zodResolver(employeeFormSchemaWithCatalog(catalog)) as Resolver<EmployeeFormInput>,
    defaultValues: {
      ...emptyCreate,
      hallId: catalog.halls[0]?.id ?? "",
      departmentId: resolvedDepartmentId,
      jobRoleId: catalog.jobRoles[0]?.id ?? "",
      shiftId: catalog.shifts[0]?.id ?? "",
      currencyId: defaultCurrencyId(catalog)
    }
  });

  useEffect(() => {
    if (resolvedDepartmentId) {
      form.setValue("departmentId", resolvedDepartmentId);
    }
  }, [form, resolvedDepartmentId]);

  return (
    <FormProvider {...form}>
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
        {catalogError ? (
          <div className="rounded-sm border border-amber-500/35 bg-amber-500/10 p-4 text-sm text-atlas-ink">
            <p className="font-semibold text-amber-100">تنبيه مرجعيات</p>
            <p className="mt-1 text-atlas-muted">{catalogError}</p>
          </div>
        ) : null}
        {submitError ? <p className="rounded-lg border border-sf-alarm/35 bg-sf-alarm/10 px-3 py-2 text-sm text-sf-alarm">{submitError}</p> : null}
        <SharedFields
          register={form.register as never}
          errors={form.formState.errors}
          mode="create"
          catalog={catalog}
          control={form.control as unknown as Control<FieldValues>}
        />
      </motion.form>
    </FormProvider>
  );
}

export function ManagedEmployeeEditForm({
  employee,
  onEmployeeUpdated
}: {
  employee: ManagedEmployee;
  onEmployeeUpdated?: (next: ManagedEmployee) => void;
}) {
  const { can } = useFactoryAuth();
  const { catalog, catalogLoading, catalogError, updateEmployee, hydrated } = useEmployeeRegistry();
  const activeCatalog = catalog ?? EMPTY_WORKFORCE_CATALOG;

  if (catalogLoading && !catalog) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse space-y-6 rounded-sm border border-atlas-rule bg-atlas-paper/40 p-8">
        <div className="h-8 w-1/3 rounded bg-atlas-canvas" />
        <div className="h-40 rounded-lg bg-atlas-canvas/80" />
      </div>
    );
  }

  if (!can("workforce.manage_employees")) {
    return (
      <div className="mx-auto max-w-2xl rounded-sm border border-sf-caution/40 bg-sf-caution/10 p-6 text-center text-atlas-ink" dir="rtl">
        <p className="font-semibold">لا تملك صلاحية تعديل الموظفين</p>
        <p className="mt-2 text-sm text-atlas-muted">الصلاحية المطلوبة: <span className="font-mono text-xs">workforce.manage_employees</span></p>
        <Button asChild type="button" variant="atlasPrimary" className="mt-6 rounded-sm">
          <Link href={`/ar/workforce/employees/${encodeURIComponent(employee.id)}` as Route}>عرض التفاصيل</Link>
        </Button>
      </div>
    );
  }

  return (
    <ManagedEmployeeEditFormBody
      employee={employee}
      catalog={activeCatalog}
      catalogError={catalogError}
      updateEmployee={updateEmployee}
      onEmployeeUpdated={onEmployeeUpdated}
    />
  );
}

function ManagedEmployeeEditFormBody({
  employee,
  catalog,
  catalogError,
  updateEmployee,
  onEmployeeUpdated
}: {
  employee: ManagedEmployee;
  catalog: WorkforceCatalogJson;
  catalogError: string | null;
  updateEmployee: (id: string, data: FullEmployeeEditInput) => Promise<ManagedEmployee>;
  onEmployeeUpdated?: (next: ManagedEmployee) => void;
}) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<FullEmployeeEditInput>({
    resolver: zodResolver(fullEmployeeEditSchemaWithCatalog(catalog)) as Resolver<FullEmployeeEditInput>,
    defaultValues: defaultsFromEmployee(employee)
  });

  useEffect(() => {
    form.reset(defaultsFromEmployee(employee));
  }, [employee, form]);

  return (
    <FormProvider {...form}>
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
            let msg = err instanceof WorkforceApiError ? err.message : err instanceof Error ? err.message : "فشل الحفظ";
            if (msg.toLowerCase().includes("unauthorized")) {
              msg =
                "غير مصرّح — تحتاج صلاحية workforce.manage_employees. سجّل الخروج ثم الدخول بـ admin@myfactory.local أو راجع صفحة الصلاحيات.";
            }
            setSubmitError(msg);
          }
        })}
        className="mx-auto max-w-4xl space-y-8"
      >
        <FormHeader mode="edit" />
        {catalogError ? (
          <div className="rounded-sm border border-amber-500/35 bg-amber-500/10 p-4 text-sm text-atlas-ink">
            <p className="font-semibold text-amber-100">تنبيه مرجعيات</p>
            <p className="mt-1 text-atlas-muted">{catalogError}</p>
          </div>
        ) : null}
        {submitError ? <p className="rounded-lg border border-sf-alarm/35 bg-sf-alarm/10 px-3 py-2 text-sm text-sf-alarm">{submitError}</p> : null}
        <EmployeeSystemAccessCard
          employee={employee}
          onUpdated={(patch) => onEmployeeUpdated?.({ ...employee, ...patch })}
        />
        <SharedFields
          register={form.register as never}
          errors={form.formState.errors}
          mode="edit"
          catalog={catalog}
          control={form.control as unknown as Control<FieldValues>}
          editEmployeeId={employee.id}
        />
      </motion.form>
    </FormProvider>
  );
}

function FormHeader({ mode }: { mode: "create" | "edit" }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-atlas-muted">WFM · FORM</p>
        <h1 className="mt-1 text-2xl font-bold text-atlas-ink">{mode === "create" ? "تسجيل عامل جديد" : "تعديل بيانات العامل"}</h1>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="atlasOutline" className="rounded-sm" asChild>
          <Link href={"/ar/workforce/employees" as Route}>رجوع</Link>
        </Button>
        <Button type="submit" variant="atlasPrimary" className="rounded-sm">
          {mode === "create" ? "إنشاء السجل" : "حفظ التعديلات"}
        </Button>
      </div>
    </div>
  );
}
