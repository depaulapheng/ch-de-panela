import { z } from "zod";
export const reservationSchema = z.object({
  giftId: z.string().min(1), name: z.string().trim().min(2).max(120), phone: z.string().trim().min(8).max(30), message: z.string().trim().max(600).optional().default(""), confirm: z.literal(true)
});
export const rsvpSchema = z.object({
  name: z.string().trim().min(2).max(120), phone: z.string().trim().max(30).optional().default(""), attending: z.boolean(), companions: z.coerce.number().int().min(0).max(10).default(0), companionNames: z.string().trim().max(500).optional().default(""), dietaryRestriction: z.string().trim().max(500).optional().default(""), message: z.string().trim().max(800).optional().default("")
});
export const messageSchema = z.object({ name: z.string().trim().min(2).max(120), message: z.string().trim().min(3).max(1000) });
export const giftSchema = z.object({
  name: z.string().trim().min(2).max(160), description: z.string().trim().max(1000).nullable().optional(), categoryId: z.string().min(1), imageUrl: z.union([z.string().url(), z.literal("")]).nullable().optional(), approximateValue: z.union([z.coerce.number().min(0), z.literal(""), z.null()]).optional(), priority: z.enum(["HIGH","NORMAL","OPTIONAL"]).default("NORMAL"), desiredQuantity: z.coerce.number().int().min(1).max(100).default(1), brand: z.string().trim().max(120).nullable().optional(), model: z.string().trim().max(120).nullable().optional(), note: z.string().trim().max(1000).nullable().optional(), purchaseUrl: z.union([z.string().url(), z.literal("")]).nullable().optional(), active: z.boolean().default(true), spotlight: z.boolean().default(false), acceptsInstallments: z.boolean().default(false), installmentCount: z.union([z.coerce.number().int().min(1).max(100), z.literal(""), z.null()]).optional(), installmentValue: z.union([z.coerce.number().min(0), z.literal(""), z.null()]).optional(), sortOrder: z.coerce.number().int().default(0), colorIds: z.array(z.string()).default([])
});
