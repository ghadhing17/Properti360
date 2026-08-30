import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/lib/db";
import {
  TIME_SLOTS,
  getBlockWindow,
  windowsOverlap,
  combineDateTime,
} from "@/shared/lib/booking-schedule";
import {
  getScheduleSettings,
  getDayHours,
  findHoliday,
  toLocalDateString,
  isDateUnavailable,
  WEEKDAY_NAMES,
} from "@/shared/lib/schedule-settings";

export const dynamic = "force-dynamic";

/**
 * GET /api/bookings/available-slots?date=YYYY-MM-DD
 *
 * Returns which TIME_SLOTS are blocked (have a conflicting booking, di luar
 * jam operasional, atau hari tutup/libur) for a given date, plus which dates
 * in a ±90-day window have at least one blocked slot (so the calendar can
 * gray-out fully-booked days) and which dates are closed entirely.
 *
 * Response shape:
 * {
 *   blockedSlots: string[];     // e.g. ["09:00","10:00"]
 *   fullyBookedDates: string[]; // e.g. ["2026-09-15"]
 *   closedDates?: string[];     // hari tutup/libur dalam window (opsional)
 *   reason?: string;            // alasan tanggal penuh-tutup (opsional)
 * }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const date = searchParams.get("date"); // "YYYY-MM-DD"

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date param required (YYYY-MM-DD)" }, { status: 400 });
  }

  try {
    const schedule = await getScheduleSettings();

    // ── 1. Blocked slots for the requested date ───────────────────────────────
    const [y, m, d] = date.split("-").map(Number);
    const requestedDate = new Date(y, m - 1, d); // waktu lokal — hindari geser hari UTC

    const holiday = findHoliday(schedule, requestedDate);
    const dayHours = getDayHours(schedule, requestedDate);

    const blockedSlots: string[] = [];

    if (holiday || dayHours.isClosed) {
      // Hari tutup / libur → semua slot diblokir
      for (const slot of TIME_SLOTS) blockedSlots.push(slot.value);
      return NextResponse.json({
        blockedSlots,
        fullyBookedDates: [],
        closedDates: [date],
        reason: holiday
          ? `Hari libur (${holiday.name})`
          : `Tutup di hari ${WEEKDAY_NAMES[dayHours.dayOfWeek]}`,
      });
    }

    for (const slot of TIME_SLOTS) {
      const dt = combineDateTime(date, slot.value);
      if (!dt) continue;

      // Slot di luar jam operasional per hari → blocked
      const minutes = dt.getHours() * 60 + dt.getMinutes();
      const [openH, openM] = dayHours.openTime.split(":").map(Number);
      const [closeH, closeM] = dayHours.closeTime.split(":").map(Number);
      if (minutes < openH * 60 + openM || minutes > closeH * 60 + closeM) {
        blockedSlots.push(slot.value);
        continue;
      }

      const { blockStart, blockEnd } = getBlockWindow(dt);

      // Widen query window same as findConflicts
      const rangeStart = new Date(blockStart.getTime() - 180 * 60_000);
      const rangeEnd   = new Date(blockEnd.getTime()   + 60  * 60_000);

      const candidates = await prisma.bookingRequest.findMany({
        where: {
          preferredDate: { gte: rangeStart, lte: rangeEnd },
          status: { notIn: ["CANCELLED"] },
        },
        select: { preferredDate: true },
      });

      const hasConflict = candidates.some((c) => {
        if (!c.preferredDate) return false;
        const { blockStart: cS, blockEnd: cE } = getBlockWindow(c.preferredDate);
        return windowsOverlap(blockStart, blockEnd, cS, cE);
      });

      if (hasConflict) blockedSlots.push(slot.value);
    }

    // ── 2. Fully-booked + closed dates in 90-day window ──────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const windowStart = new Date(today);
    const windowEnd   = new Date(today);
    windowEnd.setDate(windowEnd.getDate() + 90);

    // Tanggal tutup/libur dalam window → dikirim terpisah agar kalender bisa
    // menonaktifkannya tanpa menghitung "fully booked".
    const closedDates: string[] = [];
    const cursor = new Date(windowStart);
    while (cursor <= windowEnd) {
      if (isDateUnavailable(schedule, cursor)) closedDates.push(toLocalDateString(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    // Fetch all active bookings in the window
    const bookings = await prisma.bookingRequest.findMany({
      where: {
        preferredDate: { gte: windowStart, lte: windowEnd },
        status: { notIn: ["CANCELLED"] },
      },
      select: { preferredDate: true },
    });

    // For each date that has any booking, check if ALL slots are blocked
    const dateSet = new Set<string>();
    const closedSet = new Set(closedDates);
    for (const b of bookings) {
      if (b.preferredDate) {
        const d = b.preferredDate.toISOString().slice(0, 10);
        if (!closedSet.has(d)) dateSet.add(d);
      }
    }

    const fullyBookedDates: string[] = [];
    for (const d of dateSet) {
      let allBlocked = true;
      for (const slot of TIME_SLOTS) {
        const dt = combineDateTime(d, slot.value);
        if (!dt) continue;
        const { blockStart, blockEnd } = getBlockWindow(dt);
        const rangeStart = new Date(blockStart.getTime() - 180 * 60_000);
        const rangeEnd   = new Date(blockEnd.getTime()   + 60  * 60_000);

        const candidates = await prisma.bookingRequest.findMany({
          where: {
            preferredDate: { gte: rangeStart, lte: rangeEnd },
            status: { notIn: ["CANCELLED"] },
          },
          select: { preferredDate: true },
        });

        const hasConflict = candidates.some((c) => {
          if (!c.preferredDate) return false;
          const { blockStart: cS, blockEnd: cE } = getBlockWindow(c.preferredDate);
          return windowsOverlap(blockStart, blockEnd, cS, cE);
        });

        if (!hasConflict) { allBlocked = false; break; }
      }
      if (allBlocked) fullyBookedDates.push(d);
    }

    return NextResponse.json({ blockedSlots, fullyBookedDates, closedDates });
  } catch (e) {
    console.error("[/api/bookings/available-slots]", e);
    return NextResponse.json({ blockedSlots: [], fullyBookedDates: [], closedDates: [] }, { status: 500 });
  }
}
