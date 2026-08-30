/**
 * Booking Schedule Utilities — Properti360
 *
 * Aturan jadwal:
 * - Jam operasional: 09:00–16:00 (waktu lokal)
 * - Setiap sesi lokasi memblokir jendela 4 jam:
 *     [-60 menit, +180 menit] dari waktu booking (T)
 *   Artinya: perjalanan 1 jam sebelum, 1 jam foto, 2 jam pulang+charge
 * - Dua booking KONFLIK jika jendela blokir mereka overlap
 */

// ── Konstanta ────────────────────────────────────────────────────────────────

export const OPERATING_START_HOUR = 9;   // 09:00
export const OPERATING_END_HOUR   = 16;  // 16:00

/** Menit sebelum T yang diblokir (perjalanan ke lokasi) */
export const PRE_BLOCK_MINUTES  = 60;   // 1 jam

/** Menit setelah T yang diblokir (foto + pulang + charge) */
export const POST_BLOCK_MINUTES = 180;  // 3 jam

/** Total jendela blokir per booking = 4 jam */
export const BLOCK_WINDOW_MINUTES = PRE_BLOCK_MINUTES + POST_BLOCK_MINUTES;

// ── Time slot yang tersedia untuk pilihan UI ─────────────────────────────────

export const TIME_SLOTS: { value: string; label: string }[] = [
  { value: "09:00", label: "09:00" },
  { value: "10:00", label: "10:00" },
  { value: "11:00", label: "11:00" },
  { value: "12:00", label: "12:00" },
  { value: "13:00", label: "13:00" },
  { value: "14:00", label: "14:00" },
  { value: "15:00", label: "15:00" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Gabung string tanggal "YYYY-MM-DD" + waktu "HH:MM" → Date.
 * Mengembalikan null jika input tidak valid.
 */
export function combineDateTime(date: string | null | undefined, time: string | null | undefined): Date | null {
  if (!date || !time) return null;
  const d = new Date(`${date}T${time}:00`);
  if (isNaN(d.getTime())) return null;
  return d;
}

/**
 * Ambil bagian tanggal "YYYY-MM-DD" dari Date.
 */
export function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Ambil bagian waktu "HH:MM" dari Date (UTC-aware → local format).
 */
export function toTimeString(d: Date): string {
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Format tanggal + waktu dalam bahasa Indonesia.
 * Contoh: "Senin, 29 Agustus 2026 pukul 10.00"
 */
export function formatBookingDateTime(d: Date): string {
  const date = d.toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const time = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} pukul ${time}`;
}

/**
 * Periksa apakah waktu booking berada dalam jam operasional (09:00–16:00).
 */
export function isWithinOperatingHours(dt: Date): boolean {
  const h = dt.getHours();
  const m = dt.getMinutes();
  const totalMinutes = h * 60 + m;
  const start = OPERATING_START_HOUR * 60;
  const end   = OPERATING_END_HOUR * 60;
  return totalMinutes >= start && totalMinutes <= end;
}

/**
 * Hitung jendela blokir [blockStart, blockEnd] untuk sebuah booking.
 * blockStart = dt - 60 menit
 * blockEnd   = dt + 180 menit
 */
export function getBlockWindow(dt: Date): { blockStart: Date; blockEnd: Date } {
  return {
    blockStart: new Date(dt.getTime() - PRE_BLOCK_MINUTES  * 60_000),
    blockEnd:   new Date(dt.getTime() + POST_BLOCK_MINUTES * 60_000),
  };
}

/**
 * Apakah dua jendela [aStart,aEnd] dan [bStart,bEnd] overlap?
 * Overlap jika aStart < bEnd && aEnd > bStart.
 */
export function windowsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

// ── Tipe untuk hasil conflict check ─────────────────────────────────────────

export type ConflictInfo = {
  id: string;
  name: string;
  preferredDate: Date;
  formattedDate: string;
};

/**
 * Query ke Prisma dan kembalikan daftar booking yang konflik dengan
 * jendela waktu `dt`, dikecualikan booking dengan `excludeId`.
 *
 * PERHATIAN: fungsi ini harus dipakai di server-side saja karena
 * langsung import Prisma. Untuk client-side, gunakan API route.
 */
export async function findConflicts(
  dt: Date,
  excludeId?: string,
): Promise<ConflictInfo[]> {
  // Lazy-import prisma agar file ini tetap importable di client (tree-shaking)
  const { prisma } = await import("@/shared/lib/db");

  const { blockStart, blockEnd } = getBlockWindow(dt);

  // Ambil booking dalam rentang kasar agar query efisien:
  // Booking yang window-nya bisa overlap: preferredDate ∈ (blockStart - 3h, blockEnd + 1h)
  const rangeStart = new Date(blockStart.getTime() - POST_BLOCK_MINUTES * 60_000);
  const rangeEnd   = new Date(blockEnd.getTime()   + PRE_BLOCK_MINUTES  * 60_000);

  const candidates = await prisma.bookingRequest.findMany({
    where: {
      preferredDate: { gte: rangeStart, lte: rangeEnd },
      status: { notIn: ["CANCELLED"] },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true, name: true, preferredDate: true },
  });

  return candidates
    .filter((c) => {
      if (!c.preferredDate) return false;
      const { blockStart: cStart, blockEnd: cEnd } = getBlockWindow(c.preferredDate);
      return windowsOverlap(blockStart, blockEnd, cStart, cEnd);
    })
    .map((c) => ({
      id:            c.id,
      name:          c.name,
      preferredDate: c.preferredDate!,
      formattedDate: formatBookingDateTime(c.preferredDate!),
    }));
}
