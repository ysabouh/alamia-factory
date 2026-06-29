"use client";

import { Settings2 } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { WfmInput, WfmSelect } from "@/components/workforce/atlas";
import { deptVisual } from "./org-chart-config";
import type { OrgChartData } from "./org-chart-types";
import type { OrgChartLayoutPayload, OrgChartLayoutSettings } from "./org-chart-settings-types";

type Props = {
  canManage: boolean;
  data: OrgChartData;
  layout: OrgChartLayoutPayload;
  onSettingsChange: (partial: Partial<OrgChartLayoutSettings>, options?: { debounce?: boolean }) => void;
  onResetPositions: () => Promise<void>;
};

export function OrgChartSettingsPanel({
  canManage,
  data,
  layout,
  onSettingsChange,
  onResetPositions
}: Props) {
  const [open, setOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { settings } = layout;

  const set = useCallback(
    (partial: Partial<OrgChartLayoutSettings>, debounce = false) => {
      void onSettingsChange(partial, debounce ? { debounce: true } : undefined);
    },
    [onSettingsChange]
  );

  const onDeptColor = (code: string, color: string) => {
    const next = { ...settings.departmentColors };
    if (!color || color === deptVisual(code).color) {
      delete next[code.toUpperCase()];
    } else {
      next[code.toUpperCase()] = color;
    }
    void onSettingsChange({ departmentColors: next });
  };

  const onReset = async () => {
    setResetting(true);
    try {
      await onResetPositions();
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="org-chart-no-print border-b border-atlas-rule bg-atlas-paper">
      <div className="flex items-center gap-2 px-3 py-2">
        <Button
          type="button"
          variant={open ? "default" : "outline"}
          size="sm"
          onClick={() => setOpen((v) => !v)}
        >
          <Settings2 className="ms-1 h-4 w-4" />
          إعدادات العرض
        </Button>
        {canManage ? (
          <span className="text-xs text-atlas-muted">انقر بزر الماوس الأيمن على موظف ← «تغيير المدير المباشر»</span>
        ) : null}
        {settings.layoutMode === "manual" && (
          <span className="text-xs text-atlas-muted">اسحب العقد لتحريك مواقعها فقط</span>
        )}
      </div>

      {open && (
        <div className="grid gap-4 border-t border-atlas-rule px-3 py-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs text-atlas-muted">
            وضع التخطيط
            <WfmSelect
              disabled={!canManage}
              value={settings.layoutMode}
              onChange={(e) =>
                set({
                  layoutMode: e.target.value as OrgChartLayoutSettings["layoutMode"]
                })
              }
            >
              <option value="auto">تلقائي (dagre)</option>
              <option value="manual">يدوي (حفظ المواقع)</option>
            </WfmSelect>
          </label>

          <label className="flex flex-col gap-1 text-xs text-atlas-muted">
            الاتجاه
            <WfmSelect
              disabled={!canManage || settings.layoutMode === "manual"}
              value={settings.direction}
              onChange={(e) => set({ direction: e.target.value as OrgChartLayoutSettings["direction"] })}
            >
              <option value="TB">من أعلى لأسفل</option>
              <option value="LR">من اليسار لليمين</option>
            </WfmSelect>
          </label>

          <label className="flex flex-col gap-1 text-xs text-atlas-muted">
            تباعد أفقي ({settings.nodeSep}px)
            <input
              type="range"
              min={10}
              max={200}
              disabled={!canManage || settings.layoutMode === "manual"}
              value={settings.nodeSep}
              onChange={(e) => set({ nodeSep: Number(e.target.value) }, true)}
              className="w-full"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-atlas-muted">
            تباعد عمودي ({settings.rankSep}px)
            <input
              type="range"
              min={20}
              max={300}
              disabled={!canManage || settings.layoutMode === "manual"}
              value={settings.rankSep}
              onChange={(e) => set({ rankSep: Number(e.target.value) }, true)}
              className="w-full"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-atlas-muted">
            نوع الروابط
            <WfmSelect
              disabled={!canManage}
              value={settings.edgeType}
              onChange={(e) => set({ edgeType: e.target.value as OrgChartLayoutSettings["edgeType"] })}
            >
              <option value="smoothstep">منحني</option>
              <option value="step">متدرج</option>
              <option value="straight">مستقيم</option>
            </WfmSelect>
          </label>

          {canManage && settings.layoutMode === "manual" && (
            <div className="flex items-end">
              <Button type="button" variant="outline" size="sm" disabled={resetting} onClick={() => void onReset()}>
                مسح المواقع المحفوظة
              </Button>
            </div>
          )}

          {(data.departments?.length ?? 0) > 0 && (
            <div className="col-span-full border-t border-atlas-rule pt-3">
              <p className="mb-2 text-xs font-medium text-atlas-ink">ألوان الأقسام</p>
              <div className="flex flex-wrap gap-3">
                {(data.departments ?? []).map((dept) => {
                  const code = (dept.code ?? "").toUpperCase();
                  const defaultColor = deptVisual(code).color;
                  const value = settings.departmentColors[code] ?? defaultColor;
                  return (
                    <label key={dept.departmentId} className="flex items-center gap-2 text-xs text-atlas-muted">
                      <span className="min-w-[4rem] font-mono">{code}</span>
                      <input
                        type="color"
                        disabled={!canManage}
                        value={value}
                        onChange={(e) => onDeptColor(code, e.target.value)}
                      />
                      {canManage && settings.departmentColors[code] && (
                        <button
                          type="button"
                          className="text-[10px] text-atlas-brand underline"
                          onClick={() => onDeptColor(code, defaultColor)}
                        >
                          افتراضي
                        </button>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
