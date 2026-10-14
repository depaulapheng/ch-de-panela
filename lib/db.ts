import { PrismaClient } from "@prisma/client";
import { boundedDatabaseUrl } from "./database-url";
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const url = boundedDatabaseUrl(process.env.DATABASE_URL);
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: url });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
