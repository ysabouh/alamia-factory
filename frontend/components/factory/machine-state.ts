import type { MachineStatus } from "@/types/factory";

export type IndustrialMachineState = MachineStatus | "alarm" | "offline";

export interface MachineStateVisual {
  label: string;
  shortLabel: string;
  panelClass: string;
  lightClass: string;
  glowClass: string;
  animationClass: string;
  description: string;
}

export const machineStateVisuals: Record<IndustrialMachineState, MachineStateVisual> = {
  running: {
    label: "تشغيل مستقر",
    shortLabel: "RUN",
    panelClass: "border-green-400/25 bg-green-400/10",
    lightClass: "bg-green-300",
    glowClass: "shadow-glowGreen",
    animationClass: "pulse-live",
    description: "الماكينة تعمل ضمن الحدود الطبيعية وتغذي لوحة الإنتاج الحية."
  },
  idle: {
    label: "انتظار تشغيل",
    shortLabel: "IDLE",
    panelClass: "border-amber-400/25 bg-amber-400/10",
    lightClass: "bg-amber-300",
    glowClass: "",
    animationClass: "",
    description: "الماكينة جاهزة ولكن لا تنتج حالياً أو تنتظر مواد/قالب/أمر تشغيل."
  },
  maintenance: {
    label: "صيانة",
    shortLabel: "MNT",
    panelClass: "border-sky-400/25 bg-sky-400/10",
    lightClass: "bg-sky-300",
    glowClass: "shadow-glowCyan",
    animationClass: "pulse-live",
    description: "الماكينة تحت تدخل فني ويجب ربط الحالة ببلاغ صيانة."
  },
  down: {
    label: "عطل حرج",
    shortLabel: "DOWN",
    panelClass: "border-red-500/30 bg-red-500/10",
    lightClass: "bg-red-400",
    glowClass: "shadow-glowRed",
    animationClass: "blink-alarm",
    description: "توقف غير مخطط يؤثر على الإنتاج ويحتاج تصعيد."
  },
  alarm: {
    label: "إنذار",
    shortLabel: "ALM",
    panelClass: "border-red-500/30 bg-red-500/10",
    lightClass: "bg-red-400",
    glowClass: "shadow-glowRed",
    animationClass: "blink-alarm",
    description: "إشارة إنذار من النظام أو من المشرف تتطلب انتباه غرفة التحكم."
  },
  offline: {
    label: "غير متصل",
    shortLabel: "OFF",
    panelClass: "border-slate-500/25 bg-slate-500/10",
    lightClass: "bg-slate-400",
    glowClass: "",
    animationClass: "",
    description: "لا توجد إشارة حديثة أو الماكينة خارج الشبكة التشغيلية."
  }
};

export function getMachineStateVisual(status: IndustrialMachineState): MachineStateVisual {
  return machineStateVisuals[status];
}
