import { getLaravelApiBaseUrl } from "@/lib/api/resolve-api-base";
import { authFetchHeaders, readStoredToken } from "@/lib/auth/factory-auth-api";

export class WorkflowApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "WorkflowApiError";
  }
}

function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    u.set(k, String(v));
  }
  const q = u.toString();
  return q ? `?${q}` : "";
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getLaravelApiBaseUrl()}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authFetchHeaders(),
      ...init?.headers
    },
    cache: "no-store"
  });

  const text = await response.text();
  if (!response.ok) {
    let msg = `${response.status}`;
    try {
      const j = JSON.parse(text) as { message?: string; errors?: Record<string, string[]> };
      if (j.message) msg = j.message;
      else if (j.errors) {
        const first = Object.values(j.errors)[0];
        if (first?.[0]) msg = first[0];
      }
    } catch {
      if (text) msg = text.slice(0, 200);
    }
    throw new WorkflowApiError(response.status, msg);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

export type WorkflowTemplateJson = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  category: string;
  departmentId?: number | null;
  department?: { id: number; name: string; code?: string } | null;
  isActive: boolean;
  defaultPriority: string;
  publishedVersionId?: number | null;
  publishedVersion?: WorkflowVersionJson | null;
  versions?: WorkflowVersionJson[] | null;
};

export type WorkflowStageJson = {
  id: number;
  stageNumber: number;
  name: string;
  description?: string | null;
  assignmentType: string;
  assignmentConfig?: Record<string, unknown>;
  slaDurationMinutes?: number | null;
  estimatedDurationMinutes?: number | null;
  requiresApproval: boolean;
  allowRejection: boolean;
  allowReturn: boolean;
  checklistRequired: boolean;
  checklist: { id: number; label: string; isRequired: boolean }[];
  nodeId?: string | null;
  nextStageId?: number | null;
  positionX?: number | null;
  positionY?: number | null;
};

export type WorkflowVersionJson = {
  id: number;
  templateId: number;
  version: number;
  status: string;
  definitionJson?: { nodes: unknown[]; edges: unknown[] } | null;
  stages?: WorkflowStageJson[] | null;
  transitions?: {
    id: number;
    fromStageId?: number | null;
    toStageId: number;
    fromGatewayNodeId?: string | null;
    conditionType: string;
    label?: string | null;
  }[] | null;
};

export type WorkflowProgressJson = {
  progressPercent: number;
  completedCount: number;
  currentCount: number;
  remainingCount: number;
  totalStages: number;
  currentStageId?: number | null;
  stages: { id: number; name: string; state: string; stageNumber?: number; nodeId?: string | null }[];
};

export type WorkflowGraphJson = {
  definitionJson?: { nodes: unknown[]; edges: unknown[] } | null;
  stageStates: WorkflowProgressJson["stages"];
  transitions: {
    id: number;
    fromStageId?: number | null;
    toStageId: number;
    fromGatewayNodeId?: string | null;
    conditionType: string;
    label?: string | null;
  }[];
};

export type WorkflowInstanceJson = {
  id: number;
  workflowNumber: string;
  status: string;
  priority: string;
  progressPercent: number;
  templateName?: string | null;
  currentStageId?: number | null;
  currentStage?: WorkflowStageJson | null;
  subject?: { label: string; code?: string; type: string } | null;
  tasks?: WorkflowTaskJson[] | null;
  gatewayDecision?: {
    taskId: number;
    options: { condition: string; label: string; targetStageName: string }[];
  } | null;
  startedAt?: string | null;
  dueAt?: string | null;
  completedAt?: string | null;
  createdAt?: string | null;
};

export type WorkflowTaskJson = {
  id: number;
  taskNumber: string;
  instanceId: number;
  workflowNumber?: string | null;
  templateName?: string | null;
  stageId: number;
  stage?: WorkflowStageJson | null;
  assignedTo?: number | null;
  assignee?: { id: number; name: string } | null;
  status: string;
  priority: string;
  dueAt?: string | null;
  startedAt?: string | null;
  acceptedAt?: string | null;
  completedAt?: string | null;
  durationMinutes?: number | null;
  isOverdue: boolean;
  checklist: { id: number; checklistItemId: number; label?: string | null; isCompleted: boolean }[];
  comments?: { id: number; type: string; body: string; createdAt?: string; author?: { id: number; name: string } | null }[];
  attachments?: { id: number; fileName: string; filePath: string }[];
  instanceStatus?: string | null;
};

export type WorkflowDashboardJson = {
  totalWorkflows: number;
  activeWorkflows: number;
  completedWorkflows: number;
  delayedWorkflows: number;
  openTasks: number;
  closedTasks: number;
  slaCompliancePercent: number;
  averageCompletionMinutes: number;
  tasksByDepartment: { department: string; count: number }[];
  tasksByEmployee: { employee: string; count: number }[];
  bottlenecks: { stage: string; avgMinutes: number }[];
  monthlyTrends: { month: string; started: number; completed: number }[];
  delayAnalysis: { label: string; count: number }[];
};

