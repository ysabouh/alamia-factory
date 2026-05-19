"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SheetSide = "start" | "end";

export function SfDrawer({
  title,
  description,
  children,
  footer,
  trigger,
  open,
  defaultOpen,
  onOpenChange,
  showClose,
  side = "end",
  widthClassName,
  contentClassName,
  variant = "industrial"
}: {
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  trigger?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showClose?: boolean;
  /** Logical edge (`end` aligns with RTL). */
  side?: SheetSide;
  widthClassName?: string;
  contentClassName?: string;
  /** `atlas` = لوحة فاتحة (WFM / سجل العاملين). */
  variant?: "industrial" | "atlas";
}) {
  const closable = showClose !== false;
  const atlas = variant === "atlas";
  const edge =
    side === "end"
      ? "end-0 data-[state=open]:animate-in data-[state=open]:slide-in-from-right-[100%] data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-[100%]"
      : "start-0 data-[state=open]:animate-in data-[state=open]:slide-in-from-left-[100%] data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left-[100%]";

  return (
    <Dialog.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-[200] backdrop-blur-[2px]",
            atlas ? "bg-atlas-ink/25" : "bg-black/72",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />
        <Dialog.Content
          className={cn(
            "fixed inset-y-0 z-[201] grid max-h-none w-[min(100vw-0.75rem,24rem)] grid-rows-[auto_1fr_auto] gap-4 px-6 py-6 outline-none sm:my-3 sm:border",
            atlas
              ? "border-atlas-rule bg-atlas-paper shadow-atlasLift sm:rounded-s-sm"
              : "shadow-industrial border-sf-stroke/55 sm:rounded-s-[1.5rem]",
            !atlas && side === "end" ? "sm:rounded-s-[1.5rem]" : null,
            !atlas && side !== "end" ? "sm:rounded-e-[1.5rem]" : null,
            edge,
            side === "end" ? "ms-auto" : "",
            widthClassName,
            !atlas && "bg-gradient-to-b from-sf-chassis via-sf-panel to-sf-deep",
            !atlas &&
              "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(180deg,rgba(34,211,238,0.055),transparent_38%)]",
            contentClassName
          )}
        >
          <header className="relative flex items-start gap-3 pe-10">
            <div className="min-w-0 flex-1 space-y-2">
              <Dialog.Title
                className={cn(
                  "text-base font-semibold tracking-tight",
                  atlas ? "text-atlas-ink" : "font-industrial text-sf-ink"
                )}
              >
                {title}
              </Dialog.Title>
              {description ? (
                <Dialog.Description asChild>
                  <div className={cn("text-sm leading-relaxed", atlas ? "text-atlas-muted" : "text-sf-muted")}>
                    {description}
                  </div>
                </Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            {closable ? (
              <Dialog.Close asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Close"
                  className={cn(
                    "absolute end-0 top-0 h-8 w-8",
                    atlas
                      ? "rounded-sm text-atlas-muted hover:bg-atlas-canvas hover:text-atlas-ink"
                      : "rounded-full text-sf-muted hover:bg-white/[0.06] hover:text-sf-copy"
                  )}
                >
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            ) : null}
          </header>

          {children ? (
            <div
              className={cn(
                "relative min-h-0 overflow-y-auto border-t pt-4 text-sm leading-relaxed",
                atlas ? "border-atlas-rule text-atlas-slate" : "border-sf-hairline text-sf-copy"
              )}
            >
              {children}
            </div>
          ) : (
            <div className="min-h-0" />
          )}

          {footer ? (
            <div
              className={cn(
                "relative flex flex-wrap items-center justify-end gap-2 border-t pt-4",
                atlas ? "border-atlas-rule [&_button]:rounded-sm" : "border-sf-hairline [&_button]:rounded-xl"
              )}
            >
              {footer}
            </div>
          ) : (
            <div />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
