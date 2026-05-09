"use client";

import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState, useEffect } from "react";
import {
  ArrowUpRight,
  CalendarSync,
  Clock4,
  Factory,
  Gauge,
  Link2,
  Radio,
  Users,
  Wallet,
  Workflow
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { LiveDashboard } from "@/types/factory";

import { opsEmployeesFromDashboard } from "./ops-employees-from-dashboard";
import { WorkforceSmartEmployeeCard } from "./workforce-smart-employee-card";

const HALL_FILTERS = ["الكل", "قاعة الحقن", "قاعة النفخ", "التغليف", "إداري", "جميع القاعات"] as const;

function useLiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

function sparkPath(seed: string, points = 12) {
  const v: number[] = [];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = 0; i < points; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    v.push(4 + (h % 16));
  }
  const w = 80;
  const step = w / (points - 1);
  return v.map((y, i) => `${i * step},${y}`).join(" ");
}

export function WorkforceCrewBoard({ dashboard }: { dashboard: LiveDashboard }) {
  const clock = useLiveClock();
  const employees = useMemo(() => opsEmployeesFromDashboard(dashboard), [dashboard]);
  const [hallFilter, setHallFilter] = useState<string>("الكل");

  const filtered = useMemo(() => {
    if (hallFilter === "الكل") return employees;
    return employees.filter((e) => e.hall === hallFilter);
  }, [employees, hallFilter]);

  const kpis = useMemo(() => {
    const n = filtered.length || 1;
    const present = filtered.filter((e) => e.attendance === "present").length;
    const late = filtered.filter((e) => e.attendance === "late").length;
    const leave = filtered.filter((e) => e.attendance === "leave").length;
    const absent = filtered.filter((e) => e.attendance === "absent").length;
    const avgPerf = Math.round(filtered.reduce((s, e) => s + e.performance, 0) / n);
    const avgRel = Math.round(filtered.reduce((s, e) => s + e.reliability, 0) / n);
    return {
      headcount: filtered.length,
      present,
      presentPct: Math.round((present / n) * 100),
      late,
      leave,
      absent,
      avgPerf,
      avgRel
    };
  }, [filtered]);

  const shiftBuckets = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of filtered) {
      const k = e.shift || "—";
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const attendancePct = useMemo(() => {
    const n = filtered.length || 1;
    return {
      present: Math.round((filtered.filter((e) => e.attendance === "present").length / n) * 100),
      late: Math.round((filtered.filter((e) => e.attendance === "late").length / n) * 100),
      leave: Math.round((filtered.filter((e) => e.attendance === "leave").length / n) * 100),
      absent: Math.round((filtered.filter((e) => e.attendance === "absent").length / n) * 100)
    };
  }, [filtered]);

  const topPerformers = useMemo(() => [...filtered].sort((a, b) => b.performance - a.performance).slice(0, 4), [filtered]);

  const deptPerf = useMemo(() => {
    const m = new Map<string, { sum: number; n: number }>();
    for (const e of filtered) {
      const cur = m.get(e.department) ?? { sum: 0, n: 0 };
      cur.sum += e.performance;
      cur.n += 1;
      m.set(e.department, cur);
    }
    return Array.from(m.entries())
      .map(([name, { sum, n }]) => ({ name, avg: Math.round(sum / n) }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5);
  }, [filtered]);

  const dateStr = clock.toLocaleDateString("ar-SA-u-ca-gregory", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  const timeStr = clock.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="relative">
      {/* Masthead — شريط انحداري، ليس عنوانًا وسطيًا */}
      <header className="relative mb-8 overflow-hidden rounded-sm border border-atlas-rule bg-atlas-paper shadow-atlasCard">
        <div
          className="absolute inset-y-0 start-0 w-1.5 bg-gradient-to-b from-atlas-brand via-atlas-brand/70 to-atlas-accent"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 px-5 py-6 ps-8 md:flex-row md:items-end md:justify-between md:px-8 md:py-7">
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-atlas-muted">
              <Workflow className="h-3.5 w-3.5 text-atlas-brand" aria-hidden />
              سجل الطاقم · Workforce
            </div>
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-atlas-ink md:text-[1.75rem]">
              لوحة إدارة القوى العاملة
            </h1>
            <p className="text-sm leading-relaxed text-atlas-slate">
              قراءة مباشرة من بيانات اللوحة الحية — بدون تخطيط بطاقات متكرر؛ قناة رئيسية للطاقم وقناة جانبية للسياق والأداء.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-sm border border-atlas-rule bg-atlas-canvas px-2.5 py-1 text-xs font-medium text-atlas-ink">
                <CalendarSync className="h-3.5 w-3.5 text-atlas-brand" aria-hidden />
                {dateStr}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-sm border border-atlas-accent/25 bg-atlas-accent/10 px-2.5 py-1 font-mono text-xs font-semibold text-atlas-accent">
                <Clock4 className="h-3.5 w-3.5" aria-hidden />
                {timeStr}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <Link
              href={"/ar/workforce/finance" as Route}
              className="inline-flex items-center justify-center gap-2 rounded-sm border border-atlas-rule bg-atlas-canvas px-4 py-2.5 text-sm font-semibold text-atlas-brand transition hover:border-atlas-brand/40 hover:bg-atlas-brandSoft"
            >
              <Wallet className="h-4 w-4" aria-hidden />
              مركز القوى المالية
              <ArrowUpRight className="h-3.5 w-3.5 opacity-70" aria-hidden />
            </Link>
            <Button type="button" variant="atlasPrimary" className="rounded-sm shadow-atlasBar">
              مزامنة السجل
            </Button>
          </div>
        </div>
      </header>

      {/* KPI — صف دفتري مقسوم، ليس شبكة بطاقات */}
      <section
        className="mb-8 flex flex-wrap divide-y divide-atlas-rule border border-atlas-rule bg-atlas-paper shadow-atlasCard md:flex-nowrap md:divide-x md:divide-y-0 rtl:divide-x-reverse"
        aria-label="مؤشرات موجزة"
      >
        {[
          { k: "الرؤوس", v: String(kpis.headcount), hint: "بعد التصفية" },
          { k: "حضور فعلي", v: `${kpis.presentPct}%`, hint: `${kpis.present} حاضر` },
          { k: "متوسط الأداء", v: String(kpis.avgPerf), hint: "مؤشر مركّب" },
          { k: "متوسط الالتزام", v: String(kpis.avgRel), hint: "موثوقية" },
          { k: "تأخر اليوم", v: String(kpis.late), hint: `إجازة ${kpis.leave} · غياب ${kpis.absent}` }
        ].map((cell) => (
          <div key={cell.k} className="min-w-[140px] flex-1 px-4 py-4 md:py-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-atlas-muted">{cell.k}</p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-atlas-ink">{cell.v}</p>
            <p className="mt-0.5 text-[11px] text-atlas-muted">{cell.hint}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_288px] xl:items-start xl:gap-10">
        {/* العمود الرئيسي */}
        <div className="min-w-0 space-y-10">
          {/* بطاقات الموظفين — أعمدة متفاوتة الارتفاع */}
          <section aria-labelledby="crew-roster-heading">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <h2 id="crew-roster-heading" className="text-lg font-bold text-atlas-ink">
                ملخص الطاقم
              </h2>
              <p className="text-xs text-atlas-muted">بطاقات طاقم ذكية — صورة، مؤشرات حية، وإجراءات سريعة</p>
            </div>
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {filtered.map((e, i) => (
                <WorkforceSmartEmployeeCard key={e.id} employee={e} index={i} />
              ))}
            </div>
          </section>

          {/* الورديات — ألواح عمودية بزاوية بصرية */}
          <section aria-labelledby="shift-slab-heading">
            <h2 id="shift-slab-heading" className="mb-4 text-lg font-bold text-atlas-ink">
              توزيع الورديات
            </h2>
            <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
              {shiftBuckets.length === 0 ? (
                <p className="text-sm text-atlas-muted">لا بيانات وردية في التصفية الحالية.</p>
              ) : (
                shiftBuckets.map(([label, count], idx) => {
                  const max = Math.max(...shiftBuckets.map(([, c]) => c), 1);
                  const h = 40 + Math.round((count / max) * 52);
                  return (
                    <div
                      key={label}
                      className="relative flex min-h-[120px] flex-1 flex-col justify-end overflow-hidden rounded-sm border border-atlas-rule bg-atlas-canvas p-4 shadow-atlasBar"
                    >
                      <div
                        className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-atlas-brand/25 to-transparent"
                        style={{ height: `${h}%` }}
                        aria-hidden
                      />
                      <p className="relative z-[1] text-[10px] font-bold uppercase tracking-[0.16em] text-atlas-muted">{label}</p>
                      <p className="relative z-[1] mt-1 font-mono text-3xl font-bold tabular-nums text-atlas-ink">{count}</p>
                      <p className="relative z-[1] text-[11px] text-atlas-slate">أفراد ضمن التصفية</p>
                      {idx === 0 ? (
                        <Radio className="absolute end-3 top-3 h-4 w-4 text-atlas-brand/60" aria-hidden />
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* الحضور — شريط مركّب واحد */}
          <section aria-labelledby="attendance-bar-heading">
            <h2 id="attendance-bar-heading" className="mb-3 text-lg font-bold text-atlas-ink">
              ملخص الحضور
            </h2>
            <div className="overflow-hidden rounded-sm border border-atlas-rule bg-atlas-paper p-4 shadow-atlasCard">
              <div className="flex h-4 w-full overflow-hidden rounded-sm bg-atlas-tableHead">
                <div className="h-full bg-atlas-success" style={{ width: `${attendancePct.present}%` }} title="حاضر" />
                <div className="h-full bg-atlas-warning" style={{ width: `${attendancePct.late}%` }} title="متأخر" />
                <div className="h-full bg-atlas-info/80" style={{ width: `${attendancePct.leave}%` }} title="إجازة" />
                <div className="h-full bg-atlas-danger" style={{ width: `${attendancePct.absent}%` }} title="غائب" />
              </div>
              <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-sm bg-atlas-success" /> حاضر {attendancePct.present}%
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-sm bg-atlas-warning" /> متأخر {attendancePct.late}%
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-sm bg-atlas-info" /> إجازة {attendancePct.leave}%
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-sm bg-atlas-danger" /> غائب {attendancePct.absent}%
                </li>
              </ul>
            </div>
          </section>
        </div>

        {/* قناة جانبية — تكامل مع القائمة + أداء */}
        <aside className="min-w-0 space-y-6 xl:sticky xl:top-24">
          <div className="rounded-sm border border-atlas-rule bg-atlas-paper p-4 shadow-atlasCard">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-atlas-muted">
              <Link2 className="h-3.5 w-3.5 text-atlas-brand" aria-hidden />
              تكامل القائمة الجانبية
            </div>
            <p className="mt-2 text-xs leading-relaxed text-atlas-slate">
              القائمة الرئيسية للتطبيق تبقى مسار التنقل العام. هذه القناة تربطك بسياق الصالة والوردية دون تكرار لوحة تحكم
              عامة.
            </p>
            <ul className="mt-4 space-y-2 text-sm font-semibold text-atlas-brand">
              <li>
                <Link href={"/ar" as Route} className="flex items-center gap-2 hover:underline">
                  <Gauge className="h-4 w-4 opacity-80" aria-hidden />
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link href={"/ar/floor" as Route} className="flex items-center gap-2 hover:underline">
                  <Factory className="h-4 w-4 opacity-80" aria-hidden />
                  صالة الإنتاج
                </Link>
              </li>
              <li>
                <Link href={"/ar/workforce" as Route} className="flex items-center gap-2 text-atlas-ink">
                  <Users className="h-4 w-4 text-atlas-brand" aria-hidden />
                  القوى العاملة (هنا)
                </Link>
              </li>
            </ul>
          </div>

          <div className="rounded-sm border border-atlas-rule bg-atlas-canvas p-4 shadow-atlasBar">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-atlas-muted">تصفية القاعة</p>
            <div className="mt-3 flex flex-col gap-1.5">
              {HALL_FILTERS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHallFilter(h)}
                  className={`rounded-sm px-3 py-2 text-start text-sm font-medium transition ${
                    hallFilter === h
                      ? "bg-atlas-brand text-white shadow-atlasBar"
                      : "text-atlas-ink hover:bg-atlas-paper"
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-sm border border-atlas-brand/20 bg-gradient-to-b from-atlas-brandSoft/40 to-atlas-paper p-4 shadow-atlasCard">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-atlas-muted">أداء — لقطات سريعة</p>
            <ul className="mt-4 space-y-4">
              {topPerformers.map((e) => (
                <li key={e.id} className="border-b border-atlas-rule pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-atlas-ink">{e.name}</span>
                    <span className="font-mono text-sm font-bold text-atlas-brand">{e.performance}</span>
                  </div>
                  <svg width="100%" height="24" className="mt-2 text-atlas-brand" aria-hidden>
                    <polyline
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                      points={sparkPath(e.id)}
                    />
                  </svg>
                  <p className="mt-1 text-[10px] text-atlas-muted">مسار أداء مختصر (تركيب بصري)</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-sm border border-atlas-rule bg-atlas-paper p-4 shadow-atlasCard">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-atlas-muted">متوسط الأداء حسب القطاع</p>
            <ul className="mt-3 space-y-3">
              {deptPerf.map((d) => (
                <li key={d.name}>
                  <div className="flex justify-between text-xs font-medium text-atlas-ink">
                    <span>{d.name}</span>
                    <span className="font-mono tabular-nums text-atlas-brand">{d.avg}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-atlas-tableHead">
                    <div className="h-full rounded-full bg-atlas-accent" style={{ width: `${d.avg}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
