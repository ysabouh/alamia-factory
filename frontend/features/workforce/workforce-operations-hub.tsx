"use client";

import Link from "next/link";
import type { Route } from "next";
import { Activity, ArrowUpRight, BookMarked, CalendarCheck, Shield, Users, Wallet } from "lucide-react";

import { WfmPageHeader } from "@/components/workforce/atlas";

const TILES: { href: Route; title: string; desc: string; icon: typeof Users }[] = [
  {
    href: "/ar/workforce/employees",
    title: "إدارة الموظفين",
    desc: "سجل كامل — بحث، فرز، إجراءات جماعية، تفاصيل منزلقة.",
    icon: Users
  },
  {
    href: "/ar/workforce/attendance",
    title: "الحضور والرواتب",
    desc: "حضور يومي، إضافي، وحساب راتب من لقطات مخزنة.",
    icon: CalendarCheck
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
  },
  {
    href: "/ar/workforce/masters",
    title: "المرجعيات",
    desc: "قاعات، أقسام، أدوار، ورديات، عملات — جداول الإعداد الأساسية.",
    icon: BookMarked
  },
  {
    href: "/ar/workforce/access",
    title: "الصلاحيات",
    desc: "ربط المستخدمين بالموظفين وإدارة الأدوار والصلاحيات.",
    icon: Shield
  }
];

export function WorkforceOperationsHub() {
  return (
    <div className="space-y-6">
      <WfmPageHeader
        kicker="مركز العمليات · Workforce"
        title="القوى العاملة"
        description="واجهة موحّدة للسجل والحضور والمرجعيات والصلاحيات والماليات."
        icon={<Users className="h-3.5 w-3.5 text-atlas-brand" aria-hidden />}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="group flex h-full flex-col rounded-sm border border-atlas-rule bg-atlas-paper p-5 shadow-atlasCard transition hover:border-atlas-brand/35 hover:shadow-atlasLift"
            >
              <Icon className="h-8 w-8 text-atlas-brand transition group-hover:text-atlas-accent" aria-hidden />
              <h2 className="mt-4 text-lg font-bold text-atlas-ink">{t.title}</h2>
              <p className="mt-2 flex-1 text-sm text-atlas-slate">{t.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-atlas-brand">
                فتح
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
