import { prisma } from "@/shared/lib/db";
import type { DayHours, ScheduleSettings } from "@/shared/lib/schedule-settings";
import { DEFAULT_DAY_HOURS } from "@/shared/lib/schedule-settings";

/**
 * Data-access layer Settings (admin) — profil situs, SEO/OG, jam operasional,
 * hari libur, profil admin, dan manajemen pengguna.
 */

// ── Site settings (singleton) ────────────────────────────────────────────────

/** Ambil baris settings id=1; buat baris default jika belum ada. Best-effort. */
export async function getSiteSettings() {
  const existing = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  try {
    return await prisma.siteSettings.create({ data: { id: 1 } });
  } catch (e) {
    // Race condition aman: baris sudah dibuat request lain — baca ulang.
    const retry = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    if (retry) return retry;
    console.error("[getSiteSettings]", e);
    throw e;
  }
}

/** Versi aman untuk metadata/generateMetadata — gagal DB = default, bukan 500. */
export async function getSiteSettingsSafe() {
  try {
    return await getSiteSettings();
  } catch {
    return null;
  }
}

// ── Jam operasional ──────────────────────────────────────────────────────────

/** Ambil 7 baris jam operasional; auto-create default (09:00–16:00) jika kosong. */
export async function getOperatingHours(): Promise<DayHours[]> {
  const rows = await prisma.operatingHour.findMany({ orderBy: { dayOfWeek: "asc" } });
  if (rows.length >= 7) {
    return rows.map((r) => ({
      dayOfWeek: r.dayOfWeek,
      isClosed: r.isClosed,
      openTime: r.openTime,
      closeTime: r.closeTime,
    }));
  }

  // Seed 7 hari default (idempotent — dayOfWeek unique)
  try {
    await prisma.operatingHour.createMany({
      data: DEFAULT_DAY_HOURS.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        isClosed: d.isClosed,
        openTime: d.openTime,
        closeTime: d.closeTime,
      })),
      skipDuplicates: true,
    });
  } catch (e) {
    console.error("[getOperatingHours] seed default", e);
  }

  const seeded = await prisma.operatingHour.findMany({ orderBy: { dayOfWeek: "asc" } });
  const byDay = new Map(seeded.map((r) => [r.dayOfWeek, r]));
  return DEFAULT_DAY_HOURS.map(
    (d) =>
      byDay.get(d.dayOfWeek) ?? {
        dayOfWeek: d.dayOfWeek,
        isClosed: d.isClosed,
        openTime: d.openTime,
        closeTime: d.closeTime,
      }
  );
}

// ── Hari libur ───────────────────────────────────────────────────────────────

export function getHolidays() {
  return prisma.holiday.findMany({ orderBy: { date: "asc" } });
}

/** Pengaturan jadwal lengkap untuk keperluan admin (preview). */
export async function getScheduleSettingsForAdmin(): Promise<ScheduleSettings> {
  const [hours, holidays] = await Promise.all([getOperatingHours(), getHolidays()]);
  return {
    hours,
    holidays: holidays.map((h) => ({
      date: h.date,
      name: h.name,
      isRecurring: h.isRecurring,
    })),
  };
}

// ── Wilayah aktif ────────────────────────────────────────────────────────────

export type ActiveRegionRow = { code: string; name: string; level: string };
export type WilayahRow = { code: string; name: string };

/**
 * Seed semua provinsi + kab/kota dari tabel Wilayah ke ActiveRegion.
 * Dipanggil sekali saat tabel ActiveRegion masih kosong — mempertahankan
 * perilaku lama (semua wilayah tersedia) sampai admin mematikan sebagian.
 */
async function seedAllActiveRegions(): Promise<void> {
  const provinces = await prisma.wilayah.findMany({
    where: { kode: { not: { contains: "." } } },
    orderBy: { kode: "asc" },
  });
  // Kab/kota: kode depth-2 "XX.XX" (LIKE '__.__' presisi, tidak nyangkut kec/desa)
  const regencies = await prisma.$queryRaw<{ kode: string; nama: string }[]>`
    SELECT kode, nama FROM wilayah WHERE kode LIKE '__.__' ORDER BY kode`;

  const rows = [
    ...provinces.map((p) => ({ code: p.kode, name: p.nama, level: "PROVINCE" })),
    ...regencies.map((r) => ({ code: r.kode, name: r.nama, level: "REGENCY" })),
  ];
  if (rows.length === 0) return;

  try {
    await prisma.activeRegion.createMany({ data: rows, skipDuplicates: true });
  } catch (e) {
    console.error("[seedAllActiveRegions]", e);
  }
}

/** Wilayah aktif; auto-seed semua saat masih kosong. */
export async function getActiveRegions(): Promise<ActiveRegionRow[]> {
  let rows = await prisma.activeRegion.findMany({ orderBy: { code: "asc" } });
  if (rows.length === 0) {
    await seedAllActiveRegions();
    rows = await prisma.activeRegion.findMany({ orderBy: { code: "asc" } });
  }
  return rows.map((r) => ({ code: r.code, name: r.name, level: r.level }));
}

/** Set kode provinsi & kab/kota aktif untuk filtering API wilayah. Null = semua aktif. */
export async function getActiveRegionSets(): Promise<{
  provinces: Set<string>;
  regencies: Set<string>;
} | null> {
  const rows = await prisma.activeRegion.findMany({ select: { code: true, level: true } });
  if (rows.length === 0) return null; // belum dikonfigurasi → semua wilayah aktif
  const provinces = new Set<string>();
  const regencies = new Set<string>();
  for (const r of rows) {
    if (r.level === "PROVINCE") provinces.add(r.code);
    else regencies.add(r.code);
  }
  return { provinces, regencies };
}

/** Daftar lengkap provinsi + kab/kota (untuk UI pilihan di settings). */
export async function getAllRegionsForAdmin(): Promise<{
  provinces: WilayahRow[];
  regencies: WilayahRow[];
}> {
  const [provinces, regencies] = await Promise.all([
    prisma.wilayah.findMany({
      where: { kode: { not: { contains: "." } } },
      orderBy: { nama: "asc" },
    }),
    prisma.$queryRaw<{ kode: string; nama: string }[]>`
      SELECT kode, nama FROM wilayah WHERE kode LIKE '__.__' ORDER BY nama`,
  ]);
  return {
    provinces: provinces.map((p) => ({ code: p.kode, name: p.nama })),
    regencies: regencies.map((r) => ({ code: r.kode, name: r.nama })),
  };
}

// ── Profil admin ─────────────────────────────────────────────────────────────

export function getAdminProfile(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      isActive: true,
    },
  });
}

// ── Manajemen pengguna ───────────────────────────────────────────────────────

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "ADMIN" | "CUSTOMER";
  isActive: boolean;
  createdAt: Date;
  listingCount: number;
};

export async function getAllUsersForAdmin(): Promise<AdminUserRow[]> {
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }], // ADMIN dulu
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: { select: { listings: true } },
    },
  });
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt,
    listingCount: u._count.listings,
  }));
}
