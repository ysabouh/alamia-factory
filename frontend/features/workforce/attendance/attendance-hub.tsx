"use client";

import Link from "next/link";
import type { Route } from "next";
import { CalendarCheck, Calculator, Clock } from "lucide-react";

const CARDS: { href: Route; title: string; desc: string; icon: typeof CalendarCheck }[] = [
  {
    href: "/ar/workforce/attendance/daily" as Route,
    title: "الحضور اليومي",
    desc: "تسجيل دخول/خروج، KPI، وموافقة المشرف",
    icon: CalendarCheck
  },
  {
    href: "/ar/workforce/attendance/overtime" as Route,
    title: "العمل الإضافي",
    desc: "طلبات الإضافي واعتماد المشرف",
    icon: Clock
  },
  {
    href: "/ar/workforce/attendance/payroll" as Route,
    title: "حساب الراتب",
    desc: "معاينة وتوليد مسير من لقطات الحضور",
    icon: Calculator
  }
];

export function AttendanceHub() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-atlas-brand">الحضور والرواتب</p>
        <h1 className="text-2xl font-bold text-atlas-ink">مركز الحضور والإضافي</h1>
        <p className="mt-1 text-sm text-atlas-muted">إدارة الحضور اليومي، طلبات الإضافي، وحساب الرواتب من السجلات المخزنة.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.href}
              href={c.href}
              className="group rounded-sm border border-atlas-rule bg-atlas-paper p-5 shadow-atlasCard transition-shadow hover:shadow-atlasLift"
            >
              <Icon className="mb-3 h-8 w-8 text-atlas-brand" aria-hidden />
              <h2 className="text-lg font-semibold text-atlas-ink group-hover:text-atlas-brand">{c.title}</h2>
              <p className="mt-1 text-sm text-atlas-muted">{c.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
