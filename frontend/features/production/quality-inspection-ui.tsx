import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { InspectionResultStatus, InspectionStatus } from "@/lib/api/production-client";
import { cn } from "@/lib/utils";

export const inspectionStatusLabels: Record<InspectionStatus, string> = {
  passed: "ناجح",
  warning: "تحذير",
  failed: "فاشل"
};

export const inspectionResultLabels: Record<InspectionResultStatus, string> = {
  pass: "مقبول",
  fail: "مرفوض",
  warning: "تحذير"
};

export const checklistItemTypeLabels: Record<string, string> = {
  numeric: "رقمي",
  boolean: "نعم/لا",
  text: "نص",
  selection: "اختيار"
};

const statusVariant: Record<InspectionStatus, "success" | "warning" | "destructive"> = {
  passed: "success",
  warning: "warning",
  failed: "destructive"
};

const statusIcon: Record<InspectionStatus, typeof CheckCircle2> = {
  passed: CheckCircle2,
  warning: AlertTriangle,
  failed: XCircle
};

export function InspectionStatusBadge({ status }: { status: InspectionStatus }) {
  const Icon = statusIcon[status];
  return (
    <Badge variant={statusVariant[status]} className="gap-1.5">
      <Icon className="h-3.5 w-3.5" />
      {inspectionStatusLabels[status]}
    </Badge>
  );
}

export function InspectionResultBadge({ status }: { status: InspectionResultStatus }) {
  const variant = status === "pass" ? "success" : status === "fail" ? "destructive" : "warning";
  return <Badge variant={variant}>{inspectionResultLabels[status]}</Badge>;
}

type PillColors = { badge: string; ring: string; dot: string };

type PillOption = {
  value: string;
  label: string;
  colors: PillColors;
};

export function QualityOptionPills({
  options,
  value,
  onChange,
  disabled
}: {
  options: PillOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition",
              opt.colors.badge,
              selected ? `ring-2 ring-offset-1 ${opt.colors.ring}` : "opacity-75 hover:opacity-100"
            )}
          >
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", opt.colors.dot)} />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export const booleanOptions: PillOption[] = [
  {
    value: "true",
    label: "مقبول",
    colors: {
      dot: "bg-emerald-500",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
      ring: "ring-emerald-400"
    }
  },
  {
    value: "false",
    label: "مرفوض",
    colors: {
      dot: "bg-red-500",
      badge: "bg-red-100 text-red-800 border-red-200",
      ring: "ring-red-400"
    }
  }
];

export const resultStatusOptions: PillOption[] = [
  {
    value: "pass",
    label: "مقبول",
    colors: {
      dot: "bg-emerald-500",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
      ring: "ring-emerald-400"
    }
  },
  {
    value: "warning",
    label: "تحذير",
    colors: {
      dot: "bg-amber-500",
      badge: "bg-amber-100 text-amber-900 border-amber-200",
      ring: "ring-amber-400"
    }
  },
  {
    value: "fail",
    label: "مرفوض",
    colors: {
      dot: "bg-red-500",
      badge: "bg-red-100 text-red-800 border-red-200",
      ring: "ring-red-400"
    }
  }
];

export function selectionOptionsFromList(opts: string[]): PillOption[] {
  const palettes: PillColors[] = [
    { dot: "bg-sky-500", badge: "bg-sky-100 text-sky-800 border-sky-200", ring: "ring-sky-400" },
    { dot: "bg-violet-500", badge: "bg-violet-100 text-violet-800 border-violet-200", ring: "ring-violet-400" },
    { dot: "bg-teal-500", badge: "bg-teal-100 text-teal-800 border-teal-200", ring: "ring-teal-400" },
    { dot: "bg-orange-500", badge: "bg-orange-100 text-orange-800 border-orange-200", ring: "ring-orange-400" }
  ];
  return opts.map((opt, i) => ({
    value: opt,
    label: opt,
    colors: palettes[i % palettes.length]
  }));
}

export function formatInspectionDatetime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("ar");
}

export function formatMeasuredDisplay(
  value: string | number | boolean | null | undefined,
  itemType?: string | null
) {
  if (value === true || value === "true") return itemType === "boolean" ? "مقبول" : "نعم";
  if (value === false || value === "false") return itemType === "boolean" ? "مرفوض" : "لا";
  if (value == null || value === "") return "—";
  return String(value);
}

export function QualityPanelIcon() {
  return <ShieldCheck className="h-4 w-4 text-sky-600" />;
}
