import { z } from "zod";

export const directTaskTypes = ["direct", "immediate", "emergency", "daily", "weekly", "monthly"] as const;
export const directTaskCategories = [
  "electrical_maintenance",
  "mechanical_maintenance",
  "production",
  "quality",
  "safety",
  "warehouse",
  "hr",
  "administration",
  "custom"
] as const;
export const directTaskPriorities = ["low", "normal", "high", "urgent"] as const;
export const checklistItemTypes = [
  "checkbox",
  "text",
  "number",
  "image",
  "file",
  "comment",
  "date",
  "signature"
] as const;

const checklistItemSchema = z.object({
  id: z.string(),
  label: z.string().min(1, "اسم البند مطلوب"),
  itemType: z.enum(checklistItemTypes),
  isRequired: z.boolean(),
  sortOrder: z.number()
});

const assignmentSchema = z.object({
  type: z.enum(["employee", "department", "team"]),
  assigneeId: z.number(),
  label: z.string().optional()
});

const schedulingSchema = z.object({
  startDate: z.string().optional(),
  executionTime: z.string().optional(),
  dueAt: z.string().optional(),
  expectedDurationMinutes: z.number().optional(),
  reminderMinutesBefore: z.number().optional(),
  repeatEvery: z.number().min(1).optional(),
  weekdays: z.array(z.number().min(0).max(6)).optional(),
  monthDay: z.number().min(1).max(28).optional()
});

const optionsSchema = z.object({
  requireManagerApproval: z.boolean().optional(),
  requireSupervisorApproval: z.boolean().optional(),
  preventCloseBeforeChecklist: z.boolean().optional(),
  requireCommentBeforeClose: z.boolean().optional(),
  requireImage: z.boolean().optional(),
  requireSignature: z.boolean().optional(),
  autoReopenIfRejected: z.boolean().optional(),
  autoReminder: z.boolean().optional(),
  escalateOverdue: z.boolean().optional(),
  allowChecklistReorder: z.boolean().optional()
});

export const createDirectTaskSchema = z
  .object({
    title: z.string().min(3, "العنوان مطلوب (3 أحرف على الأقل)").max(255),
    description: z.string().min(10, "الوصف مطلوب").max(5000),
    category: z.enum(directTaskCategories),
    priority: z.enum(directTaskPriorities),
    taskType: z.enum(directTaskTypes),
    scheduling: schedulingSchema,
    assignments: z.array(assignmentSchema),
    checklist: z.array(checklistItemSchema),
    options: optionsSchema,
    notes: z.string().max(2000).optional(),
    assignmentMode: z.enum(["employee", "team", "department"])
  })
  .superRefine((val, ctx) => {
    if (["daily", "weekly", "monthly"].includes(val.taskType) && !val.scheduling.startDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "تاريخ البدء مطلوب", path: ["scheduling", "startDate"] });
    }
    if (val.taskType === "weekly" && (!val.scheduling.weekdays || val.scheduling.weekdays.length === 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "اختر يوماً واحداً على الأقل", path: ["scheduling", "weekdays"] });
    }
  });

export type CreateDirectTaskFormValues = z.infer<typeof createDirectTaskSchema>;

export const defaultCreateDirectTaskValues: CreateDirectTaskFormValues = {
  title: "",
  description: "",
  category: "electrical_maintenance",
  priority: "normal",
  taskType: "direct",
  scheduling: {
    startDate: new Date().toISOString().slice(0, 10),
    executionTime: "08:00",
    repeatEvery: 1,
    weekdays: [0, 1, 2, 3, 4],
    monthDay: 1,
    expectedDurationMinutes: 60,
    reminderMinutesBefore: 1440
  },
  assignments: [],
  checklist: [],
  options: {
    preventCloseBeforeChecklist: false,
    allowChecklistReorder: true,
    autoReminder: true,
    escalateOverdue: true
  },
  notes: "",
  assignmentMode: "employee"
};

export function fromDraftPayload(payload: Record<string, unknown>): CreateDirectTaskFormValues {
  const taskType = directTaskTypes.includes(payload.taskType as (typeof directTaskTypes)[number])
    ? (payload.taskType as CreateDirectTaskFormValues["taskType"])
    : defaultCreateDirectTaskValues.taskType;
  const category = directTaskCategories.includes(payload.category as (typeof directTaskCategories)[number])
    ? (payload.category as CreateDirectTaskFormValues["category"])
    : defaultCreateDirectTaskValues.category;
  const priority = directTaskPriorities.includes(payload.priority as (typeof directTaskPriorities)[number])
    ? (payload.priority as CreateDirectTaskFormValues["priority"])
    : defaultCreateDirectTaskValues.priority;

  const rawChecklist = Array.isArray(payload.checklist) ? payload.checklist : [];
  const checklist = rawChecklist.map((item, i) => {
    const row = item as Record<string, unknown>;
    const itemType = checklistItemTypes.includes(row.itemType as (typeof checklistItemTypes)[number])
      ? (row.itemType as CreateDirectTaskFormValues["checklist"][number]["itemType"])
      : "checkbox";
    return {
      id: typeof row.id === "string" ? row.id : `draft-${i}`,
      label: String(row.label ?? ""),
      itemType,
      isRequired: Boolean(row.isRequired),
      sortOrder: Number(row.sortOrder ?? i)
    };
  });

  const rawAssignments = Array.isArray(payload.assignments) ? payload.assignments : [];
  const assignments = rawAssignments.map((item) => {
    const row = item as Record<string, unknown>;
    const type = ["employee", "department", "team"].includes(String(row.type))
      ? (row.type as CreateDirectTaskFormValues["assignments"][number]["type"])
      : "employee";
    return {
      type,
      assigneeId: Number(row.assigneeId ?? 0),
      label: typeof row.label === "string" ? row.label : undefined
    };
  });

  const mode = payload.assignmentMode;
  const assignmentMode = mode === "team" || mode === "department" ? mode : "employee";

  return {
    ...defaultCreateDirectTaskValues,
    title: String(payload.title ?? ""),
    description: String(payload.description ?? ""),
    category,
    priority,
    taskType,
    scheduling: { ...defaultCreateDirectTaskValues.scheduling, ...(payload.scheduling as object) },
    assignments,
    checklist,
    options: { ...defaultCreateDirectTaskValues.options, ...(payload.options as object) },
    notes: typeof payload.notes === "string" ? payload.notes : "",
    assignmentMode
  };
}

export function toCreatePayload(values: CreateDirectTaskFormValues, saveAsDraft = false) {
  return {
    title: values.title,
    description: values.description,
    category: values.category,
    priority: values.priority,
    taskType: values.taskType,
    scheduling: values.scheduling,
    assignments: values.assignments.map((a) => ({
      type: a.type,
      assigneeId: a.assigneeId,
      label: a.label
    })),
    checklist: values.checklist.map((c, i) => ({
      label: c.label,
      itemType: c.itemType,
      isRequired: c.isRequired,
      sortOrder: c.sortOrder ?? i
    })),
    options: values.options,
    notes: values.notes,
    assignmentMode: values.assignmentMode,
    saveAsDraft
  };
}
