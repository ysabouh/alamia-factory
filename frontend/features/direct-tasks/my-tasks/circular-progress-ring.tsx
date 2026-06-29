"use client";

import { cn } from "@/lib/utils";

export function CircularProgressRing({
  percent,
  size = 44,
  stroke = 4,
  className
}: {
  percent: number;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, percent)) / 100) * c;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-zinc-200 dark:text-zinc-700" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="text-sky-500 transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-zinc-700 dark:text-zinc-200">{percent}%</span>
    </div>
  );
}
