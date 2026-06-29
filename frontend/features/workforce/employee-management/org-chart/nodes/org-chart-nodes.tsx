"use client";

import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import {
  Award,
  Building2,
  Cog,
  Factory,
  UserCog,
  Users
} from "lucide-react";

import { WfmStatusBadge } from "@/components/workforce/atlas";
import { resolveMediaUrl } from "@/lib/api/resolve-media-url";
import { cn } from "@/lib/utils";

import { deptVisual } from "../org-chart-config";
import { useOrgChartInteraction } from "../org-chart-interaction-context";
import type { FlowNodeData } from "../org-chart-layout";
import type { OrgChartEmployeeNode } from "../org-chart-types";

function EmployeeAvatar({ name, url, size = "md" }: { name: string; url?: string | null; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-7 w-7 text-[10px]" : "h-10 w-10 text-xs";
  const resolved = url?.trim() ? resolveMediaUrl(url) : "";
  if (resolved) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={resolved} alt="" className={cn(dim, "rounded-full object-cover ring-2 ring-atlas-rule")} />
    );
  }
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("");
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-atlas-brand/15 font-bold text-atlas-brand ring-2 ring-atlas-rule",
        dim
      )}
    >
      {initials || "?"}
    </div>
  );
}

function performanceTone(score: number | null | undefined): string {
  if (score === null || score === undefined) return "text-atlas-muted";
  if (score >= 85) return "text-atlas-success";
  if (score >= 70) return "text-amber-600";
  return "text-atlas-danger";
}

function formatPerformance(score: number | null | undefined): string {
  if (score === null || score === undefined) return "—";
  return `${score.toLocaleString("ar")}%`;
}

export const OrgChartEmployeeEmbedRow = memo(function OrgChartEmployeeEmbedRow({
  employee,
  badge,
  highlighted
}: {
  employee: OrgChartEmployeeNode;
  badge?: string;
  highlighted?: boolean;
}) {
  const interaction = useOrgChartInteraction();
  const statusCode = employee.employmentStatus?.code?.toLowerCase() ?? "";
  const tone =
    statusCode.includes("termin") || !employee.isActive
      ? "danger"
      : statusCode.includes("leave") || statusCode.includes("suspend")
        ? "warning"
        : "active";

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2 rounded-sm border px-2 py-1.5 text-start transition-colors hover:bg-atlas-surface/80",
        highlighted ? "border-atlas-brand bg-atlas-brand/10 ring-1 ring-atlas-brand/30" : "border-atlas-rule bg-atlas-paper"
      )}
      onClick={() => interaction?.onEmployeeClick(employee)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        interaction?.onEmployeeContextMenu(e, employee);
      }}
    >
      <EmployeeAvatar name={employee.fullName} url={employee.profileImage} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="truncate text-xs font-semibold text-atlas-ink">{employee.fullName}</p>
          {badge ? (
            <span className="shrink-0 rounded bg-atlas-brand/15 px-1 py-0.5 text-[9px] font-medium text-atlas-brand">
              {badge}
            </span>
          ) : null}
        </div>
        <p className="truncate text-[10px] text-atlas-muted">
          {employee.orgPositionName ?? employee.position ?? "—"} · {employee.employeeNumber}
        </p>
      </div>
      <WfmStatusBadge tone={tone} className="shrink-0 text-[9px]">
        {employee.employmentStatus?.name ?? (employee.isActive ? "نشط" : "غير نشط")}
      </WfmStatusBadge>
    </button>
  );
});

