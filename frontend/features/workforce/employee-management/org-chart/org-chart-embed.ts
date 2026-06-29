import type { OrgChartDepartmentNode, OrgChartEmployeeNode, OrgChartPositionNode } from "./org-chart-types";

export const ORG_CHART_EMBED_ROW_HEIGHT = 52;
export const ORG_CHART_DEPT_BASE_HEIGHT = 88;
export const ORG_CHART_POS_BASE_HEIGHT = 48;

export function departmentStaffInBox(dept: OrgChartDepartmentNode): OrgChartEmployeeNode[] {
  return dept.directEmployees ?? [];
}

export function positionEmployees(pos: OrgChartPositionNode): OrgChartEmployeeNode[] {
  return pos.employees ?? [];
}

export function estimateDepartmentHeight(dept: OrgChartDepartmentNode): number {
  let rows = 0;
  if (dept.managerEmployee) rows += 1;
  rows += departmentStaffInBox(dept).length;
  if (rows === 0) return ORG_CHART_DEPT_BASE_HEIGHT;
  return ORG_CHART_DEPT_BASE_HEIGHT + rows * ORG_CHART_EMBED_ROW_HEIGHT + 8;
}

export function estimatePositionHeight(pos: OrgChartPositionNode): number {
  const rows = positionEmployees(pos).length;
  if (rows === 0) return ORG_CHART_POS_BASE_HEIGHT;
  return ORG_CHART_POS_BASE_HEIGHT + rows * ORG_CHART_EMBED_ROW_HEIGHT + 8;
}

export function findEmployeeHostNodeId(
  emp: OrgChartEmployeeNode,
  departments: OrgChartDepartmentNode[]
): string | null {
  const walk = (depts: OrgChartDepartmentNode[]): string | null => {
    for (const dept of depts) {
      if (dept.managerEmployee?.id === emp.id) {
        return `dept-${dept.departmentId}`;
      }
      for (const pos of dept.positions ?? []) {
        if (pos.employees.some((e) => e.id === emp.id)) {
          return `pos-${pos.positionId}`;
        }
      }
      if ((dept.directEmployees ?? []).some((e) => e.id === emp.id)) {
        return `dept-${dept.departmentId}`;
      }
      const childHit = walk(dept.children ?? []);
      if (childHit) return childHit;
    }
    return null;
  };
  return walk(departments);
}

export function employeeEmbedOffsetY(
  emp: OrgChartEmployeeNode,
  hostId: string,
  departments: OrgChartDepartmentNode[]
): number {
  const walk = (depts: OrgChartDepartmentNode[]): number | null => {
    for (const dept of depts) {
      const deptId = `dept-${dept.departmentId}`;
      if (deptId === hostId) {
        let y = ORG_CHART_DEPT_BASE_HEIGHT;
        if (dept.managerEmployee) {
          if (dept.managerEmployee.id === emp.id) return y;
          y += ORG_CHART_EMBED_ROW_HEIGHT;
        }
        for (const staff of departmentStaffInBox(dept)) {
          if (staff.id === emp.id) return y;
          y += ORG_CHART_EMBED_ROW_HEIGHT;
        }
        return y;
      }
      for (const pos of dept.positions ?? []) {
        const posId = `pos-${pos.positionId}`;
        if (posId === hostId) {
          let y = ORG_CHART_POS_BASE_HEIGHT;
          for (const row of positionEmployees(pos)) {
            if (row.id === emp.id) return y;
            y += ORG_CHART_EMBED_ROW_HEIGHT;
          }
          return y;
        }
      }
      const childHit = walk(dept.children ?? []);
      if (childHit !== null) return childHit;
    }
    return null;
  };
  return walk(departments) ?? ORG_CHART_DEPT_BASE_HEIGHT;
}

export function collectEmbeddedEmployees(dept: OrgChartDepartmentNode): OrgChartEmployeeNode[] {
  const out: OrgChartEmployeeNode[] = [];
  if (dept.managerEmployee) out.push(dept.managerEmployee);
  out.push(...departmentStaffInBox(dept));
  for (const pos of dept.positions ?? []) {
    out.push(...positionEmployees(pos));
  }
  for (const child of dept.children ?? []) {
    out.push(...collectEmbeddedEmployees(child));
  }
  return out;
}
