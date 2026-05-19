"use client";

import dayjs from "dayjs";
import { create } from "zustand";

import {
  workforceAttendanceApi,
  type AttendanceDashboardJson,
  type DailyAttendanceDefaultsJson,
  type DailyAttendanceRowJson
} from "@/lib/api/workforce-attendance-client";

type AttendanceState = {
  selectedDate: string;
  search: string;
  departmentId: string;
  shiftId: string;
  dashboard: AttendanceDashboardJson | null;
  defaults: DailyAttendanceDefaultsJson | null;
  rows: DailyAttendanceRowJson[];
  loading: boolean;
  error: string | null;
  setSelectedDate: (d: string) => void;
  setSearch: (s: string) => void;
  setDepartmentId: (id: string) => void;
  setShiftId: (id: string) => void;
  refresh: () => Promise<void>;
};

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  selectedDate: dayjs().format("YYYY-MM-DD"),
  search: "",
  departmentId: "all",
  shiftId: "all",
  dashboard: null,
  defaults: null,
  rows: [],
  loading: false,
  error: null,

  setSelectedDate: (d) => set({ selectedDate: d }),
  setSearch: (s) => set({ search: s }),
  setDepartmentId: (id) => set({ departmentId: id }),
  setShiftId: (id) => set({ shiftId: id }),

  refresh: async () => {
    const { selectedDate, search, departmentId, shiftId } = get();
    set({ loading: true, error: null });
    try {
      const filters = {
        date: selectedDate,
        search: search.trim() || undefined,
        departmentId: departmentId !== "all" ? departmentId : undefined,
        shiftId: shiftId !== "all" ? shiftId : undefined
      };
      const daily = await workforceAttendanceApi.dailyRoster(filters);
      set({
        dashboard: daily.statistics,
        defaults: daily.defaults,
        rows: daily.rows,
        loading: false
      });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "فشل تحميل الحضور"
      });
    }
  }
}));
