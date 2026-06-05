import { z } from "zod";

export const checklistItemSchema = z.object({
  itemName: z.string().min(1, "اسم العنصر مطلوب"),
  itemType: z.enum(["numeric", "boolean", "text", "selection"]).default("numeric"),
  minValue: z.coerce.number().optional().or(z.literal("")),
  maxValue: z.coerce.number().optional().or(z.literal("")),
  unit: z.string().optional().or(z.literal("")),
  selectionOptions: z.string().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(1).optional().or(z.literal("")),
  isRequired: z.boolean().optional(),
  isCritical: z.boolean().optional()
});

export const qualityChecklistSchema = z.object({
  name: z.string().min(1, "اسم القالب مطلوب"),
  description: z.string().optional().or(z.literal("")),
  isActive: z.boolean().optional()
});

export type QualityChecklistFormValues = z.infer<typeof qualityChecklistSchema>;
export type ChecklistItemFormValues = z.infer<typeof checklistItemSchema>;
