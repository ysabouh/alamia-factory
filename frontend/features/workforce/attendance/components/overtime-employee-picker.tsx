"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

import { WfmInput } from "@/components/workforce/atlas";
import { cn } from "@/lib/utils";

export type OvertimeEmployeeOption = { id: string; label: string };

type Props = {
  employees: OvertimeEmployeeOption[];
  excludedIds: Set<string>;
  value: string;
  onChange: (employeeId: string) => void;
  inputClassName?: string;
  disabled?: boolean;
};

export function OvertimeEmployeePicker({
  employees,
  excludedIds,
  value,
  onChange,
  inputClassName,
  disabled
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = employees.find((e) => e.id === value);

  useEffect(() => {
    if (selected) setQuery(selected.label);
    else setQuery("");
  }, [selected?.id, selected?.label]);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter((e) => {
      if (excludedIds.has(e.id) && e.id !== value) return false;
      if (!q) return true;
      return e.label.toLowerCase().includes(q);
    });
  }, [employees, excludedIds, query, value]);

  useEffect(() => {
    const onDoc = (ev: MouseEvent) => {
      if (!rootRef.current?.contains(ev.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute start-2 top-2.5 h-4 w-4 text-atlas-muted" aria-hidden />
        <WfmInput
          className={cn("ps-8", inputClassName)}
          placeholder="ابحث بالاسم أو الرقم الوظيفي…"
          value={query}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value.trim()) onChange("");
          }}
        />
      </div>
      {open && !disabled ? (
        <ul
          className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-sm border border-atlas-rule bg-atlas-paper py-1 shadow-atlasCard"
          role="listbox"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-atlas-muted">لا يوجد موظف مطابق</li>
          ) : (
            options.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  role="option"
                  className={cn(
                    "w-full px-3 py-2 text-start text-sm hover:bg-atlas-canvas/80",
                    value === e.id && "bg-atlas-brand/10 font-medium text-atlas-brand"
                  )}
                  onClick={() => {
                    onChange(e.id);
                    setQuery(e.label);
                    setOpen(false);
                  }}
                >
                  {e.label}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
