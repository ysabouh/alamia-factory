import { z } from "zod";

export const productionDowntimeSchema = z
  .object({
    downtimeReasonId: z.string().min(1, "سبب التوقف مطلوب"),
    startTime: z.string().min(1, "وقت البداية مطلوب"),
    endTime: z.string().optional(),
    notes: z.string().optional()
  })
  .refine((v) => !v.endTime || new Date(v.endTime) > new Date(v.startTime), {
    message: "وقت النهاية يجب أن يكون بعد وقت البداية",
    path: ["endTime"]
  });
