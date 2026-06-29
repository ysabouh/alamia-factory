import type { WorkflowStageNodeData } from "@/features/workflow/designer/workflow-designer-layout";
import type {
  AssignmentDepartmentLookup,
  AssignmentEmployeeLookup,
  AssignmentRoleLookup
} from "@/features/workflow/designer/workflow-assignment-lookup-context";

export type WorkflowAssignmentConfig = {
  employeeId?: number;
  employeeIds?: number[];
  departmentId?: number;
  jobRoleId?: number;
  spatieRole?: string;
};

export function parseAssignmentConfig(raw?: Record<string, unknown> | null): WorkflowAssignmentConfig {
  if (!raw) return {};
  const employeeIds = Array.isArray(raw.employeeIds)
    ? raw.employeeIds.map((id) => Number(id)).filter((id) => id > 0)
    : undefined;

  return {
    employeeId: raw.employeeId != null ? Number(raw.employeeId) : undefined,
    employeeIds: employeeIds?.length ? employeeIds : undefined,
    departmentId: raw.departmentId != null ? Number(raw.departmentId) : undefined,
    jobRoleId: raw.jobRoleId != null ? Number(raw.jobRoleId) : undefined,
    spatieRole: typeof raw.spatieRole === "string" ? raw.spatieRole : undefined
  };
}

export function assignmentConfigIsComplete(
  assignmentType: string,
  config: WorkflowAssignmentConfig
): boolean {
  switch (assignmentType) {
    case "single_employee":
      return (config.employeeId ?? 0) > 0;
    case "multiple_any":
    case "multiple_all":
    case "sequential":
      return (config.employeeIds?.length ?? 0) > 0;
    case "department":
      return (config.departmentId ?? 0) > 0;
    case "role":
      return (config.jobRoleId ?? 0) > 0 || Boolean(config.spatieRole?.trim());
    default:
      return false;
  }
}

export type AssignmentDisplayLabels = {
  employees?: Map<number, AssignmentEmployeeLookup | string>;
  departments?: Map<number, AssignmentDepartmentLookup | string>;
  roles?: Map<number, AssignmentRoleLookup | string>;
};

export type AssignmentDisplay = {
  typeLabel: string;
  assignees: string[];
  subtitle?: string | null;
  complete: boolean;
};

function employeeName(labels: AssignmentDisplayLabels | undefined, id: number): string {
  const row = labels?.employees?.get(id);
  if (!row) return `موظف #${id}`;
  if (typeof row === "string") {
    return looksLikeEmployeeCode(row) ? `موظف #${id}` : row;
  }
  const name = row.fullName?.trim();
  if (name && !looksLikeEmployeeCode(name)) return name;
  return `موظف #${id}`;
}

function looksLikeEmployeeCode(value: string): boolean {
  return /^EMP[-_]/i.test(value.trim()) || /^EMP\d/i.test(value.trim());
}

function departmentName(labels: AssignmentDisplayLabels | undefined, id: number): string {
  const row = labels?.departments?.get(id);
  if (!row) return `قسم #${id}`;
  return typeof row === "string" ? row : row.name;
}

function roleName(labels: AssignmentDisplayLabels | undefined, id: number): string {
  const row = labels?.roles?.get(id);
  if (!row) return `دور #${id}`;
  return typeof row === "string" ? row : row.name;
}

export function resolveAssignmentDisplay(
  assignmentType: string,
  config: WorkflowAssignmentConfig,
  typeLabels: Record<string, string>,
  labels?: AssignmentDisplayLabels,
  cached?: { assigneeNames?: string[]; assigneeSubtitle?: string | null }
): AssignmentDisplay {
  const typeLabel = typeLabels[assignmentType] ?? assignmentType;

  if (cached?.assigneeNames && cached.assigneeNames.length > 0) {
    return {
      typeLabel,
      assignees: cached.assigneeNames,
      subtitle: cached.assigneeSubtitle ?? null,
      complete: true
    };
  }

  const complete = assignmentConfigIsComplete(assignmentType, config);

  switch (assignmentType) {
    case "single_employee": {
      if (!config.employeeId) {
        return { typeLabel, assignees: [], complete: false };
      }
      return {
        typeLabel,
        assignees: [employeeName(labels, config.employeeId)],
        complete: true
      };
    }
    case "multiple_any":
    case "multiple_all":
    case "sequential": {
      const ids = config.employeeIds ?? [];
      return {
        typeLabel,
        assignees: ids.map((id) => employeeName(labels, id)),
        complete: ids.length > 0
      };
    }
    case "department": {
      if (!config.departmentId) {
        return { typeLabel, assignees: [], complete: false };
      }
      const dept = labels?.departments?.get(config.departmentId);
      const managerName =
        dept && typeof dept !== "string" ? dept.managerName?.trim() : null;
      return {
        typeLabel,
        assignees: [departmentName(labels, config.departmentId)],
        subtitle: managerName ? `المدير: ${managerName}` : "يُعيَّن مدير القسم",
        complete: true
      };
    }
    case "role": {
      if (config.jobRoleId) {
        return {
          typeLabel,
          assignees: [roleName(labels, config.jobRoleId)],
          complete: true
        };
      }
      if (config.spatieRole?.trim()) {
        return { typeLabel, assignees: [config.spatieRole.trim()], complete: true };
      }
      return { typeLabel, assignees: [], complete: false };
    }
    default:
      return { typeLabel, assignees: [], complete: false };
  }
}

export function assignmentSummary(
  assignmentType: string,
  config: WorkflowAssignmentConfig,
  labels?: AssignmentDisplayLabels
): string | null {
  const display = resolveAssignmentDisplay(assignmentType, config, {}, labels);
  if (display.assignees.length === 0) return null;
  if (display.assignees.length === 1) return display.assignees[0] ?? null;
  return display.assignees.join("، ");
}

export function toAssignmentConfigPayload(config: WorkflowAssignmentConfig): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (config.employeeId) out.employeeId = config.employeeId;
  if (config.employeeIds?.length) out.employeeIds = config.employeeIds;
  if (config.departmentId) out.departmentId = config.departmentId;
  if (config.jobRoleId) out.jobRoleId = config.jobRoleId;
  if (config.spatieRole?.trim()) out.spatieRole = config.spatieRole.trim();
  return out;
}

export function stageHasAssignment(data: WorkflowStageNodeData): boolean {
  return assignmentConfigIsComplete(data.assignmentType, parseAssignmentConfig(data.assignmentConfig));
}
