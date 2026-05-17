"use client";

import type { ComponentProps } from "react";

import { SfDrawer } from "@/components/smart-factory/sf-drawer";
import { cn } from "@/lib/utils";

const atlasDrawerClass =
  "border-atlas-rule bg-atlas-paper shadow-atlasLift before:hidden sm:rounded-s-sm [&_.text-sf-ink]:text-atlas-ink [&_.text-sf-muted]:text-atlas-muted [&_.text-sf-copy]:text-atlas-slate [&_.border-sf-hairline]:border-atlas-rule";

/** درج جانبي بنمط Atlas للقوى العاملة. */
export function WfmDrawer(
  props: ComponentProps<typeof SfDrawer>
) {
  return (
    <SfDrawer
      {...props}
      contentClassName={cn(atlasDrawerClass, props.contentClassName)}
    />
  );
}
