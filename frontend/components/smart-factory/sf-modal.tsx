"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SfModal({
  title,
  description,
  children,
  footer,
  trigger,
  open,
  defaultOpen,
  onOpenChange,
  showClose,
  contentClassName
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
  contentClassName?: string;
}) {
  const closable = showClose !== false;

  return (
    <Dialog.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-[200] bg-black/72 backdrop-blur-[2px]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[201] grid w-[min(100vw-1.5rem,28rem)] max-h-[min(88vh,40rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-module border border-sf-stroke/60 p-6 shadow-industrial outline-none",
            "bg-gradient-to-b from-sf-chassis via-sf-panel to-sf-deep",
            "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(135deg,rgba(0,212,170,0.07),transparent_42%)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-150",
            contentClassName
          )}
        >
          <div className="relative flex items-start gap-3 pe-10">
            <div className="min-w-0 flex-1 space-y-2">
              <Dialog.Title className="font-industrial text-base font-semibold tracking-tight text-sf-ink">
                {title}
              </Dialog.Title>
              {description ? (
                <Dialog.Description asChild>
                  <div className="text-sm leading-relaxed text-sf-muted">{description}</div>
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
                  className="absolute end-4 top-0 h-8 w-8 rounded-full text-sf-muted hover:bg-white/[0.06] hover:text-sf-copy"
                >
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            ) : null}
          </div>

          {children ? (
            <div className="relative space-y-3 border-t border-sf-hairline pt-4 text-sm leading-relaxed text-sf-copy">
              {children}
            </div>
          ) : null}

          {footer ? (
            <div className="relative flex flex-wrap items-center justify-end gap-2 border-t border-sf-hairline pt-4 [&_button]:rounded-xl">
              {footer}
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
