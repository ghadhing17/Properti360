"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/shared/auth/session";
import { prisma } from "@/shared/lib/db";

const customerUpdateSchema = z.object({
  description: z.string().min(10, "Deskripsi minimal 10 karakter").max(5000, "Deskripsi terlalu panjang"),
  price: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((v) => {
      if (v === "" || v === null || v === undefined) return null;
      const n = typeof v === "string" ? Number(v.replace(/[^\d-]/g, "")) : v;
      if (Number.isNaN(n)) return null;
      return Math.trunc(n);
    })
    .refine((v) => v === null || (Number.isInteger(v) && v >= 0), {
      message: "Harga harus angka >= 0",
    }),
  // info kontak yang ditampilkan di halaman publik — simpan ke User.phone & User.name
  contactPhone: z.string().max(20).optional().nullable(),
  contactName: z.string().max(100).optional().nullable(),
});

export type CustomerUpdateResult = { success?: boolean; error?: string; fieldErrors?: Record<string, string[]> };

function toNullableString(v: FormDataEntryValue | null): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

/**
 * Customer hanya boleh ubah description, price, dan info kontak
 * TIDAK boleh ubah status publish, kategori, atau Panoee embed
 */
export async function updateCustomerListing(id: string, formData: FormData): Promise<CustomerUpdateResult> {
  const user = await requireRole(["ADMIN", "CUSTOMER"]);

  try {
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { id: true, ownerId: true, status: true },
    });
    if (!listing) return { error: "Listing tidak ditemukan" };

    // Proteksi: customer hanya bisa edit miliknya sendiri; ADMIN boleh semua
    if (user.role !== "ADMIN" && listing.ownerId !== user.id) {
      return { error: "Anda tidak memiliki akses ke listing ini" };
    }

    const raw = {
      description: toNullableString(formData.get("description")) ?? "",
      price: toNullableString(formData.get("price")),
      contactPhone: toNullableString(formData.get("contactPhone")),
      contactName: toNullableString(formData.get("contactName")),
    };

    const parsed = customerUpdateSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Data tidak valid",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const data = parsed.data;

    // Listing yang sudah PUBLISHED tidak boleh kehilangan field wajib publish
    // (mis. harga dikosongkan) lewat jalur edit customer — tolak sebelum update.
    if (listing.status === "PUBLISHED" && data.price === null) {
      return {
        error: "Harga wajib diisi karena listing sudah terpublikasi. Isi harga terlebih dahulu.",
        fieldErrors: { price: ["Harga wajib diisi selama listing berstatus Published"] },
      };
    }

    await prisma.listing.update({
      where: { id },
      data: {
        description: data.description,
        price: data.price,
      },
    });

    // Update info kontak (User phone/name) — hanya untuk owner listing ini
    if (data.contactPhone !== undefined || data.contactName !== undefined) {
      const ownerUpdate: Record<string, string> = {};
      if (data.contactPhone !== null && data.contactPhone !== undefined) {
        ownerUpdate.phone = data.contactPhone;
      }
      if (data.contactName !== null && data.contactName !== undefined && data.contactName.trim().length >= 2) {
        ownerUpdate.name = data.contactName.trim();
      }
      if (Object.keys(ownerUpdate).length > 0) {
        await prisma.user.update({
          where: { id: listing.ownerId ?? "" },
          data: ownerUpdate,
        });
      }
    }

    revalidatePath(`/customer/listings/${id}`);
    revalidatePath("/customer");
    return { success: true };
  } catch (e: unknown) {
    console.error("[updateCustomerListing]", e);
    const msg = e instanceof Error ? e.message : "Gagal update listing";
    return { error: msg };
  }
}
