import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
export async function audit(adminId: string | null, action: string, entity: string, entityId?: string | null, details?: Record<string, unknown>) {
  await prisma.auditLog.create({ data: { adminId, action, entity, entityId: entityId || null, details: details as Prisma.InputJsonValue | undefined } });
}
