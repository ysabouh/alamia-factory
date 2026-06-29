"use client";

import Link from "next/link";
import {
  Check,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Eye,
  PlayCircle,
  Plus,
  RotateCcw,
  Timer,
  type LucideIcon
} from "lucide-react";

import type { MyDirectTasksSummary, MyDirectTasksTab, ScheduleEntry } from "@/features/direct-tasks/my-tasks/my-direct-tasks-utils";
import { cn } from "@/lib/utils";

type Props = {
  firstName: string;
  summary: MyDirectTasksSummary;
  canCreate: boolean;
  activeKpi: MyDirectTasksTab | null;
  onKpiClick: (kpi: "completed" | "review" | "active" | "overdue" | null) => void;
};

type KpiTone = "green" | "amber" | "blue" | "red";

const KPI_STYLES: Record<
  KpiTone,
  { icon: LucideIcon; iconClass: string; ringClass: string; titleClass: string; valueClass: string; borderClass: string; selectedBg: string }
> = {
  green: {
    icon: Check,
    iconClass: "text-emerald-500",
    ringClass: "border-2 border-emerald-500",
    titleClass: "text-emerald-600",
    valueClass: "text-emerald-600",
    borderClass: "border-emerald-100",
    selectedBg: "bg-emerald-50/80"
  },
  amber: {
    icon: ClipboardCheck,
    iconClass: "text-amber-500",
    ringClass: "border-2 border-amber-500",
    titleClass: "text-amber-600",
    valueClass: "text-amber-600",
    borderClass: "border-amber-100",
    selectedBg: "bg-amber-50/80"
  },
  blue: {
    icon: PlayCircle,
    iconClass: "text-blue-500",
    ringClass: "border-2 border-blue-500",
    titleClass: "text-blue-600",
    valueClass: "text-blue-600",
    borderClass: "border-blue-100",
    selectedBg: "bg-blue-50/80"
  },
  red: {
    icon: RotateCcw,
    iconClass: "text-red-500",
    ringClass: "border-2 border-red-500",
    titleClass: "text-red-600",
    valueClass: "text-red-600",
    borderClass: "border-red-100",
    selectedBg: "bg-red-50/80"
  }
};

function KpiCard({
  label,
  value,
  subtitle,
  tone,
  selected,
  onClick
}: {
  label: string;
  value: number;
  subtitle: string;
  tone: KpiTone;
  selected: boolean;
  onClick: () => void;
}) {
  const style = KPI_STYLES[tone];
  const Icon = style.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-w-[130px] flex-1 flex-col items-center justify-center rounded-xl border bg-white px-3 py-5 text-center shadow-sm transition dark:bg-zinc-900",
        style.borderClass,
        selected ? style.selectedBg : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-zinc-900", style.ringClass)}>
          <Icon className={cn("h-4 w-4", style.iconClass)} strokeWidth={tone === "green" ? 2.5 : 2} />
        </div>
        <span className={cn("text-sm font-semibold", style.titleClass)}>{label}</span>
      </div>
      <span className={cn("text-3xl font-bold leading-none", style.valueClass)}>{value}</span>
      <span className="mt-1.5 text-xs text-zinc-500">{subtitle}</span>
    </button>
  );
}

export function MyDirectTasksHero({ firstName, summary, canCreate, activeKpi, onKpiClick }: Props) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))]">
      {/* بطاقة الترحيب */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-sky-100 bg-gradient-to-l from-sky-50/80 to-white p-5 shadow-sm dark:border-sky-900/40 dark:from-sky-950/30 dark:to-zinc-900">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">مرحباً {firstName} 👋</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            لديك <span className="font-bold text-zinc-900 dark:text-zinc-100">{summary.total}</span> مهمة مباشرة
          </p>
          <p className="text-sm text-zinc-500">
            <span className="font-semibold text-amber-600">{summary.needsAttentionToday}</span> مهام تحتاج اهتمامك اليوم
          </p>
          {canCreate ? (
            <Link href="/ar/workflow/tasks/new" className="atlas-btn-primary mt-4 inline-flex items-center gap-1.5 text-sm">
              <Plus className="h-4 w-4" />
              مهمة جديدة
            </Link>
          ) : null}
        </div>
        <div className="hidden h-20 w-24 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-500 sm:flex dark:bg-sky-950/50">
          <ClipboardList className="h-10 w-10" strokeWidth={1.5} />
        </div>
      </div>

      <KpiCard
        label="مكتملة"
        value={summary.completedThisMonth}
        subtitle="هذا الشهر"
        tone="green"
        selected={activeKpi === "completed"}
        onClick={() => onKpiClick(activeKpi === "completed" ? null : "completed")}
      />
      <KpiCard
        label="قيد المراجعة"
        value={summary.review}
        subtitle="بانتظار المراجعة"
        tone="amber"
        selected={activeKpi === "review"}
        onClick={() => onKpiClick(activeKpi === "review" ? null : "review")}
      />
      <KpiCard
        label="جارية"
        value={summary.active}
        subtitle="قيد التنفيذ"
        tone="blue"
        selected={activeKpi === "active"}
        onClick={() => onKpiClick(activeKpi === "active" ? null : "active")}
      />
      <KpiCard
        label="متأخرة"
        value={summary.overdue}
        subtitle="تحتاج اهتمام"
        tone="red"
        selected={activeKpi === "overdue"}
        onClick={() => onKpiClick(activeKpi === "overdue" ? null : "overdue")}
      />
    </div>
  );
}

