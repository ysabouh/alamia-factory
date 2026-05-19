"use client";

import type { ComponentProps } from "react";

import { SfDrawer } from "@/components/smart-factory/sf-drawer";
import { cn } from "@/lib/utils";

/** درج جانبي بنمط Atlas للقوى العاملة (لوحة تفاصيل تشغيلية). */
export function WfmDrawer({ contentClassName, ...props }: ComponentProps<typeof SfDrawer>) {
  return (
    <SfDrawer
      {...props}
      variant="atlas"
      contentClassName={cn(contentClassName)}
    />
  );
}
