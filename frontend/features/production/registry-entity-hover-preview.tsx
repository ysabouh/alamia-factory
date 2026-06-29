"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Factory, Hash, Layers, Package, type LucideIcon } from "lucide-react";

import { resolveMediaUrl } from "@/lib/api/resolve-media-url";
import { cn } from "@/lib/utils";

type Variant = "product" | "machine" | "mold";

const variantStyles: Record<
  Variant,
  { accent: string; bar: string; ring: string; fallback: string; Icon: LucideIcon }
> = {
  product: {
    accent: "text-blue-600",
    bar: "from-blue-400 via-blue-500 to-sky-500",
    ring: "ring-blue-300",
    fallback: "from-blue-400 to-blue-600",
    Icon: Package
  },
  machine: {
    accent: "text-violet-600",
    bar: "from-violet-400 via-violet-500 to-purple-500",
    ring: "ring-violet-300",
    fallback: "from-violet-400 to-violet-600",
    Icon: Factory
  },
  mold: {
    accent: "text-orange-600",
    bar: "from-orange-400 via-orange-500 to-amber-500",
    ring: "ring-orange-300",
    fallback: "from-orange-400 to-orange-600",
    Icon: Layers
  }
};

function initials(text: string) {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return text.slice(0, 2).toUpperCase() || "?";
}

function PreviewAvatar({
  name,
  imageUrl,
  variant
}: {
  name: string;
  imageUrl?: string | null;
  variant: Variant;
}) {
  const [broken, setBroken] = useState(false);
  const url = imageUrl?.trim() ? resolveMediaUrl(imageUrl) : "";
  const style = variantStyles[variant];
  const Icon = style.Icon;

  if (!url || broken) {
    return (
      <div
        className={cn(
          "flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br text-xl font-bold text-white shadow-inner",
          style.fallback
        )}
      >
        {name ? initials(name) : <Icon className="h-8 w-8" />}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      className={cn("h-20 w-20 rounded-xl object-cover ring-2 shadow-md", style.ring)}
      onError={() => setBroken(true)}
    />
  );
}

type MetaLine = { icon?: LucideIcon; label: string; value: string };

type Props = {
  variant: Variant;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  meta?: MetaLine[];
  children: ReactNode;
  className?: string;
};

export function RegistryEntityHoverPreview({
  variant,
  title,
  subtitle,
  imageUrl,
  meta = [],
  children,
  className
}: Props) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const style = variantStyles[variant];

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

  const card = open ? (
    <div
      role="tooltip"
      className="pointer-events-auto fixed z-[300] w-[280px] overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-gray-100 via-gray-50 to-gray-100 text-gray-800 shadow-lg transition-opacity duration-150"
      style={{ top: pos.top, left: pos.left }}
      onMouseEnter={cancelHide}
      onMouseLeave={hide}
    >
      <div className={cn("h-1 bg-gradient-to-r", style.bar)} />
      <div className="flex gap-4 border-b border-border/40 p-4">
        <PreviewAvatar name={title} imageUrl={imageUrl} variant={variant} />
        <div className="min-w-0 flex-1 space-y-2 pt-1">
          <p className="truncate text-base font-semibold leading-tight text-gray-900">{title}</p>
          {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
          <div className="space-y-1.5 text-xs text-gray-600">
            {meta.map((line) => {
              const Icon = line.icon ?? Hash;
              return (
                <p key={`${line.label}-${line.value}`} className="flex items-center gap-1.5 border-s-2 border-current ps-2">
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", style.accent)} />
                  <span className="truncate">
                    {line.label}: {line.value}
                  </span>
                </p>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div
        ref={anchorRef}
        className={cn("min-w-0", className)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </div>
      {typeof document !== "undefined" && card ? createPortal(card, document.body) : null}
    </>
  );
}
