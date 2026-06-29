import { getLaravelApiBaseUrl } from "@/lib/api/resolve-api-base";
import { readStoredToken } from "@/lib/auth/factory-auth-api";

export class DirectTasksApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "DirectTasksApiError";
  }
}

function buildHeaders(init?: RequestInit): HeadersInit {
  const isForm = init?.body instanceof FormData;
  const token = readStoredToken();
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isForm ? { "Content-Type": "application/json" } : {}),
    ...(init?.headers ?? {})
  };
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getLaravelApiBaseUrl()}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: buildHeaders(init),
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
    throw new DirectTasksApiError(response.status, msg);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

export type DirectTaskChecklistItemInput = {
  label: string;
  itemType: string;
  isRequired: boolean;
  sortOrder: number;
};

export type DirectTaskAssignmentInput = {
  id?: number;
  type: "employee" | "department" | "team";
  assigneeId: number;
  label?: string;
  avatarUrl?: string | null;
};

export type DirectTaskOptions = {
  requireManagerApproval?: boolean;
  requireSupervisorApproval?: boolean;
  preventCloseBeforeChecklist?: boolean;
  requireCommentBeforeClose?: boolean;
  requireImage?: boolean;
  requireSignature?: boolean;
  autoReopenIfRejected?: boolean;
  autoReminder?: boolean;
  escalateOverdue?: boolean;
  allowChecklistReorder?: boolean;
};

export type DirectTaskScheduling = {
  startDate?: string;
  executionTime?: string;
  dueAt?: string;
  expectedDurationMinutes?: number;
  reminderMinutesBefore?: number;
  repeatEvery?: number;
  weekdays?: number[];
  monthDay?: number;
};

export type CreateDirectTaskPayload = {
  title: string;
  description: string;
  category: string;
  priority: string;
  taskType: string;
  scheduling?: DirectTaskScheduling;
  assignments?: DirectTaskAssignmentInput[];
  checklist?: DirectTaskChecklistItemInput[];
  options?: DirectTaskOptions;
  notes?: string;
  saveAsDraft?: boolean;
};

export type DirectTaskChecklistItemJson = {
  id?: number;
  label: string;
  itemType: string;
  isRequired: boolean;
  sortOrder: number;
  isCompleted?: boolean;
  responseValue?: string | null;
};

export type DirectTaskCommentJson = {
  id: number;
  body: string;
  commentType?: "comment" | "problem" | "help";
  userId: number;
  userName?: string | null;
  createdAt?: string | null;
};

export type DirectTaskJson = {
  id: number;
  taskNumber: string;
  title: string;
  description?: string | null;
  category: string;
  priority: string;
  taskType: string;
  status: string;
  startDate?: string | null;
  executionTime?: string | null;
  dueAt?: string | null;
  expectedDurationMinutes?: number | null;
  options?: DirectTaskOptions;
  notes?: string | null;
  progressPercent?: number;
  checklistCompleted?: number;
  checklistTotal?: number;
  checklist?: DirectTaskChecklistItemJson[];
  assignments?: DirectTaskAssignmentInput[];
  attachments?: { id: number; fileName: string; filePath: string; mimeType?: string; fileSize?: number }[];
  comments?: DirectTaskCommentJson[];
  createdByName?: string | null;
  rejectionReason?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  isOverdue?: boolean;
};

export type ChecklistTemplateJson = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  items: DirectTaskChecklistItemInput[];
};

export const directTasksApi = {
  list: (params?: Record<string, string | number | undefined>) =>
    requestJson<{ data: DirectTaskJson[]; meta: { page: number; pageSize: number; total: number } }>(
      `/direct-tasks${buildQuery(params ?? {})}`
    ),

  get: (id: number) => requestJson<DirectTaskJson>(`/direct-tasks/${id}`),

  create: (body: CreateDirectTaskPayload) =>
    requestJson<DirectTaskJson>("/direct-tasks", { method: "POST", body: JSON.stringify(body) }),

  createWithFiles: (body: CreateDirectTaskPayload, files: File[]) => {
    const form = new FormData();
    form.append("payload", JSON.stringify(body));
    files.forEach((f) => form.append("attachments[]", f));
    return requestJson<DirectTaskJson>("/direct-tasks", { method: "POST", body: form });
  },

  uploadAttachment: (taskId: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return requestJson<{ id: number; fileName: string }>(`/direct-tasks/${taskId}/attachments`, {
      method: "POST",
      body: form
    });
  },

  checklistTemplates: () =>
    requestJson<{ data: ChecklistTemplateJson[] }>("/direct-tasks/checklist-templates"),

  getDraft: () => requestJson<{ data: { payload: CreateDirectTaskPayload; updatedAt?: string } | null }>(
    "/direct-tasks/drafts/current"
  ),

  saveDraft: (payload: CreateDirectTaskPayload) =>
    requestJson<{ data: { payload: CreateDirectTaskPayload; updatedAt?: string } }>(
      "/direct-tasks/drafts/current",
      { method: "PATCH", body: JSON.stringify({ payload }) }
    ),

  deleteDraft: () => requestJson<{ ok: boolean }>("/direct-tasks/drafts/current", { method: "DELETE" }),

  start: (id: number) => requestJson<DirectTaskJson>(`/direct-tasks/${id}/start`, { method: "POST" }),

  pause: (id: number) => requestJson<DirectTaskJson>(`/direct-tasks/${id}/pause`, { method: "POST" }),

  complete: (id: number) => requestJson<DirectTaskJson>(`/direct-tasks/${id}/complete`, { method: "POST" }),

  submitForReview: (id: number) => requestJson<DirectTaskJson>(`/direct-tasks/${id}/submit-review`, { method: "POST" }),

  updateChecklistItem: (taskId: number, itemId: number, body: { isCompleted?: boolean; responseValue?: string }) =>
    requestJson<DirectTaskJson>(`/direct-tasks/${taskId}/checklist/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(body)
    }),

  addComment: (taskId: number, body: string, commentType: "comment" | "problem" | "help" = "comment") =>
    requestJson<DirectTaskCommentJson>(`/direct-tasks/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify({ body, commentType })
    })
};

function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    u.set(k, String(v));
  }
  const q = u.toString();
  return q ? `?${q}` : "";
}
