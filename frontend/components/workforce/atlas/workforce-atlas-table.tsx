"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const WfmTable = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <TableWrap>
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm text-atlas-slate", "[&_tbody_tr:nth-child(even)]:bg-atlas-canvas/60", className)}
        {...props}
      />
    </TableWrap>
  )
);
WfmTable.displayName = "WfmTable";

function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-x-auto rounded-sm border border-atlas-rule bg-atlas-paper shadow-atlasCard">
      {children}
    </div>
  );
}

export const WfmTableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("[&_tr]:border-b [&_tr]:border-atlas-rule bg-atlas-tableHead", className)} {...props} />
  )
);
WfmTableHeader.displayName = "WfmTableHeader";

export const WfmTableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  )
);
WfmTableBody.displayName = "WfmTableBody";

export const WfmTableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn("border-b border-atlas-rule/80 transition-colors hover:bg-atlas-brandSoft/40", className)}
      {...props}
    />
  )
);
WfmTableRow.displayName = "WfmTableRow";

export const WfmTableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-11 px-4 text-start align-middle text-[10px] font-bold uppercase tracking-[0.16em] text-atlas-muted",
        className
      )}
      {...props}
    />
  )
);
WfmTableHead.displayName = "WfmTableHead";

export const WfmTableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("px-4 py-3 align-middle text-atlas-ink", className)} {...props} />
  )
);
WfmTableCell.displayName = "WfmTableCell";
