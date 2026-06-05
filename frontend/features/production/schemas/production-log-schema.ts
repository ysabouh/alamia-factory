import { z } from "zod";

export const productionLogSchema = z
  .object({
    fromTime: z.string().min(1, "وقت البداية مطلوب"),
    toTime: z.string().min(1, "وقت النهاية مطلوب"),
    goodQuantity: z.coerce.number().int().min(0, "كمية جيدة غير صالحة"),
    scrapQuantity: z.coerce.number().int().min(0).optional().or(z.literal("")),
    notes: z.string().optional().or(z.literal(""))
  })
  .refine((v) => new Date(v.toTime) > new Date(v.fromTime), {
    message: "وقت النهاية يجب أن يكون بعد البداية",
    path: ["toTime"]
  });

export type ProductionLogFormValues = z.infer<typeof productionLogSchema>;
