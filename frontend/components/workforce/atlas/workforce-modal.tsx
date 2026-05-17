"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** نافذة منبثقة بنمط Atlas (TSC / personnel). */
export function WfmModal({
  title,
  description,
  children,
  footer,
  open,
  onOpenChange,
  contentClassName
}: {
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  contentClassName?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[200] bg-atlas-ink/40 backdrop-blur-[1px]" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[201] grid w-[min(100vw-1.5rem,32rem)] max-h-[min(88vh,40rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-sm border border-atlas-rule bg-atlas-paper p-6 shadow-atlasLift outline-none",
            contentClassName
          )}
        >
          <div className="relative flex items-start gap-3 pe-10">
            <div className="min-w-0 flex-1 space-y-1">
              <Dialog.Title className="text-base font-bold text-atlas-ink">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="text-xs text-atlas-muted">{description}</Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close asChild>
              <Button type="button" variant="atlasOutline" size="icon" className="absolute end-0 top-0 h-8 w-8 shrink-0">
                <X className="h-4 w-4" />
                <span className="sr-only">إغلاق</span>
              </Button>
            </Dialog.Close>
          </div>
          {children ? <ModalBody>{children}</ModalBody> : null}
          {footer ? (
            <div className="flex flex-wrap justify-end gap-2 border-t border-atlas-rule pt-4">{footer}</div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ModalBody({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-atlas-slate">{children}</div>;
}
