"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/shared/auth/session";
import { prisma } from "@/shared/lib/db";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "kategori";
}

async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let counter = 1;
  while (true) {
    const existing = await prisma.category.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) break;
    if (excludeId && existing.id === excludeId) break;
    slug = `${base}-${++counter}`;
    if (counter > 100) { slug = `${base}-${Date.now()}`; break; }
  }
  return slug;
}

const categorySchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(60, "Nama maksimal 60 karakter").trim(),
});

export type CategoryActionResult = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function createCategory(formData: FormData): Promise<CategoryActionResult> {
  await requireRole("ADMIN");
  try {
    const parsed = categorySchema.safeParse({ name: formData.get("name") });
    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Data tidak valid",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const { name } = parsed.data;
    const existing = await prisma.category.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
    if (existing) return { error: `Kategori "${name}" sudah ada` };
    const slug = await generateUniqueSlug(name);
    await prisma.category.create({ data: { name, slug } });
    revalidatePath("/admin/categories");
    revalidatePath("/admin/listings");
    return { success: true };
  } catch (e) {
    console.error("[createCategory]", e);
    return { error: e instanceof Error ? e.message : "Gagal membuat kategori" };
  }
}

export async function updateCategory(id: string, formData: FormData): Promise<CategoryActionResult> {
  await requireRole("ADMIN");
  try {
    const parsed = categorySchema.safeParse({ name: formData.get("name") });
    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Data tidak valid",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const { name } = parsed.data;
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return { error: "Kategori tidak ditemukan" };
    const duplicate = await prisma.category.findFirst({
      where: { name: { equals: name, mode: "insensitive" }, id: { not: id } },
    });
    if (duplicate) return { error: `Kategori "${name}" sudah ada` };
    const slug = await generateUniqueSlug(name, id);
    await prisma.category.update({ where: { id }, data: { name, slug } });
    revalidatePath("/admin/categories");
    revalidatePath("/admin/listings");
    return { success: true };
  } catch (e) {
    console.error("[updateCategory]", e);
    return { error: e instanceof Error ? e.message : "Gagal mengupdate kategori" };
  }
}

export async function deleteCategory(id: string): Promise<CategoryActionResult> {
  await requireRole("ADMIN");
  try {
    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { listings: true } } },
    });
    if (!existing) return { error: "Kategori tidak ditemukan" };
    if (existing._count.listings > 0) {
      return { error: `Tidak bisa hapus — kategori ini dipakai oleh ${existing._count.listings} listing. Pindahkan listing ke kategori lain dulu.` };
    }
    await prisma.category.delete({ where: { id } });
    revalidatePath("/admin/categories");
    revalidatePath("/admin/listings");
    return { success: true };
  } catch (e) {
    console.error("[deleteCategory]", e);
    return { error: e instanceof Error ? e.message : "Gagal menghapus kategori" };
  }
}
