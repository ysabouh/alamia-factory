import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md",
        secondary: "bg-muted text-foreground shadow-sm hover:bg-muted/80",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-muted",
        ghost: "hover:bg-muted",
        industrial: "bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-md hover:from-sky-500 hover:to-cyan-400",
        /** Dark HMI primaries — Tesla/Siemens inspired */
        sfAccent:
          "border border-sf-stroke/70 bg-gradient-to-b from-sf-panel2 to-sf-panel text-sf-ink shadow-glowCyan hover:border-sf-accentCool/75 hover:shadow-[0_0_40px_rgba(0,212,170,0.18)] active:brightness-95",
        sfCool:
          "border border-sf-accentCool/50 bg-gradient-to-br from-sf-panel to-sf-deep text-sf-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-sf-accentCool/85",
        sfMuted:
          "border border-sf-stroke/45 bg-white/[0.06] text-sf-copy shadow-sm hover:bg-white/[0.1] hover:border-sf-stroke/65",
        sfDanger:
          "border border-red-500/35 bg-red-950/55 text-red-100 shadow-glowRed hover:bg-red-900/50",
        sfGhost:
          "border border-transparent text-sf-copy hover:border-sf-accentCool/40 hover:bg-sf-accentCool/[0.08]",
        /** Atlas dashboard controls — pair with `atlas.*` Tailwind tokens */
        atlasPrimary:
          "rounded-md bg-atlas-brand text-white shadow-atlasBar hover:bg-atlas-brandHover focus-visible:ring-2 focus-visible:ring-atlas-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-atlas-paper",
        atlasSoft:
          "rounded-md bg-atlas-brandSoft text-atlas-brand hover:bg-atlas-brandSoftHover focus-visible:ring-2 focus-visible:ring-atlas-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-atlas-paper",
        atlasOutline:
          "rounded-md border border-atlas-rule bg-atlas-paper font-medium text-atlas-ink shadow-atlasBar hover:bg-atlas-canvas focus-visible:ring-2 focus-visible:ring-atlas-brand/25 focus-visible:ring-offset-2 focus-visible:ring-offset-atlas-paper",
        atlasSecondary:
          "rounded-md bg-atlas-accent font-medium text-white shadow-atlasBar hover:bg-atlas-accentHover focus-visible:ring-2 focus-visible:ring-atlas-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-atlas-paper",
        atlasDanger:
          "rounded-md bg-atlas-danger font-medium text-white shadow-atlasBar hover:bg-atlas-danger/90 focus-visible:ring-2 focus-visible:ring-atlas-danger/45 focus-visible:ring-offset-2 focus-visible:ring-offset-atlas-paper",
        atlasLink:
          "rounded-md bg-transparent text-atlas-brand underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-atlas-brand/35 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
