export type OrgChartCertification = {

  id: string;

  name: string;

  issuer?: string | null;

  issuedAt?: string | null;

  expiresAt?: string | null;

};



export type OrgChartEmployeeNode = {

  type: "employee";

  id: string;

  employeeNumber: string;

  fullName: string;

  profileImage?: string | null;

  position?: string | null;

  positionCode?: string | null;

  orgPositionId?: string | null;

  orgPositionName?: string | null;

  orgPositionCode?: string | null;

  roleLevel: number;

  departmentId?: string | null;

  departmentName?: string | null;

  departmentCode?: string | null;

  reportsToId?: string | null;

  managerName?: string | null;

  isActive: boolean;

  employmentStatus?: { code: string; name: string } | null;

  currentShift?: string | null;

  assignedMachine?: string | null;

  productionLine?: string | null;

  activeWorkOrderNo?: string | null;

  performanceScore?: number | null;

  certifications: OrgChartCertification[];

  children?: OrgChartEmployeeNode[];

};



export type OrgChartDepartmentStats = {

  employeeCount: number;

  supervisorCount: number;

  vacancyCount: number;

  activeCount: number;

};



export type OrgChartPositionNode = {

  type: "org_position";

  id: string;

  positionId: string;

  name: string;

  code: string;

  vacancyCount: number;

  performanceScore?: number | null;

  employees: OrgChartEmployeeNode[];

};



export type OrgChartDepartmentNode = {

  type: "department";

  id: string;

  departmentId: string;

  parentId?: string | null;

  name: string;

  code: string;

  managerId?: string | null;

  managerEmployee?: OrgChartEmployeeNode | null;

  isLeaf?: boolean;

  stats: OrgChartDepartmentStats;

  children: OrgChartDepartmentNode[];

  positions?: OrgChartPositionNode[];

  directEmployees?: OrgChartEmployeeNode[];

};



export type OrgChartFactoryRoot = {

  type: "factory_root";

  id: string;

  title: string;

  generalManagerEmployee?: OrgChartEmployeeNode | null;

};



export type OrgChartReportingEdge = {

  from: string;

  to: string;

};



export type OrgChartData = {

  factoryRoot: OrgChartFactoryRoot;

  departmentTree: OrgChartDepartmentNode[];

  employees: OrgChartEmployeeNode[];

  reportingEdges: OrgChartReportingEdge[];

  /** @deprecated use departmentTree */

  departments?: OrgChartDepartmentNode[];

  virtualRoot?: boolean;

  root?: OrgChartEmployeeNode | { type: "virtual_root"; id: string; name: string; children: OrgChartEmployeeNode[] };

};



export type EmployeeCertificationJson = {

  id: string;

  employeeId: string;

  name: string;

  issuer?: string | null;

  issuedAt?: string | null;

  expiresAt?: string | null;

  certificateNumber?: string | null;

  notes?: string | null;

};



export type DepartmentOrgPositionJson = {

  id: string;

  departmentId: string;

  name: string;

  code: string;

  description?: string | null;

  sortOrder: number;

  plannedHeadcount: number;

  vacancyCount: number;

  isActive: boolean;

};



export type DepartmentTreeNode = {
  id: string;
  name: string;
  code: string;
  parentId?: string | null;
  parentName?: string | null;
  isLeaf?: boolean;
  hallId?: string | null;
  managerId?: string | null;
  managerName?: string | null;
  vacancyCount?: number;
  description?: string | null;
  isActive?: boolean;
  children?: DepartmentTreeNode[];
};



export type FactoryOrgSettings = {

  title: string;

  generalManagerEmployeeId: string | null;

};


