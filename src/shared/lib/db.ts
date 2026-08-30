import { PrismaClient } from "@prisma/client";

// Singleton PrismaClient untuk Next.js App Router
// Mencegah multiple instance saat hot-reload di development (HMR / Fast Refresh)
// Pattern resmi dari docs Prisma: https://pris.ly/d/help-next-js-best-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Aktifkan log saat debug:
    // log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

// Simpan instance di globalThis hanya saat non-production agar tidak bocor di prod
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Alias `db` supaya konsisten jika import sebagai `import { db } from "@/shared/lib/db"`
export const db = prisma;

export default prisma;