export function MyDirectTasksScheduleWidget({ entries }: { entries: ScheduleEntry[] }) {
  const todayLabel = new Date().toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-sky-500" />
          <h3 className="text-sm font-bold">جدول اليوم</h3>
        </div>
        <span className="text-[11px] text-zinc-500">{todayLabel}</span>
      </div>
      {entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-500">لا مهام مجدولة لليوم</p>
      ) : (
        <ul className="space-y-0">
          {entries.map((entry, i) => (
            <li key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
              {i < entries.length - 1 ? <span className="absolute bottom-0 start-[15px] top-6 w-px bg-zinc-200 dark:bg-zinc-700" aria-hidden /> : null}
              <span className="relative z-[1] mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white bg-zinc-100 text-[11px] font-bold text-zinc-600 ring-1 ring-zinc-200 dark:border-zinc-900 dark:bg-zinc-800 dark:ring-zinc-700">
                {entry.time}
              </span>
              <div className="min-w-0 flex-1 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-800/50">
                <p className="truncate text-sm font-semibold">{entry.title}</p>
                <span
                  className={cn(
                    "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold",
                    entry.status === "overdue" && "bg-red-100 text-red-700",
                    entry.status === "active" && "bg-sky-100 text-sky-700",
                    entry.status === "done" && "bg-emerald-100 text-emerald-700",
                    entry.status === "upcoming" && "bg-zinc-200 text-zinc-600"
                  )}
                >
                  {entry.statusLabel}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:underline">
        <Eye className="h-3.5 w-3.5" />
        عرض الجدول الكامل
      </button>
    </div>
  );
}

export function MyDirectTasksAchievementWidget({ summary }: { summary: MyDirectTasksSummary }) {
  const r = 52;
  const stroke = 8;
  const c = 2 * Math.PI * r;
  const offset = c - (summary.todayPercent / 100) * c;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-3 flex items-center gap-2">
        <Timer className="h-4 w-4 text-emerald-500" />
        <h3 className="text-sm font-bold">إنجازك اليوم</h3>
      </div>
      <div className="flex flex-col items-center py-2">
        <div className="relative" style={{ width: 128, height: 128 }}>
          <svg width={128} height={128} className="-rotate-90">
            <circle cx={64} cy={64} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-zinc-200 dark:text-zinc-700" />
            <circle
              cx={64}
              cy={64}
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
              className="text-emerald-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-emerald-600">{summary.todayPercent}%</span>
          </div>
        </div>
        <div className="mt-4 flex w-full justify-center gap-8 text-center">
          <div>
            <p className="text-lg font-bold text-emerald-600">{summary.todayCompleted}</p>
            <p className="text-xs text-zinc-500">مكتملة</p>
          </div>
          <div>
            <p className="text-lg font-bold text-zinc-700 dark:text-zinc-200">{summary.todayRemaining}</p>
            <p className="text-xs text-zinc-500">متبقية</p>
          </div>
        </div>
      </div>
      <button type="button" className="mt-2 inline-flex w-full items-center justify-center gap-1 text-xs font-medium text-sky-600 hover:underline">
        <CheckCircle2 className="h-3.5 w-3.5" />
        عرض التقارير
      </button>
    </div>
  );
}
