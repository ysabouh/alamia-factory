"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export const IndustrialTable = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-x-auto rounded-xl border border-sf-stroke/50 bg-gradient-to-b from-sf-chassis to-sf-deep shadow-industrial">
      <table
        ref={ref}
        className={cn(
          "w-full caption-bottom text-sm text-sf-copy",
          "[&_tbody_tr:nth-child(even)]:bg-white/[0.02]",
          className
        )}
        {...props}
      />
    </div>
  )

);

IndustrialTable.displayName = "IndustrialTable";

export const IndustrialTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "[&_tr]:border-b [&_tr]:border-sf-hairline",
      "bg-gradient-to-r from-sf-panel via-sf-panel2 to-sf-panel",
      className
    )}
    {...props}
  />
));

IndustrialTableHeader.displayName = "IndustrialTableHeader";

export const IndustrialTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
));

IndustrialTableBody.displayName = "IndustrialTableBody";

export const IndustrialTableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-sf-hairline/80 transition-colors hover:bg-sf-accentCool/[0.05]",
      className
    )}
    {...props}
  />
));

IndustrialTableRow.displayName = "IndustrialTableRow";

export const IndustrialTableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-11 px-4 text-start align-middle font-mono text-[10px] font-bold uppercase tracking-[0.18em]",
      "text-sf-copy/90",

      className
    )}
    {...props}
  />
));

IndustrialTableHead.displayName = "IndustrialTableHead";

export const IndustrialTableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td ref={ref} className={cn("px-4 py-3 align-middle text-sm", className)} {...props} />
));

IndustrialTableCell.displayName = "IndustrialTableCell";

export const IndustrialTableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn("mt-2 text-xs text-sf-muted", className)} {...props} />
));

IndustrialTableCaption.displayName = "IndustrialTableCaption";
