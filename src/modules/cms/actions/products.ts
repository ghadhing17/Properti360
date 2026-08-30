"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/shared/auth/session";
import { prisma } from "@/shared/lib/db";
import { productSchema } from "@/shared/lib/validations/product";

export type ProductActionResult = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

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
    .slice(0, 80) || "produk";
}

async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let counter = 1;
  while (true) {
    const existing = await prisma.serviceProduct.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) break;
    if (excludeId && existing.id === excludeId) break;
    slug = `${base}-${++counter}`;
    if (counter > 100) { slug = `${base}-${Date.now()}`; break; }
  }
  return slug;
}

function parseFormData(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    price: formData.get("price") ? String(formData.get("price")) : null,
    features: formData.get("features") ? String(formData.get("features")) : null,
    isActive: formData.get("isActive") ? String(formData.get("isActive")) : undefined,
    isPopular: formData.get("isPopular") ? String(formData.get("isPopular")) : undefined,
    order: formData.get("order") ? String(formData.get("order")) : null,
  };
}

export async function createProduct(_prevState: ProductActionResult, formData: FormData): Promise<ProductActionResult> {
  await requireRole("ADMIN");

  const parsed = productSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, description, price, features, isActive, isPopular, order } = parsed.data;
  const slug = await generateUniqueSlug(name);

  try {
    await prisma.serviceProduct.create({
      data: { name, slug, description, price, features, isActive, isPopular, order },
    });
  } catch (e) {
    console.error("[createProduct]", e);
    return { error: "Gagal menyimpan produk. Coba lagi." };
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function updateProduct(id: string, _prevState: ProductActionResult, formData: FormData): Promise<ProductActionResult> {
  await requireRole("ADMIN");

  const existing = await prisma.serviceProduct.findUnique({ where: { id } });
  if (!existing) return { error: "Produk tidak ditemukan" };

  const parsed = productSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, description, price, features, isActive, isPopular, order } = parsed.data;
  const slug = name !== existing.name ? await generateUniqueSlug(name, id) : existing.slug;

  try {
    await prisma.serviceProduct.update({
      where: { id },
      data: { name, slug, description, price, features, isActive, isPopular, order },
    });
  } catch (e) {
    console.error("[updateProduct]", e);
    return { error: "Gagal mengupdate produk. Coba lagi." };
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function deleteProduct(id: string): Promise<ProductActionResult> {
  await requireRole("ADMIN");

  const existing = await prisma.serviceProduct.findUnique({
    where: { id },
    include: { _count: { select: { bookings: true } } },
  });
  if (!existing) return { error: "Produk tidak ditemukan" };

  if (existing._count.bookings > 0) {
    // Hapus relasi dari bookings dulu dengan set null, lalu hapus produk
    await prisma.bookingRequest.updateMany({ where: { productId: id }, data: { productId: null } });
  }

  try {
    await prisma.serviceProduct.delete({ where: { id } });
  } catch (e) {
    console.error("[deleteProduct]", e);
    return { error: "Gagal menghapus produk. Coba lagi." };
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  return { success: true };
}

export async function toggleProductActive(id: string, isActive: boolean): Promise<ProductActionResult> {
  await requireRole("ADMIN");

  try {
    await prisma.serviceProduct.update({ where: { id }, data: { isActive } });
  } catch (e) {
    console.error("[toggleProductActive]", e);
    return { error: "Gagal mengupdate status produk." };
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  return { success: true };
}
