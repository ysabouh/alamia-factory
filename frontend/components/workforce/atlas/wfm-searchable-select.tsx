"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

import { WfmInput } from "@/components/workforce/atlas/workforce-atlas-field";
import { cn } from "@/lib/utils";

export type WfmSearchableOption = {
  id: string;
  label: string;
  subtitle?: string;
  searchText?: string;
};

type Props = {
  options: WfmSearchableOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  emptyMessage?: string;
};

export function WfmSearchableSelect({
  options,
  value,
  onChange,
  placeholder = "ابحث…",
  disabled,
  className,
  emptyMessage = "لا توجد نتائج"
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    if (selected) setQuery(selected.label);
    else if (!open) setQuery("");
  }, [selected?.id, selected?.label, open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const hay = (o.searchText ?? `${o.label} ${o.subtitle ?? ""}`).toLowerCase();
      return hay.includes(q);
    });
  }, [options, query]);

  useEffect(() => {
    const onDoc = (ev: MouseEvent) => {
      if (!rootRef.current?.contains(ev.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute start-2 top-2.5 h-4 w-4 text-atlas-muted" aria-hidden />
        <WfmInput
          className="ps-8"
          placeholder={placeholder}
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
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-sm border border-atlas-rule bg-atlas-paper py-1 shadow-atlasCard"
          role="listbox"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-atlas-muted">{emptyMessage}</li>
          ) : (
            filtered.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === o.id}
                  className={cn(
                    "w-full px-3 py-2 text-start hover:bg-atlas-canvas/80",
                    value === o.id && "bg-atlas-brand/10"
                  )}
                  onClick={() => {
                    onChange(o.id);
                    setQuery(o.label);
                    setOpen(false);
                  }}
                >
                  <span className={cn("block text-sm", value === o.id && "font-medium text-atlas-brand")}>
                    {o.label}
                  </span>
                  {o.subtitle ? <span className="block text-[11px] text-atlas-muted">{o.subtitle}</span> : null}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
