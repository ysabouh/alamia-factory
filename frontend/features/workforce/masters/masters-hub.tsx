"use client";

import Link from "next/link";
import type { Route } from "next";
import { Building2, Clock, Coins, Layers, LayoutGrid, Users } from "lucide-react";

import { WfmRegistryHeader } from "@/components/workforce/atlas";
import { Button } from "@/components/ui/button";

const CARDS: {
  href: Route;
  title: string;
  description: string;
  icon: typeof Building2;
}[] = [
  {
    href: "/ar/workforce",
    title: "مركز العمليات",
    description: "العودة إلى لوحة القوى العاملة — الموظفون، الحضور، والماليات",
    icon: LayoutGrid
  },
  {
    href: "/ar/workforce/masters/currencies",
    title: "العملات",
    description: "USD مرجع — معادل كل عملة بالدولار",
    icon: Coins
  },
  {
    href: "/ar/workforce/masters/halls",
    title: "القاعات",
    description: "قاعات الإنتاج والتصنيع",
    icon: Building2
  },
  {
    href: "/ar/workforce/masters/departments",
    title: "الأقسام",
    description: "أقسام مرتبطة بالقاعات",
    icon: Layers
  },
  {
    href: "/ar/workforce/masters/job-roles",
    title: "الأدوار الوظيفية",
    description: "مسميات ومسارات العمل",
    icon: Users
  },
  {
    href: "/ar/workforce/masters/shifts",
    title: "الورديات",
    description: "جداول الدوام والتناوب",
    icon: Clock
  }
];

export function MastersHub() {
  return (
    <div className="space-y-6">
      <WfmRegistryHeader
        kicker="WFM · MASTERS"
        title="جداول المرجعية"
        titleIcon={<Building2 className="h-8 w-8 text-atlas-brand" aria-hidden />}
        description="إدارة القاعات والأقسام والأدوار والورديات والعملات — التعطيل يخفي السجل من النماذج دون حذفه."
        actions={
          <Button type="button" variant="atlasOutline" className="rounded-sm" asChild>
            <Link href={"/ar/workforce" as Route}>مركز العمليات</Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-sm border border-atlas-rule bg-atlas-paper p-5 shadow-atlasCard transition hover:border-atlas-brand/40 hover:shadow-atlasLift"
            >
              <Icon className="h-8 w-8 text-atlas-brand opacity-90 transition group-hover:text-atlas-accent" aria-hidden />
              <h2 className="mt-3 text-lg font-semibold text-atlas-ink">{card.title}</h2>
              <p className="mt-1 text-sm text-atlas-slate">{card.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

