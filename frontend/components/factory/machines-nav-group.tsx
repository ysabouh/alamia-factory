"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { ChevronDown, Factory, Gauge, Layers, List, Package, Puzzle } from "lucide-react";

import { cn } from "@/lib/utils";

const MACHINES_BASE = "/ar/machines";
const MOLDS_BASE = "/ar/molds";
const PRODUCTS_BASE = "/ar/products";

const ASSEMBLY_BASE = "/ar/assembly";

const staticLinks = [
  { href: "/ar/machines", label: "عرض الأرضية", icon: Factory, exact: true },
  { href: "/ar/machines/registry", label: "سجل الماكينات", icon: List, exact: false },
  { href: "/ar/molds/registry", label: "سجل القوالب", icon: Layers, exact: false },
  { href: "/ar/products/registry", label: "سجل المنتجات", icon: Package, exact: false },
  { href: "/ar/assembly/dashboard", label: "لوحة التجميع", icon: Puzzle, exact: false },
  { href: "/ar/assembly/work-orders", label: "أوامر التجميع", icon: Puzzle, exact: false }
] as const;

function linkActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href || pathname === `${href}/`;
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function MachinesNavGroup({
  pathname,
  onNavigate
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const inSection =
    pathname.startsWith(MACHINES_BASE) ||
    pathname.startsWith(MOLDS_BASE) ||
    pathname.startsWith(PRODUCTS_BASE) ||
    pathname.startsWith(ASSEMBLY_BASE);
  const [open, setOpen] = useState(inSection);

  useEffect(() => {
    if (inSection) setOpen(true);
  }, [inSection]);

  return (
    <div className="grid gap-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-atlas-sidebarMuted transition-colors hover:bg-white/[0.08] hover:text-atlas-paper",
          inSection && "bg-atlas-brand/35 font-semibold text-atlas-paper shadow-atlasBar"
        )}
      >
        <Gauge className="h-5 w-5 shrink-0 opacity-90" />
        <span className="flex-1 text-start">التصنيع</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 opacity-70 transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? (
        <div className="me-1 grid gap-1 border-s border-white/10 ps-2">
          {staticLinks.map((item) => {
            const Icon = item.icon;
            const active = linkActive(pathname, item.href, item.exact);

            return (
              <Link
                key={item.href}
                href={item.href as Route}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-atlas-sidebarMuted transition-colors hover:bg-white/[0.08] hover:text-atlas-paper",
                  active && "bg-atlas-brand/25 font-medium text-atlas-paper"
                )}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-80" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
