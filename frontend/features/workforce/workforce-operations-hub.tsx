"use client";

import Link from "next/link";
import type { Route } from "next";
import { motion } from "framer-motion";
import { Activity, Cpu, Users, Wallet } from "lucide-react";

const TILES: { href: Route; title: string; desc: string; icon: typeof Users }[] = [
  {
    href: "/ar/workforce/employees",
    title: "إدارة الموظفين",
    desc: "سجل صناعي كامل — بحث، فرز، إجراءات جماعية، تفاصيل منزلقة.",
    icon: Users
  },
  {
    href: "/ar/workforce/crew",
    title: "لوحة الطاقم",
    desc: "قراءة لحظية للوردية والحضور وبطاقات الطاقم.",
    icon: Activity
  },
  {
    href: "/ar/workforce/finance",
    title: "القوى المالية",
    desc: "مركز التكاليف والرواتب والمؤشرات المالية.",
    icon: Wallet
  }
];

export function WorkforceOperationsHub() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-sf-stroke/35 bg-gradient-to-br from-sf-chassis via-sf-panel to-sf-deep p-8 shadow-industrial">
      <div className="pointer-events-none absolute -end-24 -top-24 h-64 w-64 rounded-full bg-sf-accent/10 blur-3xl" aria-hidden />
      <div className="relative mb-10 max-w-2xl">
        <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-sf-muted">
          <Cpu className="h-4 w-4 text-sf-accentCool" aria-hidden />
          WORKFORCE OPERATIONS NODE
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-sf-ink md:text-4xl">عقد تشغيل القوى العاملة</h1>
        <p className="mt-3 text-sm leading-relaxed text-sf-muted">
          واجهة موحّدة على نمط غرف تحكم صناعية — اختر مسار العمل دون التنقل في لوحات إدارة عامة.
        </p>
      </div>
      <div className="relative grid gap-4 md:grid-cols-3">
        {TILES.map((t, i) => {
          const Icon = t.icon;
          return (
            <motion.div
              key={t.href}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, type: "spring", stiffness: 280, damping: 24 }}
            >
              <Link
                href={t.href}
                className="group flex h-full flex-col rounded-xl border border-sf-hairline bg-sf-panel/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:border-sf-accentCool/35 hover:shadow-glowCyan"
              >
                <Icon className="h-8 w-8 text-sf-accentCool transition group-hover:text-sf-accent" aria-hidden />
                <h2 className="mt-4 text-lg font-bold text-sf-ink">{t.title}</h2>
                <p className="mt-2 flex-1 text-sm text-sf-muted">{t.desc}</p>
                <span className="mt-4 font-mono text-[11px] text-sf-accent">OPEN →</span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
