import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query"],
    connectionTimeout: 20_000, // 20 seconds
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
