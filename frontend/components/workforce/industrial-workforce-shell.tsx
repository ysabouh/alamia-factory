"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Activity, Cpu, LayoutGrid, Users, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";

const LINKS: { href: Route; label: string; icon: typeof Users }[] = [
  { href: "/ar/workforce", label: "مركز العمليات", icon: LayoutGrid },
  { href: "/ar/workforce/employees", label: "سجل العاملين", icon: Users },
  { href: "/ar/workforce/crew", label: "لوحة الطاقم", icon: Activity },
  { href: "/ar/workforce/finance", label: "القوى المالية", icon: Wallet }
];

export function IndustrialWorkforceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      className="min-h-[calc(100vh-6rem)] rounded-module border border-sf-stroke/35 bg-gradient-to-b from-sf-void via-sf-deep to-sf-chassis text-sf-copy shadow-industrial"
      dir="rtl"
    >
      <div className="relative overflow-hidden border-b border-sf-hairline bg-sf-panel/80">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `linear-gradient(90deg, transparent 0%, rgba(0,212,170,0.4) 50%, transparent 100%)`,
            backgroundSize: "120px 100%"
          }}
          aria-hidden
        />
        <div className="relative flex flex-wrap items-center gap-2 px-4 py-3 md:px-6">
          <div className="flex items-center gap-2 pe-4 text-sf-muted">
            <Cpu className="h-4 w-4 text-sf-accentCool" aria-hidden />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em]">MES · WFM</span>
          </div>
          <nav className="flex flex-1 flex-wrap gap-2">
            {LINKS.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/ar/workforce" && pathname.startsWith(`${item.href}/`));
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="relative">
                  {active ? (
                    <motion.span
                      layoutId="wfm-nav-pill"
                      className="absolute inset-0 rounded-lg bg-sf-accent/15 ring-1 ring-sf-accent/35"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  ) : null}
                  <span
                    className={cn(
                      "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active ? "text-sf-ink" : "text-sf-muted hover:bg-white/[0.04] hover:text-sf-copy"
                    )}
                  >
                    <Icon className="h-4 w-4 opacity-90" aria-hidden />
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
