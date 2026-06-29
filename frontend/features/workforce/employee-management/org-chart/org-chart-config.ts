import type { OrgChartDepartmentNode, OrgChartEmployeeNode } from "./org-chart-types";



export const DEPT_VISUAL: Record<string, { color: string; icon: string }> = {

  PROD: { color: "#16a34a", icon: "production" },

  QUAL: { color: "#7c3aed", icon: "quality" },

  MAINT: { color: "#2563eb", icon: "maintenance" },

  WH: { color: "#ea580c", icon: "warehouse" },

  FIN: { color: "#0d9488", icon: "finance" },

  HR: { color: "#ca8a04", icon: "hr" },

  SALES: { color: "#dc2626", icon: "sales" },

  PUR: { color: "#1e3a8a", icon: "purchasing" }

};



export function deptVisual(code: string | null | undefined, colorOverrides?: Record<string, string>) {

  const key = (code ?? "").toUpperCase();

  const base = DEPT_VISUAL[key] ?? { color: "#64748b", icon: "default" };

  const override = colorOverrides?.[key];

  return override ? { ...base, color: override } : base;

}



export function flattenEmployeeTree(nodes: OrgChartEmployeeNode[]): OrgChartEmployeeNode[] {

  const out: OrgChartEmployeeNode[] = [];

  const walk = (list: OrgChartEmployeeNode[]) => {

    for (const n of list) {

      out.push(n);

      if (n.children?.length) walk(n.children);

    }

  };

  walk(nodes);

  return out;

}



export function collectDeptEmployees(dept: OrgChartDepartmentNode): OrgChartEmployeeNode[] {

  const out: OrgChartEmployeeNode[] = [];

  if (dept.managerEmployee) out.push(dept.managerEmployee);

  for (const pos of dept.positions ?? []) {

    out.push(...pos.employees);

  }

  out.push(...(dept.directEmployees ?? []));

  if (dept.children?.length) {

    for (const child of dept.children) {

      if (child.type === "department") {

        out.push(...collectDeptEmployees(child));

      }

    }

  }

  return out;

}



export function matchesSearch(emp: OrgChartEmployeeNode, q: string): boolean {

  const s = q.trim().toLowerCase();

  if (!s) return false;

  return (

    emp.fullName.toLowerCase().includes(s) ||

    emp.employeeNumber.toLowerCase().includes(s) ||

    (emp.position ?? "").toLowerCase().includes(s) ||

    (emp.orgPositionName ?? "").toLowerCase().includes(s) ||

    (emp.departmentName ?? "").toLowerCase().includes(s)

  );

}


