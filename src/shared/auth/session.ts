import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/shared/auth";
import type { Role } from "@prisma/client";

// — Helpers untuk Server Component / API Route / Server Action —

export type CurrentUser = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  image?: string | null;
};

/**
 * Ambil user dari JWT session tanpa query DB tiap request.
 * Di-cache per-request via React.cache() — aman dipakai berkali-kali di RSC.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  if (!session?.user) return null;

  // session.user sudah mengandung id & role dari jwt callback (auth.config.ts:8)
  const { id, name, email, role, image } = session.user as CurrentUser & {
    email: string;
  };
  if (!id || !email || !role) return null;

  return {
    id,
    name: name ?? null,
    email,
    role: role as Role,
    image: image ?? null,
  };
});

/**
 * Wajib login — kalau belum login redirect ke /login?callbackUrl=...
 */
export async function requireUser(callbackUrl?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    const url = callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login";
    redirect(url);
  }
  return user;
}

/**
 * Wajib role tertentu — cek JWT role tanpa query DB.
 * Contoh: await requireRole("ADMIN")
 *         await requireRole(["ADMIN", "CUSTOMER"])
 */
export async function requireRole(
  allowed: Role | Role[],
  options?: { callbackUrl?: string; redirectTo?: string }
): Promise<CurrentUser> {
  const user = await requireUser(options?.callbackUrl);
  const roles = Array.isArray(allowed) ? allowed : [allowed];

  if (!roles.includes(user.role)) {
    // Redirect ke halaman yang sesuai role atau ke /api/auth/signout?
    // Default: lempar ke /unauthorized atau ke dashboard sesuai role.
    if (options?.redirectTo) redirect(options.redirectTo);

    // ADMIN bisa akses semua, CUSTOMER coba akses /admin -> lempar ke /customer
    if (user.role === "CUSTOMER") redirect("/customer");
    if (user.role === "ADMIN") redirect("/admin");

    redirect("/login");
  }

  return user;
}

/** Alias khusus untuk admin */
export async function requireAdmin(): Promise<CurrentUser> {
  return requireRole("ADMIN");
}

/** Alias untuk customer atau admin (dipakai di /customer) */
export async function requireCustomer(): Promise<CurrentUser> {
  return requireRole(["ADMIN", "CUSTOMER"]);
}

/**
 * Helper untuk filter data milik user sendiri tanpa expose semua data.
 * Contoh di server component customer:
 *   const user = await requireCustomer();
 *   const listings = await prisma.listing.findMany({
 *     where: user.role === "ADMIN" ? {} : { ownerId: user.id }
 *   });
 */
export function buildOwnerFilter(user: CurrentUser) {
  if (user.role === "ADMIN") return {} as const;
  return { ownerId: user.id } as const;
}
