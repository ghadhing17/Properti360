"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { requireRole } from "@/shared/auth/session";
import { prisma } from "@/shared/lib/db";
import { createStaffSchema } from "@/shared/lib/validations/settings";
import type { Role } from "@prisma/client";

export type UserActionResult = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  data?: Record<string, unknown>;
};

const ROLE_VALUES: Role[] = ["ADMIN", "CUSTOMER"];

function assertValidRole(role: string): Role | null {
  return ROLE_VALUES.includes(role as Role) ? (role as Role) : null;
}

function invalidateUsersPages() {
  revalidatePath("/admin/settings");
}

// ── Buat akun staf/admin/customer baru ───────────────────────────────────────
export async function createStaffUser(
  _prev: UserActionResult,
  formData: FormData
): Promise<UserActionResult> {
  await requireRole("ADMIN");

  const role = assertValidRole(String(formData.get("role") ?? "CUSTOMER").trim());
  if (!role) return { error: "Role tidak valid." };

  const parsed = createStaffSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    phone: String(formData.get("phone") ?? "").trim(),
    role,
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, email, password, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return {
      error: "Email sudah terdaftar.",
      fieldErrors: { email: ["Email sudah terdaftar."] },
    };
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { name, email, password: hashed, phone: phone || null, role },
    });
  } catch (e) {
    console.error("[createStaffUser]", e);
    return { error: "Gagal membuat akun. Coba lagi." };
  }

  invalidateUsersPages();
  return { success: true };
}

// ── Ubah role pengguna ───────────────────────────────────────────────────────
export async function updateUserRole(id: string, role: string): Promise<UserActionResult> {
  const current = await requireRole("ADMIN");
  if (!id) return { error: "ID pengguna wajib" };
  if (id === current.id) {
    return { error: "Tidak bisa mengubah role akun sendiri demi keamanan." };
  }

  const validRole = assertValidRole(role);
  if (!validRole) return { error: "Role tidak valid." };

  try {
    await prisma.user.update({ where: { id }, data: { role: validRole } });
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "P2025") return { error: "Pengguna tidak ditemukan." };
    console.error("[updateUserRole]", e);
    return { error: "Gagal mengubah role. Coba lagi." };
  }

  invalidateUsersPages();
  return { success: true };
}

// ── Aktif/nonaktifkan akun ───────────────────────────────────────────────────
export async function toggleUserActive(id: string, isActive: boolean): Promise<UserActionResult> {
  const current = await requireRole("ADMIN");
  if (!id) return { error: "ID pengguna wajib" };
  if (id === current.id) {
    return { error: "Tidak bisa menonaktifkan akun sendiri." };
  }

  try {
    await prisma.user.update({ where: { id }, data: { isActive } });
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "P2025") return { error: "Pengguna tidak ditemukan." };
    console.error("[toggleUserActive]", e);
    return { error: "Gagal mengubah status akun. Coba lagi." };
  }

  invalidateUsersPages();
  return { success: true };
}

// ── Hapus akun ───────────────────────────────────────────────────────────────
export async function deleteUser(id: string): Promise<UserActionResult> {
  const current = await requireRole("ADMIN");
  if (!id) return { error: "ID pengguna wajib" };
  if (id === current.id) {
    return { error: "Tidak bisa menghapus akun sendiri." };
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { _count: { select: { listings: true } } },
  });
  if (!user) return { error: "Pengguna tidak ditemukan." };
  if (user._count.listings > 0) {
    return {
      error: `Pengguna masih memiliki ${user._count.listings} listing. Pindahkan atau hapus listingnya terlebih dulu.`,
    };
  }

  try {
    await prisma.user.delete({ where: { id } });
  } catch (e) {
    console.error("[deleteUser]", e);
    return { error: "Gagal menghapus akun. Coba lagi." };
  }

  invalidateUsersPages();
  return { success: true };
}

// ── Reset password (generate password sementara) ─────────────────────────────
const TEMP_PASSWORD_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

export async function resetUserPassword(id: string): Promise<UserActionResult> {
  await requireRole("ADMIN");
  if (!id) return { error: "ID pengguna wajib" };

  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  let temp = "";
  for (const b of bytes) temp += TEMP_PASSWORD_ALPHABET[b % TEMP_PASSWORD_ALPHABET.length];

  try {
    const hashed = await bcrypt.hash(temp, 10);
    await prisma.user.update({ where: { id }, data: { password: hashed, isActive: true } });
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "P2025") return { error: "Pengguna tidak ditemukan." };
    console.error("[resetUserPassword]", e);
    return { error: "Gagal reset password. Coba lagi." };
  }

  invalidateUsersPages();
  return {
    success: true,
    data: { tempPassword: temp },
  };
}
