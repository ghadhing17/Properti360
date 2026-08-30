"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { requireRole } from "@/shared/auth/session";
import { prisma } from "@/shared/lib/db";
import { getStorage } from "@/shared/storage";
import {
  generalSettingsSchema,
  seoSettingsSchema,
  operatingHoursSchema,
  holidaySchema,
  adminProfileSchema,
  changePasswordSchema,
} from "@/shared/lib/validations/settings";

export type SettingsActionResult = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  data?: Record<string, unknown>;
};

// ── Konstanta upload OG image ────────────────────────────────────────────────
const OG_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const OG_ALLOWED_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;
const OG_RECOMMENDED = "Ukuran disarankan 1200×630 px (rasio 1.91:1).";

function invalidateSettingsPages() {
  // Landing + listing publik memakai metadata situs → invalidate agresif.
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
}

// ── Profil bisnis (tab Umum) ─────────────────────────────────────────────────
export async function updateGeneralSettings(
  _prev: SettingsActionResult,
  formData: FormData
): Promise<SettingsActionResult> {
  await requireRole("ADMIN");

  const parsed = generalSettingsSchema.safeParse({
    siteName: String(formData.get("siteName") ?? "").trim(),
    tagline: String(formData.get("tagline") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    contactEmail: String(formData.get("contactEmail") ?? "").trim(),
    contactPhone: String(formData.get("contactPhone") ?? "").trim(),
    whatsapp: String(formData.get("whatsapp") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    instagramUrl: String(formData.get("instagramUrl") ?? "").trim(),
    facebookUrl: String(formData.get("facebookUrl") ?? "").trim(),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { siteName, ...rest } = parsed.data;
  try {
    await prisma.siteSettings.upsert({
      where: { id: 1 },
      create: { id: 1, siteName, ...rest },
      update: { siteName, ...rest },
    });
  } catch (e) {
    console.error("[updateGeneralSettings]", e);
    return { error: "Gagal menyimpan pengaturan. Coba lagi." };
  }

  invalidateSettingsPages();
  return { success: true };
}

// ── SEO & OG (tab SEO & Open Graph) ──────────────────────────────────────────
export async function updateSeoSettings(
  _prev: SettingsActionResult,
  formData: FormData
): Promise<SettingsActionResult> {
  await requireRole("ADMIN");

  const parsed = seoSettingsSchema.safeParse({
    metaTitle: String(formData.get("metaTitle") ?? "").trim(),
    metaDescription: String(formData.get("metaDescription") ?? "").trim(),
    ogTitle: String(formData.get("ogTitle") ?? "").trim(),
    ogDescription: String(formData.get("ogDescription") ?? "").trim(),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { metaTitle, metaDescription, ogTitle, ogDescription } = parsed.data;
  try {
    await prisma.siteSettings.upsert({
      where: { id: 1 },
      create: { id: 1, metaTitle, metaDescription, ogTitle, ogDescription },
      update: { metaTitle, metaDescription, ogTitle, ogDescription },
    });
  } catch (e) {
    console.error("[updateSeoSettings]", e);
    return { error: "Gagal menyimpan pengaturan SEO. Coba lagi." };
  }

  invalidateSettingsPages();
  return { success: true };
}

// ── OG image (upload terpisah agar field teks tidak tertimpa) ────────────────
async function replaceOgImage(newUrl: string): Promise<void> {
  const current = await prisma.siteSettings.findUnique({
    where: { id: 1 },
    select: { ogImage: true },
  });

  await prisma.siteSettings.upsert({
    where: { id: 1 },
    create: { id: 1, ogImage: newUrl },
    update: { ogImage: newUrl },
  });

  // Hapus file lama (best-effort)
  if (current?.ogImage && current.ogImage !== newUrl) {
    try {
      await getStorage().delete(current.ogImage);
    } catch (e) {
      console.error("[ogImage] hapus file lama", e);
    }
  }
}

export async function uploadOgImage(
  _prev: SettingsActionResult,
  formData: FormData
): Promise<SettingsActionResult> {
  await requireRole("ADMIN");

  const fileEntry = formData.get("ogImage");
  if (!(fileEntry instanceof File) || fileEntry.size === 0) {
    return { error: "Pilih gambar terlebih dulu." };
  }

  const mime = fileEntry.type.toLowerCase().split(";")[0].trim();
  if (!(OG_ALLOWED_MIME as readonly string[]).includes(mime)) {
    return { error: "Format gambar harus JPG/PNG/WebP" };
  }
  if (fileEntry.size > OG_MAX_SIZE) {
    return { error: `Ukuran gambar maksimal 5MB. ${OG_RECOMMENDED}` };
  }

  let ogImageUrl: string;
  try {
    const buffer = Buffer.from(await fileEntry.arrayBuffer());
    const storage = getStorage();
    ogImageUrl = await storage.upload(buffer, "settings/og/og-image", mime);
  } catch (e) {
    console.error("[uploadOgImage]", e);
    return { error: "Gagal mengunggah gambar OG. Coba lagi." };
  }

  try {
    await replaceOgImage(ogImageUrl);
  } catch (e) {
    console.error("[uploadOgImage]", e);
    return { error: "Gagal menyimpan gambar OG. Coba lagi." };
  }

  invalidateSettingsPages();
  return { success: true, data: { ogImageUrl } };
}

/** Hapus OG image (set null + hapus file). */
export async function removeOgImage(): Promise<SettingsActionResult> {
  await requireRole("ADMIN");
  try {
    const current = await prisma.siteSettings.findUnique({
      where: { id: 1 },
      select: { ogImage: true },
    });
    await prisma.siteSettings.upsert({
      where: { id: 1 },
      create: { id: 1 },
      update: { ogImage: null },
    });
    if (current?.ogImage) {
      try {
        await getStorage().delete(current.ogImage);
      } catch (e) {
        console.error("[removeOgImage] hapus file", e);
      }
    }
  } catch (e) {
    console.error("[removeOgImage]", e);
    return { error: "Gagal menghapus gambar OG. Coba lagi." };
  }

  invalidateSettingsPages();
  return { success: true };
}

// ── Jam operasional ──────────────────────────────────────────────────────────
export async function updateOperatingHours(
  _prev: SettingsActionResult,
  formData: FormData
): Promise<SettingsActionResult> {
  await requireRole("ADMIN");

  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push({
      dayOfWeek: i,
      isClosed: formData.get(`day-${i}-isClosed`) !== null,
      openTime: String(formData.get(`day-${i}-open`) ?? "").trim(),
      closeTime: String(formData.get(`day-${i}-close`) ?? "").trim(),
    });
  }

  const parsed = operatingHoursSchema.safeParse({ days });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue?.message ?? "Input jam operasional tidak valid" };
  }

  try {
    for (const day of parsed.data.days) {
      await prisma.operatingHour.upsert({
        where: { dayOfWeek: day.dayOfWeek },
        create: {
          dayOfWeek: day.dayOfWeek,
          isClosed: day.isClosed,
          openTime: day.openTime,
          closeTime: day.closeTime,
        },
        update: {
          isClosed: day.isClosed,
          // Jangan timpa jam tersimpan saat hari tutup (input disabled → "00:00")
          ...(day.isClosed ? {} : { openTime: day.openTime, closeTime: day.closeTime }),
        },
      });
    }
  } catch (e) {
    console.error("[updateOperatingHours]", e);
    return { error: "Gagal menyimpan jam operasional. Coba lagi." };
  }

  invalidateSettingsPages();
  return { success: true };
}

// ── Hari libur ───────────────────────────────────────────────────────────────
export async function addHoliday(formData: FormData): Promise<SettingsActionResult> {
  await requireRole("ADMIN");

  const parsed = holidaySchema.safeParse({
    date: String(formData.get("date") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    isRecurring: formData.get("isRecurring") !== null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input libur tidak valid" };
  }

  try {
    await prisma.holiday.create({
      data: { date: parsed.data.date, name: parsed.data.name, isRecurring: parsed.data.isRecurring },
    });
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "P2002") {
      return { error: "Tanggal tersebut sudah terdaftar sebagai hari libur." };
    }
    console.error("[addHoliday]", e);
    return { error: "Gagal menambah hari libur. Coba lagi." };
  }

  invalidateSettingsPages();
  return { success: true };
}

export async function deleteHoliday(id: string): Promise<SettingsActionResult> {
  await requireRole("ADMIN");
  if (!id) return { error: "ID libur wajib" };

  try {
    await prisma.holiday.delete({ where: { id } });
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "P2025") return { error: "Hari libur sudah dihapus sebelumnya." };
    console.error("[deleteHoliday]", e);
    return { error: "Gagal menghapus hari libur. Coba lagi." };
  }

  invalidateSettingsPages();
  return { success: true };
}

// ── Wilayah aktif ────────────────────────────────────────────────────────────

const MAX_ACTIVE_PROVINCES = 60;
const MAX_ACTIVE_REGENCIES = 600;

/**
 * Simpan pilihan wilayah aktif (tab Wilayah).
 * Terima JSON string: { provinces: string[], regencies: string[] }.
 * Validasi: kode harus ada di tabel Wilayah, level benar, dan kab/kota
 * hanya boleh aktif jika provinsi induknya juga aktif.
 */
export async function updateActiveRegions(
  _prev: SettingsActionResult,
  formData: FormData
): Promise<SettingsActionResult> {
  await requireRole("ADMIN");

  let parsed: { provinces?: unknown; regencies?: unknown };
  try {
    parsed = JSON.parse(String(formData.get("payload") ?? "{}"));
  } catch {
    return { error: "Data wilayah tidak valid." };
  }

  const provinces = Array.isArray(parsed.provinces)
    ? [...new Set(parsed.provinces.filter((c): c is string => typeof c === "string" && /^[\d]{2}$/.test(c)))]
    : [];
  const regencies = Array.isArray(parsed.regencies)
    ? [...new Set(parsed.regencies.filter((c): c is string => typeof c === "string" && /^\d{2}\.\d{2}$/.test(c)))]
    : [];

  if (provinces.length === 0) {
    return { error: "Minimal satu provinsi harus aktif." };
  }
  if (provinces.length > MAX_ACTIVE_PROVINCES || regencies.length > MAX_ACTIVE_REGENCIES) {
    return { error: "Jumlah wilayah melebihi batas." };
  }

  // Kab/kota hanya boleh aktif jika provinsi induknya aktif
  const provSet = new Set(provinces);
  const filteredRegencies = regencies.filter((c) => provSet.has(c.slice(0, 2)));

  // Verifikasi semua kode benar-benar ada di tabel Wilayah
  const allCodes = [...provinces, ...filteredRegencies];
  const wilayahRows = await prisma.wilayah.findMany({
    where: { kode: { in: allCodes } },
    select: { kode: true, nama: true },
  });
  if (wilayahRows.length !== allCodes.length) {
    return { error: "Ada kode wilayah yang tidak dikenal. Muat ulang halaman dan coba lagi." };
  }
  const nameByCode = new Map(wilayahRows.map((r) => [r.kode, r.nama]));

  const rows = [
    ...provinces.map((code) => ({ code, name: nameByCode.get(code)!, level: "PROVINCE" })),
    ...filteredRegencies.map((code) => ({ code, name: nameByCode.get(code)!, level: "REGENCY" })),
  ];

  try {
    await prisma.$transaction([
      prisma.activeRegion.deleteMany(),
      prisma.activeRegion.createMany({ data: rows }),
    ]);
  } catch (e) {
    console.error("[updateActiveRegions]", e);
    return { error: "Gagal menyimpan wilayah aktif. Coba lagi." };
  }

  invalidateSettingsPages();
  return {
    success: true,
    data: { provinces: provinces.length, regencies: filteredRegencies.length },
  };
}

// ── Profil admin ─────────────────────────────────────────────────────────────
export async function updateAdminProfile(
  _prev: SettingsActionResult,
  formData: FormData
): Promise<SettingsActionResult> {
  const user = await requireRole("ADMIN");

  const parsed = adminProfileSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { name: parsed.data.name, phone: parsed.data.phone },
    });
  } catch (e) {
    console.error("[updateAdminProfile]", e);
    return { error: "Gagal menyimpan profil. Coba lagi." };
  }

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function changeAdminPassword(
  _prev: SettingsActionResult,
  formData: FormData
): Promise<SettingsActionResult> {
  const user = await requireRole("ADMIN");

  const parsed = changePasswordSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });
    if (!dbUser?.password) {
      return { error: "Akun tidak ditemukan." };
    }

    const valid = await bcrypt.compare(parsed.data.currentPassword, dbUser.password);
    if (!valid) {
      return {
        error: "Password saat ini salah.",
        fieldErrors: { currentPassword: ["Password saat ini salah."] },
      };
    }

    const hashed = await bcrypt.hash(parsed.data.newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
  } catch (e) {
    console.error("[changeAdminPassword]", e);
    return { error: "Gagal mengganti password. Coba lagi." };
  }

  return { success: true };
}
