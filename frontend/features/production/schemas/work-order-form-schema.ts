import { z } from "zod";

export const workOrderFormSchema = z.object({
  productId: z.string().min(1, "اختر المنتج"),
  productionDate: z.string().optional().or(z.literal("")),
  machineId: z.string().optional().or(z.literal("")),
  moldId: z.string().optional().or(z.literal("")),
  shiftId: z.string().optional().or(z.literal("")),
  supervisorId: z.string().optional().or(z.literal("")),
  productionManagerId: z.string().optional().or(z.literal("")),
  plannedQuantity: z.coerce.number().int().min(1, "الكمية المخططة مطلوبة"),
  priority: z.string().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  productOperationId: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal(""))
});

export type WorkOrderFormValues = z.infer<typeof workOrderFormSchema>;
