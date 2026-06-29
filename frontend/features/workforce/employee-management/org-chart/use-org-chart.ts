"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { workforceApi, WorkforceApiError } from "@/lib/api/workforce-client";

import type { OrgChartData } from "./org-chart-types";
import {
  DEFAULT_ORG_CHART_LAYOUT_SETTINGS,
  type OrgChartLayoutPayload,
  type OrgChartLayoutSettings,
  type OrgChartNodePosition
} from "./org-chart-settings-types";

export function useOrgChart() {
  const [data, setData] = useState<OrgChartData | null>(null);
  const [layout, setLayout] = useState<OrgChartLayoutPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const settingsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [chartRes, layoutRes] = await Promise.all([
        workforceApi.getOrgChart(),
        workforceApi.getOrgChartLayout()
      ]);
      setData({
        ...chartRes.data,
        factoryRoot: chartRes.data.factoryRoot ?? {
          type: "factory_root",
          id: "factory-root",
          title: "المصنع"
        },
        departmentTree: chartRes.data.departmentTree?.length
          ? chartRes.data.departmentTree
          : (chartRes.data.departments ?? []),
        reportingEdges: chartRes.data.reportingEdges ?? []
      });
      setLayout(layoutRes.data);
    } catch (e) {
      setError(e instanceof WorkforceApiError ? e.message : "تعذر تحميل الهيكل التنظيمي");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateReporting = useCallback(
    async (
      employeeId: string,
      reportsToId: string | null,
      departmentId?: string | null,
      orgPositionId?: string | null
    ) => {
      const body: { reportsToId: string | null; departmentId?: string | null; orgPositionId?: string | null } = {
        reportsToId
      };
      if (departmentId !== undefined) body.departmentId = departmentId;
      if (orgPositionId !== undefined) body.orgPositionId = orgPositionId;
      await workforceApi.updateReporting(employeeId, body);
      await load();
    },
    [load]
  );

  const applyLayoutLocally = useCallback((next: OrgChartLayoutPayload) => {
    setLayout(next);
  }, []);

  const updateLayoutSettings = useCallback(
    async (partial: Partial<OrgChartLayoutSettings>, options?: { debounce?: boolean }) => {
      if (!layout) return;

      const optimistic: OrgChartLayoutPayload = {
        settings: { ...layout.settings, ...partial },
        positions: layout.positions
      };
      setLayout(optimistic);

      const persist = async () => {
        try {
          const res = await workforceApi.updateOrgChartSettings(partial);
          setLayout(res.data);
        } catch {
          await load();
        }
      };

      if (options?.debounce) {
        if (settingsTimer.current) clearTimeout(settingsTimer.current);
        settingsTimer.current = setTimeout(() => void persist(), 500);
        return;
      }

      await persist();
    },
    [layout, load]
  );

  const saveNodePosition = useCallback(
    async (nodeId: string, position: OrgChartNodePosition) => {
      if (!layout) return;

      const optimistic: OrgChartLayoutPayload = {
        settings: layout.settings,
        positions: { ...layout.positions, [nodeId]: position }
      };
      setLayout(optimistic);

      try {
        const res = await workforceApi.updateOrgChartPositions({ [nodeId]: position });
        setLayout(res.data);
      } catch {
        await load();
      }
    },
    [layout, load]
  );

  const resetPositions = useCallback(async () => {
    try {
      const res = await workforceApi.resetOrgChartPositions();
      setLayout(res.data);
    } catch {
      await load();
    }
  }, [load]);

  return {
    data,
    layout: layout ?? { settings: DEFAULT_ORG_CHART_LAYOUT_SETTINGS, positions: {} },
    loading,
    error,
    reload: load,
    updateReporting,
    updateLayoutSettings,
    saveNodePosition,
    resetPositions,
    applyLayoutLocally
  };
}