export const EmployeeOrgNode = memo(function EmployeeOrgNode({
  data,
  selected
}: NodeProps<Node<FlowNodeData>>) {
  const emp = data.employee;
  if (!emp) return null;
  const statusCode = emp.employmentStatus?.code?.toLowerCase() ?? "";
  const tone =
    statusCode.includes("termin") || !emp.isActive
      ? "danger"
      : statusCode.includes("leave") || statusCode.includes("suspend")
        ? "warning"
        : "active";

  return (
    <div
      className={cn(
        "w-[240px] rounded-sm border bg-atlas-paper p-3 shadow-atlasCard transition-shadow",
        data.highlighted ? "border-atlas-brand ring-2 ring-atlas-brand/40" : "border-atlas-rule",
        selected && "border-atlas-brand"
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-atlas-brand" />
      <div className="flex gap-3">
        <EmployeeAvatar name={emp.fullName} url={emp.profileImage} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-atlas-ink">{emp.fullName}</p>
          <p className="truncate text-xs text-atlas-muted">{emp.position ?? "—"}</p>
          <p className="font-mono text-[10px] text-atlas-muted">{emp.employeeNumber}</p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <WfmStatusBadge tone={tone}>
          {emp.employmentStatus?.name ?? (emp.isActive ? "نشط" : "غير نشط")}
        </WfmStatusBadge>
        {emp.departmentName && (
          <span className="inline-flex items-center gap-0.5 rounded bg-atlas-surface px-1.5 py-0.5 text-[10px] text-atlas-muted">
            <Building2 className="h-3 w-3" />
            {emp.departmentName}
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-atlas-muted">
        {emp.currentShift && <span className="rounded bg-atlas-surface px-1">{emp.currentShift}</span>}
        {emp.assignedMachine && (
          <span className="inline-flex items-center gap-0.5 rounded bg-atlas-surface px-1">
            <Cog className="h-2.5 w-2.5" />
            {emp.assignedMachine}
          </span>
        )}
        {emp.productionLine && (
          <span className="inline-flex items-center gap-0.5 rounded bg-atlas-surface px-1">
            <Factory className="h-2.5 w-2.5" />
            {emp.productionLine}
          </span>
        )}
        {emp.roleLevel > 0 && <span>مستوى {emp.roleLevel}</span>}
        {emp.certifications.length > 0 && (
          <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/10 px-1 text-amber-700">
            <Award className="h-2.5 w-2.5" />
            {emp.certifications.length}
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-atlas-brand" />
    </div>
  );
});

export const DepartmentGroupNode = memo(function DepartmentGroupNode({
  data,
  id
}: NodeProps<Node<FlowNodeData>>) {
  const dept = data.department;
  if (!dept) return null;
  const visual = deptVisual(dept.code);
  const color = data.departmentColor ?? visual.color;
  const stats = dept.stats;
  const highlightId = data.highlightedEmployeeId;
  const staff = dept.directEmployees ?? [];

  return (
    <div
      className="rounded-sm border-2 bg-atlas-paper shadow-atlasCard"
      style={{ borderColor: color, width: 280 }}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <div
        className="flex items-center gap-2 border-b px-3 py-2"
        style={{ borderColor: `${color}40` }}
      >
        <Users className="h-4 w-4 shrink-0" style={{ color }} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-atlas-ink">{dept.name}</p>
          <p className="font-mono text-[10px] text-atlas-muted">{dept.code}</p>
        </div>
      </div>
      <div
        className={cn(
          "grid gap-1 border-b border-atlas-rule/60 px-3 py-2 text-[10px] text-atlas-muted",
          dept.isLeaf ? "grid-cols-3" : "grid-cols-2"
        )}
      >
        <span className="font-medium text-atlas-ink">
          الموظفون: <span className="font-mono text-atlas-brand">{stats.employeeCount}</span>
        </span>
        <span className="font-medium text-atlas-ink">
          الشواغر: <span className="font-mono text-atlas-brand">{stats.vacancyCount}</span>
        </span>
        {dept.isLeaf ? (
          <span>
            النشطون: <span className="font-mono">{stats.activeCount}</span>
          </span>
        ) : null}
      </div>
      {(dept.managerEmployee || staff.length > 0) && (
        <div className="space-y-1.5 p-2">
          {dept.managerEmployee ? (
            <OrgChartEmployeeEmbedRow
              employee={dept.managerEmployee}
              badge="مدير القسم"
              highlighted={highlightId === dept.managerEmployee.id}
            />
          ) : null}
          {staff.map((emp) => (
            <OrgChartEmployeeEmbedRow
              key={emp.id}
              employee={emp}
              highlighted={highlightId === emp.id}
            />
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} id={`${id}-out`} className="!bg-atlas-brand" />
    </div>
  );
});

export const VirtualRootNode = memo(function VirtualRootNode({ data }: NodeProps<Node<FlowNodeData>>) {
  return (
    <div className="w-[280px] rounded-sm border border-atlas-brand bg-atlas-brand/5 px-4 py-3 text-center shadow-atlasCard">
      <p className="text-sm font-bold text-atlas-brand">{data.label}</p>
      <Handle type="source" position={Position.Bottom} className="!bg-atlas-brand" />
    </div>
  );
});

export const FactoryRootNode = memo(function FactoryRootNode({ data }: NodeProps<Node<FlowNodeData>>) {
  return (
    <div className="w-[300px] rounded-sm border-2 border-atlas-brand bg-atlas-brand/10 px-4 py-3 text-center shadow-atlasCard">
      <Factory className="mx-auto mb-1 h-5 w-5 text-atlas-brand" />
      <p className="text-sm font-bold text-atlas-brand">{data.label}</p>
      {data.gmName ? <p className="mt-1 text-xs text-atlas-muted">المدير العام: {data.gmName}</p> : null}
      <Handle type="source" position={Position.Bottom} className="!bg-atlas-brand" />
    </div>
  );
});

export const OrgPositionGroupNode = memo(function OrgPositionGroupNode({
  data,
  id
}: NodeProps<Node<FlowNodeData>>) {
  const pos = data.position;
  const color = data.departmentColor ?? "#64748b";
  const highlightId = data.highlightedEmployeeId;
  if (!pos) return null;
  const employees = pos.employees ?? [];

  return (
    <div
      className="rounded-sm border bg-atlas-paper shadow-atlasCard"
      style={{ borderColor: `${color}99`, width: 220 }}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2" style={{ borderColor: `${color}40` }}>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <UserCog className="h-3.5 w-3.5 shrink-0" style={{ color }} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-atlas-ink">{pos.name}</p>
            <p className="font-mono text-[10px] text-atlas-muted">{pos.code}</p>
          </div>
        </div>
        <div className="shrink-0 text-end">
          <p className="text-[9px] text-atlas-muted">الأداء</p>
          <p className={cn("font-mono text-sm font-bold leading-none", performanceTone(pos.performanceScore))}>
            {formatPerformance(pos.performanceScore)}
          </p>
        </div>
      </div>
      {employees.length > 0 ? (
        <div className="space-y-1.5 border-t border-atlas-rule/60 p-2">
          {employees.map((emp) => (
            <OrgChartEmployeeEmbedRow
              key={emp.id}
              employee={emp}
              highlighted={highlightId === emp.id}
            />
          ))}
        </div>
      ) : (
        <p className="px-3 pb-2 text-[10px] text-atlas-muted">لا يوجد موظفون في هذا المنصب</p>
      )}
      <Handle type="source" position={Position.Bottom} id={`${id}-out`} className="!bg-atlas-brand" />
    </div>
  );
});
