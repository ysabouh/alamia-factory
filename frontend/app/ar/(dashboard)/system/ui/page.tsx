"use client";

import { useCallback, useId, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, Cpu, Gauge } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  IndustrialField,
  IndustrialInput,
  IndustrialSelect,
  IndustrialTable,
  IndustrialTableBody,
  IndustrialTableCell,
  IndustrialTableHead,
  IndustrialTableHeader,
  IndustrialTableRow,
  SFEyebrow,
  SFHeading,
  SfAlert,
  SfAlertRail,
  SfDrawer,
  sfPalette,
  SfKpiCard,
  SfModal,
  SfStatusBadge,
  SFTelemetry
} from "@/components/smart-factory";

type ToastItem = { id: string; variant: "info" | "success" | "caution" | "alarm"; title?: string; body: string };

const paletteLabels = Object.keys(sfPalette) as (keyof typeof sfPalette)[];

export default function SmartFactoryUiPage() {
  const formId = useId();
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const badgeTones = useMemo(
    () =>
      ["running", "idle", "planned", "maintenance", "alarm", "offline", "quality_hold", "neutral", "signal"] as const,
    []
  );

  const pushToast = useCallback((variant: ToastItem["variant"]) => {
    const id = crypto.randomUUID();
    const preset: Omit<ToastItem, "id"> =
      variant === "alarm"
        ? { variant, title: "Line 3 trip", body: "Motor overload — feeder interlock asserted." }
        : variant === "caution"
          ? {
              variant,
              title: "Recipe drift",
              body: "Thermal profile deviates ±2 °C vs setpoint baseline."
            }
          : variant === "success"
            ? { variant, title: "Batch released", body: "QA sign-off synchronized to MES lot B-8841." }
            : { variant, title: "Telemetry sync", body: "OPC UA bridge healthy — jitter 38 ms avg." };

    setToasts((prev) => [{ id, ...preset }, ...prev].slice(0, 5));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5200);
  }, []);

  return (
    <div className="space-y-10 pb-24">
      <header className="space-y-2">
        <SFEyebrow>SYSTEM · HMI LEXICON</SFEyebrow>
        <SFHeading className="text-pretty">
          لوحة مرجعية لتصميم الواجهة الصناعية الداكنة (Smart Factory)
        </SFHeading>
        <p className="max-w-prose font-industrial text-sm leading-relaxed text-sf-copy">
          مجموعة Tailwind المعتمدة على ألوان <SFTelemetry>sf.*</SFTelemetry>، طبقة من مكوّنات React مع{" "}
          <span className="text-teal-200/90">Radix Dialog</span> للنوافذ، و<span className="text-teal-200/90">
            Framer Motion
          </span>{" "}
          للحركة على البطاقات والتنبيهات.
        </p>
        <Link
          href="/ar"
          prefetch={false}
          className="inline-flex pt-2 text-xs font-semibold uppercase tracking-[0.2em] text-sf-accent hover:text-teal-200"
        >
          ← العودة للوحة القيادة
        </Link>
      </header>

      <section className="grid gap-4 rounded-module border border-sf-stroke/45 bg-gradient-to-br from-sf-chassis via-sf-panel to-sf-deep p-6 shadow-industrial lg:grid-cols-[240px_minmax(0,1fr)]">
        <div>
          <SFEyebrow>لوحة الألوان</SFEyebrow>
          <p className="mt-2 text-xs text-sf-muted">
            Tokens من <span className="font-mono text-[11px] text-sf-muted">tokens.ts</span> لاستخدام خارج Tailwind إن لزم.
          </p>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {paletteLabels.map((key) => (
            <li
              key={key}
              className="overflow-hidden rounded-xl border border-white/[0.06] bg-black/25 shadow-inner"
            >
              <div className="h-14 w-full" style={{ backgroundColor: sfPalette[key] }} />
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-sf-copy">{key}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SfKpiCard label="Throughput" value="742" subtitle="pieces / hr" Icon={Gauge} accent="neutral" delta={{ text: "+4.8%" }} />
        <SfKpiCard label="OEE pulse" value="86.4%" Icon={Cpu} accent="positive" delta={{ text: "+1.1%" }} />
        <SfKpiCard label="Energy index" value="12.9" subtitle="kWh per ton" Icon={Activity} accent="caution" delta={{ text: "-0.8%" }} />
      </section>

      <section className="rounded-module border border-sf-stroke/40 bg-sf-deep/60 p-6">
        <SFEyebrow>خط العرض الواسع والبيانات المعيارية</SFEyebrow>
        <div className="mt-6 space-y-2">
          <p className="font-industrial text-4xl tracking-tighter text-sf-ink md:text-[2.85rem]" style={{ fontFeatureSettings: '"tnum" 1' }}>
            SMART PLASTICS · PLANT‑04
          </p>
          <p className="font-telemetry text-sf-data text-sky-100">
            Telemetry stream — line speed 42.07 m/min · tension 612 N ±9
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-module border border-sf-stroke/40 bg-sf-deep/40 p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <SFEyebrow>جدول تشغيل</SFEyebrow>
            <SFHeading className="text-lg">خطوط، حالة، علامات</SFHeading>
          </div>
          <Button variant="sfAccent" size="sm" type="button" onClick={() => pushToast("info")}>
            إشعار قصير (Rail)
          </Button>
        </div>
        <IndustrialTable>
          <IndustrialTableHeader>
            <IndustrialTableRow>
              <IndustrialTableHead>Line</IndustrialTableHead>
              <IndustrialTableHead>Setpoint</IndustrialTableHead>
              <IndustrialTableHead>Δ</IndustrialTableHead>
              <IndustrialTableHead>Signal</IndustrialTableHead>
            </IndustrialTableRow>
          </IndustrialTableHeader>
          <IndustrialTableBody>
            <IndustrialTableRow>
              <IndustrialTableCell className="font-medium text-sf-ink">L3 · Extruder A</IndustrialTableCell>
              <IndustrialTableCell className="font-telemetry tracking-tight">210 °C</IndustrialTableCell>
              <IndustrialTableCell className="font-telemetry text-emerald-300">+0.3</IndustrialTableCell>
              <IndustrialTableCell>
                <SfStatusBadge tone="running" />
              </IndustrialTableCell>
            </IndustrialTableRow>
            <IndustrialTableRow>
              <IndustrialTableCell className="font-medium text-sf-ink">R1 · Dryer</IndustrialTableCell>
              <IndustrialTableCell className="font-telemetry tracking-tight">62 %RH</IndustrialTableCell>
              <IndustrialTableCell className="font-telemetry text-amber-200">−1.1</IndustrialTableCell>
              <IndustrialTableCell>
                <SfStatusBadge tone="idle" />
              </IndustrialTableCell>
            </IndustrialTableRow>
            <IndustrialTableRow>
              <IndustrialTableCell className="font-medium text-sf-ink">QC · Vision</IndustrialTableCell>
              <IndustrialTableCell className="font-telemetry tracking-tight">ΔE 1.06</IndustrialTableCell>
              <IndustrialTableCell className="font-telemetry text-red-300">HOLD</IndustrialTableCell>
              <IndustrialTableCell>
                <SfStatusBadge tone="quality_hold" />
              </IndustrialTableCell>
            </IndustrialTableRow>
          </IndustrialTableBody>
        </IndustrialTable>
      </section>

      <section className="rounded-module border border-sf-stroke/40 bg-sf-deep/55 p-6">
        <SFEyebrow>نماذج إدخال وأزرار</SFEyebrow>
        <SFHeading className="mb-6 text-lg">تحكم خام، أُطُر، حالات تأكيد</SFHeading>

        <form className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-5">
            <IndustrialField id={`${formId}-name`} label="Operator tag" hint="يظهر ضمن السجلات وبطاقات التصريح المؤقت.">
              <IndustrialInput id={`${formId}-name`} placeholder="e.g. A.MANSOUR · shift B" />
            </IndustrialField>
            <IndustrialField id={`${formId}-set`} label="Setpoint Δ" required>
              <IndustrialInput id={`${formId}-set`} type="number" step="0.1" defaultValue="0.4" monospace />
            </IndustrialField>
            <IndustrialField id={`${formId}-mode`} label="Run mode">
              <IndustrialSelect id={`${formId}-mode`} defaultValue="auto">
                <option value="auto">AUTO — closed loop</option>
                <option value="semi">SEMI — operator assist</option>
                <option value="maint">MAINT — interlocks relaxed</option>
              </IndustrialSelect>
            </IndustrialField>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sf-muted">Primary actions</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="sfAccent" type="button">
                Commit setpoint
              </Button>
              <Button variant="sfCool" type="button">
                Trace recipe
              </Button>
              <Button variant="sfMuted" type="button">
                Hold line
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="sfDanger" type="button">
                E‑stop sequence
              </Button>
              <Button variant="sfGhost" type="button">
                Cancel
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="sfAccent" type="button" onClick={() => setModalOpen(true)}>
                فتح نافذة حوار
              </Button>
              <Button variant="sfCool" type="button" onClick={() => setDrawerOpen(true)}>
                فتح لوحة جانبية
              </Button>
            </div>
          </div>
        </form>
      </section>

      <section className="rounded-module border border-sf-stroke/40 bg-sf-deep/50 p-6">
        <SFEyebrow>Operational chroma</SFEyebrow>
        <div className="mt-4 flex flex-wrap gap-2">
          {badgeTones.map((tone) => (
            <SfStatusBadge key={tone} tone={tone} />
          ))}
        </div>
      </section>

      <section className="rounded-module border border-sf-stroke/40 bg-sf-deep/50 p-6">
        <SFEyebrow>Alerts</SFEyebrow>
        <SFHeading className="mb-4 text-lg">حالات قابلة للقراءة من غرفة التحكم</SFHeading>
        <div className="grid gap-3 md:grid-cols-2">
          <SfAlert variant="info" title="MES sync">
            واجهات الأوامر تعمل عبر طبقة أمان قياسية؛ يُنصح بتسجيل كل تغيير خطوة خطوة.
          </SfAlert>
          <SfAlert variant="success" title="Run permit">
            كل شروط الانطلاق مُلباة — يمكن إطلاق السلسلة الآلية لهذه الخطوط.
          </SfAlert>
          <SfAlert variant="caution" title="Derate window">
            تبريد المقشور أعلى من المتوسط لمدة ست دقائق؛ راقب لوحة الحرارة.
          </SfAlert>
          <SfAlert variant="alarm" title="Interlock asserted">
            جهة التشغيل أوقفت المغذي بسبب نقص ضغط الهواء؛ أعد الضبط يدويًا بعد التفتيش.
          </SfAlert>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="sfMuted" size="sm" type="button" onClick={() => pushToast("success")}>
            نجاح إلى Rail
          </Button>
          <Button variant="sfMuted" size="sm" type="button" onClick={() => pushToast("caution")}>
            تحذير إلى Rail
          </Button>
          <Button variant="sfDanger" size="sm" type="button" onClick={() => pushToast("alarm")}>
            إنذار إلى Rail
          </Button>
        </div>
      </section>

      <SfModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="تأكيد تغيير المجموعة"
        description="سيتم تمييز الخط أثناء إعادة تهيئة جهاز التحكم. يُسمح فقط للمشغّلين مع صلاحيات L2."
        footer={
          <>
            <Button variant="sfGhost" type="button" onClick={() => setModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="sfAccent" type="button" onClick={() => setModalOpen(false)}>
              موافقة
            </Button>
          </>
        }
      >
        <ul className="list-inside list-disc space-y-2 text-sf-copy">
          <li>تجميد المنتج الحالي في المخازن الوسيطة ثم المطابقة مع MES.</li>
          <li>تسجيل رقم التفتيش واسم المشغّل في سجل التدقيق.</li>
        </ul>
      </SfModal>

      <SfDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title="طبقة الوصول السريع"
        description="مثال ورقة جانبية باستخدام Dialog نفس النموذج، مع ظلال وحواف منطبقة مع باقي النظام."
        footer={
          <Button variant="sfCool" type="button" onClick={() => setDrawerOpen(false)}>
            إغلاق
          </Button>
        }
      >
        <p className="text-sf-copy">
          ضع عناصر التصفية أو خرائط الاستشعار أو قوائم الأعطال المعزولة؛ الحركة تكون عبر فئات أنيميشن Tailwind{" "}
          <span className="font-mono text-xs text-sf-accentCool">slide-in-from-*</span>.
        </p>
      </SfDrawer>

      <SfAlertRail>
        {toasts.map((t) => (
          <SfAlert
            key={t.id}
            variant={t.variant}
            title={t.title}
            onDismiss={() => setToasts((p) => p.filter((x) => x.id !== t.id))}
          >
            {t.body}
          </SfAlert>
        ))}
      </SfAlertRail>
    </div>
  );
}