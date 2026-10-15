import { z } from "zod";

const positiveInt = z.coerce.number().int().positive();
export const inventoryQuerySchema = z.object({ search: z.string().optional(), page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().min(1).max(200).default(50), kind: z.enum(["RECEIPT", "ISSUE", "ADJUSTMENT", "EXPIRED", "RETURN"]).optional() });
export const receiveSchema = z.object({ medicine_id: positiveInt, batch_code: z.string().trim().min(1).max(100), quantity: positiveInt, expires_at: z.coerce.date().optional().nullable(), unit_cost: z.coerce.number().min(0).default(0), supplier: z.string().trim().max(255).optional().nullable(), note: z.string().max(2000).optional() });
export const issueSchema = z.object({ medicine_id: positiveInt, quantity: positiveInt, strategy: z.enum(["FIFO", "FEFO"]).optional(), reference_type: z.string().trim().max(40).optional(), reference_id: positiveInt.optional(), note: z.string().max(2000).optional() });
export const adjustSchema = z.object({ batch_id: positiveInt, quantity: z.coerce.number().int(), note: z.string().trim().min(1).max(2000) });
