"use client";

import { WfmSelect } from "@/components/workforce/atlas";
import {
  formatOvertimeTime,
  OVERTIME_HOUR_OPTIONS,
  OVERTIME_MINUTE_OPTIONS,
  OVERTIME_HOUR_MAX,
  parseOvertimeTime
} from "@/lib/attendance/overtime-time";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  selectClassName?: string;
  disabled?: boolean;
};

export function OvertimeTimeSelect({ value, onChange, className, selectClassName, disabled }: Props) {
  const { hour, minute } = parseOvertimeTime(value);
  const minuteDisabled = hour === OVERTIME_HOUR_MAX;

  const setHour = (h: number) => {
    const nextMinute = h === OVERTIME_HOUR_MAX ? 0 : minute;
    onChange(formatOvertimeTime(h, nextMinute));
  };

  const setMinute = (m: number) => {
    onChange(formatOvertimeTime(hour, m));
  };

  return (
    <div className={cn("flex items-center gap-1", className)} dir="ltr">
      <WfmSelect
        aria-label="ساعة"
        className={cn("min-w-[4.25rem] font-mono tabular-nums", selectClassName)}
        value={hour}
        disabled={disabled}
        onChange={(e) => setHour(Number(e.target.value))}
      >
        {OVERTIME_HOUR_OPTIONS.map((h) => (
          <option key={h} value={h}>
            {String(h).padStart(2, "0")}
          </option>
        ))}
      </WfmSelect>
      <span className="text-atlas-muted" aria-hidden>
        :
      </span>
      <WfmSelect
        aria-label="دقيقة"
        className={cn("min-w-[4.25rem] font-mono tabular-nums", selectClassName)}
        value={minuteDisabled ? 0 : minute}
        disabled={disabled || minuteDisabled}
        onChange={(e) => setMinute(Number(e.target.value))}
      >
        {OVERTIME_MINUTE_OPTIONS.map((m) => (
          <option key={m} value={m}>
            {String(m).padStart(2, "0")}
          </option>
        ))}
      </WfmSelect>
    </div>
  );
}
