"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Hash, User } from "lucide-react";

import { resolveMediaUrl } from "@/lib/api/resolve-media-url";
import type { WorkOrderWorkerJson } from "@/lib/api/production-client";
import { cn } from "@/lib/utils";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

function EmployeeAvatar({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
  const [broken, setBroken] = useState(false);
  const url = imageUrl?.trim() ? resolveMediaUrl(imageUrl) : "";

  if (!url || broken) {
    return (
      <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-xl font-bold text-white shadow-inner">
        {initials(name)}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      className="h-20 w-20 rounded-xl object-cover ring-2 ring-orange-300 shadow-md"
      onError={() => setBroken(true)}
    />
  );
}

type Props = {
  worker: WorkOrderWorkerJson;
  label?: string;
  className?: string;
};

export function WorkerEmployeeHoverLink({ worker, label, className }: Props) {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emp = worker.employee;
  const displayName = label ?? worker.employeeName ?? emp?.fullName ?? worker.employeeId;

  const updatePosition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cardW = 280;
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - cardW - 8);
    setPos({ top: rect.bottom + 10, left });
  }, []);

  const show = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    showTimer.current = setTimeout(() => {
      updatePosition();
      setOpen(true);
    }, 180);
  }, [updatePosition]);

  const hide = useCallback(() => {
    if (showTimer.current) clearTimeout(showTimer.current);
    hideTimer.current = setTimeout(() => setOpen(false), 120);
  }, []);

  const cancelHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, updatePosition]);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (showTimer.current) clearTimeout(showTimer.current);
    },
    []
  );

  const preview = emp ?? {
    fullName: displayName,
    employeeNumber: "",
    age: null as number | null,
    profileImage: null as string | null
  };

  const card = open ? (
    <div
      role="tooltip"
      className="pointer-events-auto fixed z-[300] w-[280px] overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-b from-gray-100 via-gray-50 to-gray-100 text-gray-800 shadow-lg shadow-orange-100/60 transition-opacity duration-150"
      style={{ top: pos.top, left: pos.left }}
      onMouseEnter={cancelHide}
      onMouseLeave={hide}
    >
      <div className="h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500" />
      <div className="flex gap-4 border-b border-orange-100 p-4">
        <EmployeeAvatar name={preview.fullName} imageUrl={preview.profileImage} />
        <div className="min-w-0 flex-1 space-y-2 pt-1">
          <p className="truncate text-base font-semibold leading-tight text-gray-900">{preview.fullName}</p>
          <div className="space-y-1.5 text-xs text-gray-600">
            <p className="flex items-center gap-1.5 border-s-2 border-orange-400 ps-2">
              <Hash className="h-3.5 w-3.5 shrink-0 text-orange-500" />
              <span>الرقم الوظيفي: {preview.employeeNumber || "—"}</span>
            </p>
            <p className="flex items-center gap-1.5 border-s-2 border-orange-400 ps-2">
              <User className="h-3.5 w-3.5 shrink-0 text-orange-500" />
              <span>العمر: {preview.age != null ? `${preview.age} سنة` : "—"}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className={cn(
          "font-medium text-orange-600 underline-offset-4 transition hover:text-orange-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50",
          className
        )}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {displayName}
      </button>
      {typeof document !== "undefined" && card ? createPortal(card, document.body) : null}
    </>
  );
}
