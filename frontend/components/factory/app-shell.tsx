"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { useCallback, useEffect, useState } from "react";
import {
  Boxes,
  Brain,
  ClipboardList,
  Menu,
  Factory,
  Truck,
  Gauge,
  LayoutDashboard,
  MoonStar,
  Radio,
  Search,
  Settings,
  SunMedium,
  Users,
  Wrench,
  X
} from "lucide-react";

import { cn } from "@/lib/utils";

const navigation = [
  { href: "/ar", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/ar/floor", label: "صالة الإنتاج", icon: Factory },
  { href: "/ar/machines", label: "الماكينات", icon: Gauge },
  { href: "/ar/production", label: "أوامر الإنتاج", icon: ClipboardList },
  { href: "/ar/inventory", label: "المخزون الذكي", icon: Boxes },
  { href: "/ar/fleet", label: "الأسطول والمركبات", icon: Truck },
  { href: "/ar/intelligence", label: "الذكاء والتحليلات", icon: Brain },
  { href: "/ar/monitoring", label: "المراقبة الحية (MES)", icon: Radio },
  { href: "/ar/workforce", label: "القوى العاملة والمالية", icon: Users },
  { href: "/ar/admin", label: "قسم الصيانة", icon: Wrench }
];

const secondaryNavigation = [
  { label: "الصيانة", icon: Wrench },
  { label: "المستودعات", icon: Boxes },
  { label: "الموظفون", icon: Users },
  { label: "الإعدادات", icon: Settings }
];

function SidebarBrandCard() {
  return (
    <div className="erp-card rounded-2xl p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-500">
          <Factory className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[10px] tracking-[0.3em] text-muted-foreground">OPS-CORE</p>
          <h1 className="text-sm font-bold">Smart Plastic OS</h1>
        </div>
      </div>
    </div>
  );
}

function SidebarNavSections({
  pathname,
  onNavigate
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <nav className="mt-5 grid gap-1.5">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href as Route}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground",
                active && "border border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-border pt-4">
        <p className="px-3 text-[10px] tracking-[0.25em] text-muted-foreground">MODULE BUS</p>
        <div className="mt-3 grid gap-1.5">
          {secondaryNavigation.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent/60"
              >
                <Icon className="h-5 w-5" />
                {item.label}
                <span className="mr-auto rounded-full bg-white/5 px-2 py-0.5 text-[10px]">قريباً</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  useEffect(() => {
    closeMobileNav();
  }, [pathname, closeMobileNav]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const onWide = () => {
      if (mq.matches) setMobileNavOpen(false);
    };
    mq.addEventListener("change", onWide);
    return () => mq.removeEventListener("change", onWide);
  }, []);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobileNav();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileNavOpen, closeMobileNav]);

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <aside className="fixed inset-y-0 right-0 z-30 hidden w-72 border-l border-border bg-card/90 px-4 py-6 backdrop-blur xl:block">
        <SidebarBrandCard />
        <SidebarNavSections pathname={pathname} />
      </aside>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 xl:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            aria-label="إغلاق القائمة"
            onClick={closeMobileNav}
          />
          <aside
            className="absolute inset-y-0 right-0 flex w-[min(100vw,18rem)] flex-col overflow-y-auto border-l border-border bg-card px-4 py-6 shadow-xl"
            aria-modal="true"
            role="dialog"
            aria-labelledby="mobile-nav-title"
          >
            <div className="mb-4 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <SidebarBrandCard />
              </div>
              <button
                type="button"
                onClick={closeMobileNav}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background"
                aria-label="إغلاق القائمة"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <span id="mobile-nav-title" className="sr-only">
              قائمة التنقل
            </span>
            <SidebarNavSections pathname={pathname} onNavigate={closeMobileNav} />
          </aside>
        </div>
      ) : null}

      <div className="xl:pr-72">
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] tracking-[0.25em] text-muted-foreground">REALTIME FACTORY OPERATING CENTER</p>
              <h2 className="mt-1 text-lg font-semibold">منصة تشغيل ومراقبة المصنع</h2>
            </div>
            <div className="flex w-full items-center gap-3 md:w-auto">
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card xl:hidden"
                aria-label="فتح قائمة التنقل"
                aria-expanded={mobileNavOpen}
                onClick={() => setMobileNavOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="hidden min-w-64 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 md:flex">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">ابحث عن أمر إنتاج أو ماكينة...</span>
              </div>
              <div className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs text-green-700 dark:text-green-200">
                <span className="ml-2 inline-block h-2 w-2 rounded-full bg-green-400 pulse-live" />
                النظام حي
              </div>
              <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card" aria-label="theme switch">
                <SunMedium className="h-4 w-4 dark:hidden" />
                <MoonStar className="hidden h-4 w-4 dark:block" />
              </button>
              <div className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                أدمن: admin@myfactory.local
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
