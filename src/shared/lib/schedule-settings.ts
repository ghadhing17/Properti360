/**
 * Schedule Settings — jam operasional & hari libur dari DB (dikelola /admin/settings).
 *
 * Semua fungsi "best effort": jika DB tidak reachable, kembalikan default
 * (09:00–16:00 semua hari, tanpa libur) supaya fitur booking publik tidak 500.
 * Tanggal libur disimpan "YYYY-MM-DD" string — semua pembanding tanggal di
 * file ini pakai waktu LOKAL, bukan UTC, agar tidak geser hari.
 */

import { prisma } from "@/shared/lib/db";

// ── Tipe ─────────────────────────────────────────────────────────────────────

export type DayHours = {
  dayOfWeek: number; // 0 = Minggu .. 6 = Sabtu (index Date.getDay())
  isClosed: boolean;
  openTime: string; // "HH:MM"
  closeTime: string; // "HH:MM"
};

export type HolidayInfo = {
  date: string; // "YYYY-MM-DD"
  name: string;
  isRecurring: boolean;
};

export type ScheduleSettings = {
  hours: DayHours[]; // selalu 7 entri, urut dayOfWeek
  holidays: HolidayInfo[];
};

// ── Default (match behavior lama: Senin–Sabtu 09:00–16:00, Minggu tutup) ─────

export const DEFAULT_DAY_HOURS: DayHours[] = Array.from({ length: 7 }, (_, day) => ({
  dayOfWeek: day,
  isClosed: day === 0, // Minggu tutup (sesuai perilaku form booking sebelumnya)
  openTime: "09:00",
  closeTime: "16:00",
}));

export const DEFAULT_SCHEDULE_SETTINGS: ScheduleSettings = {
  hours: DEFAULT_DAY_HOURS,
  holidays: [],
};

// ── Helpers tanggal (lokal, bukan UTC) ───────────────────────────────────────

/** Date → "YYYY-MM-DD" berdasarkan waktu lokal. */
export function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** "MM-DD" dari tanggal lokal — untuk libur berulang tahunan. */
function toMonthDay(dateStr: string): string {
  return dateStr.slice(5); // "YYYY-MM-DD" → "MM-DD"
}

// ── Loader ───────────────────────────────────────────────────────────────────

function fillMissingDays(rows: DayHours[]): DayHours[] {
  const byDay = new Map(rows.map((r) => [r.dayOfWeek, r]));
  return DEFAULT_DAY_HOURS.map((d) => byDay.get(d.dayOfWeek) ?? d);
}

/** Ambil pengaturan jadwal dari DB; fallback default saat DB gagal. */
export async function getScheduleSettings(): Promise<ScheduleSettings> {
  try {
    const [hours, holidays] = await Promise.all([
      prisma.operatingHour.findMany({
        orderBy: { dayOfWeek: "asc" },
        select: { dayOfWeek: true, isClosed: true, openTime: true, closeTime: true },
      }),
      prisma.holiday.findMany({
        select: { date: true, name: true, isRecurring: true },
      }),
    ]);
    return {
      hours: fillMissingDays(hours),
      holidays: holidays.map((h) => ({
        date: h.date,
        name: h.name,
        isRecurring: h.isRecurring,
      })),
    };
  } catch (e) {
    console.error("[getScheduleSettings] fallback ke default", e);
    return DEFAULT_SCHEDULE_SETTINGS;
  }
}

// ── Pemeriksaan murni (pure, mudah dites) ────────────────────────────────────

export const WEEKDAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

/** Ambil jam operasional untuk hari tertentu. */
export function getDayHours(settings: ScheduleSettings, d: Date): DayHours {
  return settings.hours[d.getDay()] ?? DEFAULT_DAY_HOURS[d.getDay()];
}

/** Cari libur aktif untuk tanggal tertentu (exact date ATAU recurring tahunan). */
export function findHoliday(settings: ScheduleSettings, d: Date): HolidayInfo | null {
  const dateStr = toLocalDateString(d);
  const md = toMonthDay(dateStr);
  for (const h of settings.holidays) {
    if (h.date === dateStr) return h;
    if (h.isRecurring && toMonthDay(h.date) === md) return h;
  }
  return null;
}

/**
 * Alasan kenapa sebuah Date (tanggal+jam booking) TIDAK bisa dipakai,
 * atau null jika tersedia. Urutan cek: libur → tutup → di luar jam.
 * Catatan: cek jam per-hari menggantikan konstanta global lama (isWithinOperatingHours
 * tetap ada untuk kompatibilitas).
 */
export function describeScheduleConflict(settings: ScheduleSettings, dt: Date): string | null {
  const holiday = findHoliday(settings, dt);
  if (holiday) {
    return holiday.isRecurring
      ? `tanggal ini libur tahunan (${holiday.name})`
      : `tanggal ini hari libur (${holiday.name})`;
  }

  const day = getDayHours(settings, dt);
  if (day.isClosed) {
    return `kami tutup di hari ${WEEKDAY_NAMES[day.dayOfWeek]}`;
  }

  const minutes = dt.getHours() * 60 + dt.getMinutes();
  const [openH, openM] = day.openTime.split(":").map(Number);
  const [closeH, closeM] = day.closeTime.split(":").map(Number);
  if (minutes < openH * 60 + openM || minutes > closeH * 60 + closeM) {
    return `jam operasional hari ini ${day.openTime}–${day.closeTime}`;
  }

  return null;
}

/** Tanggal (tanpa jam) tidak bisa dibooking sama sekali? */
export function isDateUnavailable(settings: ScheduleSettings, d: Date): string | null {
  const holiday = findHoliday(settings, d);
  if (holiday) return holiday.name;
  const day = getDayHours(settings, d);
  if (day.isClosed) return "tutup";
  return null;
}

/**
 * Ringkasan jam operasional untuk ditampilkan ke publik, mis:
 * "Senin–Sabtu 09:00–16:00 · Minggu tutup". Grup hari berurutan
 * dengan jam sama; non-berurutan dipisah koma.
 */
export function summarizeOperatingHours(settings: ScheduleSettings): string {
  const parts: string[] = [];
  let i = 0;
  while (i < 7) {
    const day = settings.hours[i] ?? DEFAULT_DAY_HOURS[i];
    let j = i;
    while (
      j + 1 < 7 &&
      (() => {
        const a = settings.hours[j] ?? DEFAULT_DAY_HOURS[j];
        const b = settings.hours[j + 1] ?? DEFAULT_DAY_HOURS[j + 1];
        return a.isClosed === b.isClosed && a.openTime === b.openTime && a.closeTime === b.closeTime;
      })()
    ) {
      j++;
    }

    const label =
      i === j
        ? WEEKDAY_NAMES[i]
        : `${WEEKDAY_NAMES[i][0]}${WEEKDAY_NAMES[i].slice(1, 3)}–${WEEKDAY_NAMES[j]}`;
    parts.push(day.isClosed ? `${label} tutup` : `${label} ${day.openTime}–${day.closeTime}`);
    i = j + 1;
  }
  return parts.join(" · ");
}
