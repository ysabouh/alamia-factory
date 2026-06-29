"use client";

import { useEffect, useMemo, useState } from "react";

import { WfmSearchableSelect, type WfmSearchableOption } from "@/components/workforce/atlas/wfm-searchable-select";
import { fetchAllPaged } from "@/lib/api/workforce-client";

import { parseApiEmployeeDetail } from "../workforce-employee-mapper";

type Props = {
  value: string;
  onChange: (employeeId: string) => void;
  excludeEmployeeId?: string;
  disabled?: boolean;
};

export function EmployeeManagerPicker({ value, onChange, excludeEmployeeId, disabled }: Props) {
  const [options, setOptions] = useState<WfmSearchableOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const rows = await fetchAllPaged<unknown>("/workforce/employees?isActive=true&sortBy=firstName&sortOrder=asc");
        if (cancelled) return;
        const opts = rows
          .map((row) => parseApiEmployeeDetail(row))
          .filter((e): e is NonNullable<typeof e> => e !== null)
          .filter((e) => e.id !== excludeEmployeeId)
          .map((e) => ({
            id: e.id,
            label: `${e.fullName} — ${e.employeeNumber}`,
            subtitle: [e.jobRole?.name, e.department?.name].filter(Boolean).join(" · ") || undefined,
            searchText: `${e.fullName} ${e.employeeNumber} ${e.jobRole?.name ?? ""} ${e.department?.name ?? ""} ${e.jobRole?.code ?? ""}`
          }));
        setOptions(opts);
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [excludeEmployeeId]);

  const placeholder = useMemo(
    () => (loading ? "جاري تحميل المدراء…" : "ابحث بالاسم، الرقم، القسم، أو الدور…"),
    [loading]
  );

  return (
    <WfmSearchableSelect
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled || loading}
      emptyMessage={loading ? "جاري التحميل…" : "لا يوجد موظف مطابق"}
    />
  );
}
