"use client";

import dayjs from "dayjs";
import { create } from "zustand";

import { payrollWeekBounds, previousPayrollWeekBounds } from "@/lib/attendance/payroll-weeks";
import { workforceAttendanceApi, type PayrollPreviewJson } from "@/lib/api/workforce-attendance-client";

type PayrollState = {
  periodStart: string;
  periodEnd: string;
  preview: PayrollPreviewJson | null;
  loading: boolean;
  generating: boolean;
  error: string | null;
  success: string | null;
  setPeriodStart: (iso: string) => void;
  setPeriodEnd: (iso: string) => void;
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  loadPreview: () => Promise<void>;
  generate: () => Promise<void>;
};

function applyWeekBounds(periodStart: string, periodEnd: string) {
  return { periodStart, periodEnd };
}

const initial = previousPayrollWeekBounds();

export const usePayrollStore = create<PayrollState>((set, get) => ({
  periodStart: initial.periodStart,
  periodEnd: initial.periodEnd,
  preview: null,
  loading: false,
  generating: false,
  error: null,
  success: null,

  setPeriodStart: (periodStart) => {
    const start = dayjs(periodStart);
    if (!start.isValid()) return;
    const { periodEnd } = payrollWeekBounds(start);
    set({ ...applyWeekBounds(periodStart, periodEnd), preview: null, success: null });
  },

  setPeriodEnd: (periodEnd) => {
    const end = dayjs(periodEnd);
    if (!end.isValid()) return;
    const { periodStart } = payrollWeekBounds(end);
    set({ ...applyWeekBounds(periodStart, periodEnd), preview: null, success: null });
  },

  goToPreviousWeek: () => {
    const sat = dayjs(get().periodStart).subtract(7, "day");
    const bounds = payrollWeekBounds(sat);
    set({ ...applyWeekBounds(bounds.periodStart, bounds.periodEnd), preview: null, success: null });
  },

  goToNextWeek: () => {
    const sat = dayjs(get().periodStart).add(7, "day");
    const bounds = payrollWeekBounds(sat);
    set({ ...applyWeekBounds(bounds.periodStart, bounds.periodEnd), preview: null, success: null });
  },

  loadPreview: async () => {
    const { periodStart, periodEnd } = get();
    if (!periodStart || !periodEnd || periodStart > periodEnd) {
      set({ error: "تحقق من تاريخي من وإلى", preview: null });
      return;
    }

    const anchor = dayjs(periodStart);
    const year = anchor.year();
    const month = anchor.month() + 1;

    set({ loading: true, error: null, success: null });
    try {
      const preview = await workforceAttendanceApi.payrollPreview(year, month, {
        periodStart,
        periodEnd
      });
      set({ preview, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : "فشل المعاينة" });
    }
  },

  generate: async () => {
    const { periodStart } = get();
    const anchor = dayjs(periodStart);
    const year = anchor.year();
    const month = anchor.month() + 1;

    set({ generating: true, error: null, success: null });
    try {
      await workforceAttendanceApi.payrollGenerate(year, month);
      set({ generating: false, success: "تم توليد مسير الرواتب (مسودة) بنجاح" });
      await get().loadPreview();
    } catch (e) {
      set({ generating: false, error: e instanceof Error ? e.message : "فشل التوليد" });
    }
  }
}));
