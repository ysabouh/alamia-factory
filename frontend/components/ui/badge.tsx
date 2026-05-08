import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/15 text-primary",
        secondary: "border-transparent bg-muted text-muted-foreground",
        destructive: "border-transparent bg-destructive/20 text-destructive",
        outline: "border-border text-foreground",
        success: "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
        warning: "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300",
        info: "border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-300"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
