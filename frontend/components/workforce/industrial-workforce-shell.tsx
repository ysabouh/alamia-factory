"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { Activity, BookMarked, CalendarCheck, LayoutGrid, Shield, Users, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";

const LINKS: { href: Route; label: string; icon: typeof Users }[] = [
  { href: "/ar/workforce", label: "مركز العمليات", icon: LayoutGrid },
  { href: "/ar/workforce/employees", label: "سجل العاملين", icon: Users },
  { href: "/ar/workforce/attendance", label: "الحضور والرواتب", icon: CalendarCheck },
  { href: "/ar/workforce/masters", label: "المرجعيات", icon: BookMarked },
  { href: "/ar/workforce/crew", label: "لوحة الطاقم", icon: Activity },
  { href: "/ar/workforce/finance", label: "القوى المالية", icon: Wallet },
  { href: "/ar/workforce/access", label: "الصلاحيات", icon: Shield }
];

export function IndustrialWorkforceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div dir="rtl" className="min-h-[calc(100vh-6rem)] rounded-sm border border-atlas-rule bg-atlas-canvas text-atlas-ink shadow-atlasCard">
      <div className="border-b border-atlas-rule bg-atlas-paper shadow-atlasBar">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 md:px-6">
          <div className="flex items-center gap-2 border-e border-atlas-rule pe-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-atlas-brand text-sm font-bold text-white">
              W
            </span>
            <WfmNavTitles />
          </div>
          <nav className="flex flex-1 flex-wrap gap-1">
            {LINKS.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/ar/workforce" && pathname.startsWith(`${item.href}/`));
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="relative">
                  <span
                    className={cn(
                      "relative flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-atlas-brandSoft text-atlas-brand ring-1 ring-atlas-brand/25"
                        : "text-atlas-slate hover:bg-atlas-canvas hover:text-atlas-ink"
                    )}
                  >
                    {active ? (
                      <span
                        className="absolute inset-y-1 start-0 w-0.5 rounded-full bg-atlas-brand"
                        aria-hidden
                      />
                    ) : null}
                    <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="p-4 md:p-6">{children}</div>
    </div>
  );
}

function WfmNavTitles() {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-atlas-muted">القوى العاملة</p>
      <p className="text-xs font-semibold text-atlas-ink">MyFactory · Personnel</p>
    </div>
  );
}
