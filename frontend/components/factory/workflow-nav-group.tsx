"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import {
  BarChart3,
  ChevronDown,
  ClipboardCheck,
  FileStack,
  GitBranch,
  ListTodo,
  PlusCircle,
  Zap
} from "lucide-react";

import { useFactoryAuth } from "@/contexts/factory-auth-context";
import { cn } from "@/lib/utils";

const WORKFLOW_BASE = "/ar/workflow";

const staticLinks = [
  { href: "/ar/workflow/my-tasks", label: "مهامي", icon: ListTodo, exact: false },
  { href: "/ar/workflow/direct-tasks", label: "مهامي المباشرة", icon: Zap, exact: false, permission: "direct_tasks.view" as const },
  { href: "/ar/workflow/tasks/new", label: "إنشاء مهمة", icon: PlusCircle, exact: true, permission: "direct_tasks.create" as const },
  { href: "/ar/workflow/instances", label: "التنفيذات", icon: ClipboardCheck, exact: false },
  { href: "/ar/workflow/templates", label: "القوالب", icon: FileStack, exact: false },
  { href: "/ar/workflow/dashboard", label: "التحليلات", icon: BarChart3, exact: false }
] as const;

function linkActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href || pathname === `${href}/`;
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function WorkflowNavGroup({
  pathname,
  onNavigate
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const { can } = useFactoryAuth();
  const inSection = pathname.startsWith(WORKFLOW_BASE);
  const [open, setOpen] = useState(inSection);
  const links = staticLinks.filter((item) => !("permission" in item) || can(item.permission));

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
        <GitBranch className="h-5 w-5 shrink-0 opacity-90" />
        <span className="flex-1 text-start">سير العمل</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 opacity-70 transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? (
        <div className="me-1 grid gap-1 border-s border-white/10 ps-2">
          {links.map((item) => {
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
