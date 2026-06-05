import { z } from "zod";

export const inspectionResultSchema = z.object({
  checklistItemId: z.string().min(1),
  measuredValue: z.union([z.string(), z.number(), z.boolean()]).optional().nullable(),
  resultStatus: z.enum(["pass", "fail", "warning"]).optional(),
  notes: z.string().optional().or(z.literal(""))
});

export const qualityInspectionSchema = z.object({
  sampleSize: z.coerce.number().int().min(0).optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  correctiveAction: z.string().optional().or(z.literal("")),
  isFinal: z.boolean().optional(),
  results: z.array(inspectionResultSchema).optional()
});

export type QualityInspectionFormValues = z.infer<typeof qualityInspectionSchema>;
