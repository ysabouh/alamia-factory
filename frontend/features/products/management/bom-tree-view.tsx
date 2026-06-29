"use client";

import { ChevronDown, ChevronLeft, Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { BomTreeNode } from "@/lib/api/assembly-client";

const componentTypeLabels: Record<string, string> = {
  raw_material: "مادة خام",
  component: "مكوّن",
  subassembly: "تجميع فرعي",
  packaging: "تغليف",
  consumable: "مستهلكات"
};

function BomTreeNodeRow({ node, depth = 0 }: { node: BomTreeNode; depth?: number }) {
  const hasChildren = (node.children?.length ?? 0) > 0;

  return (
    <div className="space-y-1">
      <div
        className="flex flex-wrap items-center gap-2 rounded-md border border-border/50 bg-card/40 px-3 py-2 text-sm"
        style={{ marginInlineStart: depth * 20 }}
      >
        {hasChildren ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground opacity-40" />
        )}
        <Package className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{node.childProductName ?? node.materialProductName}</span>
        <span className="text-xs text-muted-foreground">{node.childProductCode ?? node.materialProductCode}</span>
        <Badge variant="outline">× {node.quantity}</Badge>
        {node.componentType && (
          <Badge variant="secondary">{componentTypeLabels[node.componentType] ?? node.componentType}</Badge>
        )}
        {node.wastePercentage ? <span className="text-xs text-amber-600">+{node.wastePercentage}% هدر</span> : null}
        {"isOptional" in node && node.isOptional ? <Badge variant="outline">اختياري</Badge> : null}
      </div>
      {node.children?.map((child) => (
        <BomTreeNodeRow key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export function BomTreeView({ tree, costRollup }: { tree: BomTreeNode[]; costRollup?: { rolledUpCost: number } }) {
  if (!tree.length) {
    return <p className="text-sm text-muted-foreground">لا توجد مكوّنات في BOM</p>;
  }

  return (
    <div className="space-y-3">
      {costRollup !== undefined && (
        <p className="text-sm text-muted-foreground">
          تكلفة تراكمية تقديرية: <strong className="text-foreground">{costRollup.rolledUpCost.toFixed(2)}</strong>
        </p>
      )}
      {tree.map((node) => (
        <BomTreeNodeRow key={node.id} node={node} />
      ))}
    </div>
  );
}
