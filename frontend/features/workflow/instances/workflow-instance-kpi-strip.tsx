"use client";

import { useCallback, useState, type ReactNode } from "react";
import { CalendarDays, Check, Copy, Play, Timer } from "lucide-react";

type Props = {
  progressPercent: number;
  completedCount: number;
  currentCount: number;
  remainingCount: number;
  totalStages: number;
  workflowNumber: string;
  status: string;
  startedAt?: string | null;
  createdAt?: string | null;
  subjectLabel?: string | null;
};

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  const date = d.toLocaleDateString("en-CA");
  const time = d.toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${date} ${time}`;
}

function stageCountLabel(count: number): string {
  if (count === 0) return "لا مراحل";
  if (count === 1) return "مرحلة واحدة";
  if (count === 2) return "مرحلتان";
  if (count >= 3 && count <= 10) return `${count} مراحل`;
  return `${count} مرحلة`;
}

function SectionDivider() {
  return (
    <>
      <div className="hidden w-px shrink-0 self-stretch bg-zinc-200 lg:block dark:bg-zinc-700" aria-hidden />
      <div className="h-px w-full shrink-0 bg-zinc-200 lg:hidden dark:bg-zinc-700" aria-hidden />
    </>
  );
}

function ProgressSection({ percent }: { percent: number }) {
  const radius = 40;
  const size = 96;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex min-w-[120px] flex-1 items-center justify-center px-4 py-5">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#10b981"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold leading-none text-black dark:text-zinc-100">{percent}%</span>
          <span className="mt-1 max-w-[72px] text-[10px] leading-tight text-black dark:text-zinc-300">نسبة الإنجاز</span>
        </div>
      </div>
    </div>
  );
}

function StatSection({
  icon,
  iconRing,
  title,
  titleColor,
  value,
  valueColor,
  subtitle
}: {
  icon: ReactNode;
  iconRing: string;
  title: string;
  titleColor: string;
  value: number;
  valueColor: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-w-[130px] flex-1 flex-col items-center justify-center px-4 py-5 text-center">
      <div className="mb-2 flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-white ${iconRing}`}>{icon}</div>
        <span className={`text-sm font-semibold ${titleColor}`}>{title}</span>
      </div>
      <span className={`text-3xl font-bold leading-none ${valueColor}`}>{value}</span>
      <span className="mt-1.5 text-xs text-zinc-500">{subtitle}</span>
    </div>
  );
}

function RequestSection({
  workflowNumber,
  createdAt,
  startedAt
}: {
  workflowNumber: string;
  createdAt?: string | null;
  startedAt?: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const created = formatDateTime(createdAt ?? startedAt);

  const copyNumber = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(workflowNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [workflowNumber]);

  return (
    <div className="flex min-w-[200px] flex-[1.2] flex-col justify-center gap-3 px-5 py-4 text-start">
      <div>
        <p className="text-xs text-zinc-500">رقم الطلب</p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-sm font-bold text-slate-700 dark:text-zinc-200">{workflowNumber}</span>
          <button
            type="button"
            onClick={() => void copyNumber()}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
            aria-label="نسخ رقم الطلب"
            title={copied ? "تم النسخ" : "نسخ"}
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div>
        <p className="text-xs text-zinc-500">تاريخ الإنشاء</p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-zinc-200">{created}</span>
          <CalendarDays className="h-4 w-4 shrink-0 text-zinc-400" />
        </div>
      </div>
    </div>
  );
}

export function WorkflowInstanceKpiStrip({
  progressPercent,
  completedCount,
  currentCount,
  remainingCount,
  totalStages,
  workflowNumber,
  startedAt,
  createdAt
}: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        <RequestSection workflowNumber={workflowNumber} createdAt={createdAt} startedAt={startedAt} />

        <SectionDivider />

        <StatSection
          icon={<Timer className="h-4 w-4 text-zinc-500" strokeWidth={2} />}
          iconRing="border-2 border-zinc-400"
          title="المتبقية"
          titleColor="text-zinc-600 dark:text-zinc-300"
          value={remainingCount}
          valueColor="text-zinc-700 dark:text-zinc-200"
          subtitle={stageCountLabel(remainingCount)}
        />

        <SectionDivider />

        <StatSection
          icon={<Play className="h-3.5 w-3.5 text-blue-500" strokeWidth={2} />}
          iconRing="border-2 border-blue-500"
          title="الحالية"
          titleColor="text-blue-600"
          value={currentCount}
          valueColor="text-blue-600"
          subtitle={stageCountLabel(currentCount)}
        />

        <SectionDivider />

        <StatSection
          icon={<Check className="h-4 w-4 text-emerald-500" strokeWidth={2.5} />}
          iconRing="border-2 border-emerald-500"
          title="المنتهية"
          titleColor="text-emerald-600"
          value={completedCount}
          valueColor="text-emerald-600"
          subtitle={`من ${totalStages} مراحل`}
        />

        <SectionDivider />

        <ProgressSection percent={progressPercent} />
      </div>
    </div>
  );
}
