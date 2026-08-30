"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/shared/lib/db";
import { registerSchema } from "@/shared/lib/validations/auth";

export async function registerCustomer(values: unknown) {
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const { name, email, password, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Email sudah terdaftar" };
  }

  const hashed = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        phone: phone || null,
        // role otomatis CUSTOMER — jangan pernah terima role dari client
        role: "CUSTOMER",
      },
    });
  } catch (e) {
    console.error("[registerCustomer]", e);
    return { error: "Gagal membuat akun, coba lagi" };
  }

  return { success: true };
}