export const workflowApi = {
  listTemplates: (params?: Record<string, string | number | boolean | undefined>) =>
    requestJson<{ data: WorkflowTemplateJson[]; meta: { page: number; pageSize: number; total: number } }>(
      `/workflow/templates${buildQuery(params ?? {})}`
    ),

  getTemplate: (id: number) => requestJson<WorkflowTemplateJson>(`/workflow/templates/${id}`),

  createTemplate: (body: Record<string, unknown>) =>
    requestJson<WorkflowTemplateJson>("/workflow/templates", { method: "POST", body: JSON.stringify(body) }),

  updateTemplate: (id: number, body: Record<string, unknown>) =>
    requestJson<WorkflowTemplateJson>(`/workflow/templates/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  cloneTemplate: (id: number, body: { code: string; name: string }) =>
    requestJson<WorkflowTemplateJson>(`/workflow/templates/${id}/clone`, {
      method: "POST",
      body: JSON.stringify(body)
    }),

  archiveTemplate: (id: number) =>
    requestJson<WorkflowTemplateJson>(`/workflow/templates/${id}/archive`, { method: "POST" }),

  createVersion: (templateId: number) =>
    requestJson<WorkflowVersionJson>(`/workflow/templates/${templateId}/versions`, { method: "POST" }),

  getVersion: (versionId: number) => requestJson<WorkflowVersionJson>(`/workflow/versions/${versionId}`),

  publishVersion: (versionId: number) =>
    requestJson<WorkflowVersionJson>(`/workflow/versions/${versionId}/publish`, { method: "POST" }),

  saveDesigner: (versionId: number, graph: { nodes: unknown[]; edges: unknown[] }) =>
    requestJson<WorkflowVersionJson>(`/workflow/versions/${versionId}/designer`, {
      method: "PUT",
      body: JSON.stringify(graph)
    }),

  listInstances: (params?: Record<string, string | number | undefined>) =>
    requestJson<{ data: WorkflowInstanceJson[]; meta: { page: number; pageSize: number; total: number } }>(
      `/workflow/instances${buildQuery(params ?? {})}`
    ),

  getInstance: (id: number) => requestJson<WorkflowInstanceJson>(`/workflow/instances/${id}`),

  startInstance: (body: {
    templateId: number;
    templateVersionId?: number;
    priority?: string;
    dueDate?: string | null;
    subjectType?: string;
    subjectId?: number;
  }) =>
    requestJson<WorkflowInstanceJson>("/workflow/instances", { method: "POST", body: JSON.stringify(body) }),

  getProgress: (id: number) => requestJson<WorkflowProgressJson>(`/workflow/instances/${id}/progress`),

  getGraph: (id: number) => requestJson<WorkflowGraphJson>(`/workflow/instances/${id}/graph`),

  getTimeline: (id: number) =>
    requestJson<{ data: { id: number; action: string; notes?: string; createdAt?: string; actor?: { name: string } }[] }>(
      `/workflow/instances/${id}/timeline`
    ),

  myTasks: (section?: string) =>
    requestJson<{ data: WorkflowTaskJson[] }>(`/workflow/tasks/my${buildQuery({ section })}`),

  getTask: (id: number) => requestJson<WorkflowTaskJson>(`/workflow/tasks/${id}`),

  acceptTask: (id: number) => requestJson<WorkflowTaskJson>(`/workflow/tasks/${id}/accept`, { method: "POST" }),

  rejectTask: (id: number, reason: string) =>
    requestJson<WorkflowTaskJson>(`/workflow/tasks/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason })
    }),

  completeTask: (id: number, body: { checklist?: { checklistItemId: number; isCompleted: boolean }[]; note?: string }) =>
    requestJson<WorkflowTaskJson>(`/workflow/tasks/${id}/complete`, { method: "POST", body: JSON.stringify(body) }),

  clarifyTask: (id: number, body: string) =>
    requestJson<WorkflowTaskJson>(`/workflow/tasks/${id}/clarify`, {
      method: "POST",
      body: JSON.stringify({ body })
    }),

  commentTask: (id: number, body: string) =>
    requestJson<{ id: number; body: string; createdAt?: string }>(`/workflow/tasks/${id}/comment`, {
      method: "POST",
      body: JSON.stringify({ body })
    }),

  approveTask: (id: number) =>
    requestJson<WorkflowTaskJson>(`/workflow/tasks/${id}/approve`, { method: "POST" }),

  chooseGatewayPath: (id: number, condition: "on_approve" | "on_reject") =>
    requestJson<WorkflowTaskJson>(`/workflow/tasks/${id}/gateway-path`, {
      method: "POST",
      body: JSON.stringify({ condition })
    }),

  returnInstance: (id: number, reason: string) =>
    requestJson<WorkflowInstanceJson>(`/workflow/instances/${id}/return`, {
      method: "POST",
      body: JSON.stringify({ reason })
    }),

  uploadAttachment: async (taskId: number, file: File) => {
    const url = `${getLaravelApiBaseUrl()}/workflow/tasks/${taskId}/attachments`;
    const form = new FormData();
    form.append("file", file);
    const token = readStoredToken();
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: form,
      cache: "no-store"
    });
    const text = await response.text();
    if (!response.ok) {
      let msg = `${response.status}`;
      try {
        const j = JSON.parse(text) as { message?: string; errors?: Record<string, string[]> };
        if (j.message) msg = j.message;
        else if (j.errors) {
          const first = Object.values(j.errors)[0];
          if (first?.[0]) msg = first[0];
        }
      } catch {
        if (text) msg = text.slice(0, 200);
      }
      throw new WorkflowApiError(response.status, msg);
    }
    return (text ? JSON.parse(text) : {}) as { id: number; fileName: string; filePath: string };
  },

  dashboard: () => requestJson<WorkflowDashboardJson>("/workflow/dashboard"),

  notifications: (unreadOnly?: boolean) =>
    requestJson<{ data: unknown[]; unreadCount: number }>(
      `/workflow/notifications${buildQuery({ unreadOnly: unreadOnly ? 1 : undefined })}`
    )
};
