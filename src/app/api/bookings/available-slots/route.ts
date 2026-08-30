import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/lib/db";
import {
  TIME_SLOTS,
  getBlockWindow,
  windowsOverlap,
  combineDateTime,
  OPERATING_START_HOUR,
  OPERATING_END_HOUR,
} from "@/shared/lib/booking-schedule";

export const dynamic = "force-dynamic";

/**
 * GET /api/bookings/available-slots?date=YYYY-MM-DD
 *
 * Returns which TIME_SLOTS are blocked (have a conflicting booking) for a
 * given date, plus which dates in a ±2-month window have at least one
 * blocked slot (so the calendar can gray-out fully-booked days).
 *
 * Response shape:
 * {
 *   blockedSlots: string[];   // e.g. ["09:00","10:00"]
 *   fullyBookedDates: string[]; // e.g. ["2026-09-15"]
 * }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const date = searchParams.get("date"); // "YYYY-MM-DD"

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date param required (YYYY-MM-DD)" }, { status: 400 });
  }

  try {
    // ── 1. Blocked slots for the requested date ───────────────────────────────
    const blockedSlots: string[] = [];

    for (const slot of TIME_SLOTS) {
      const dt = combineDateTime(date, slot.value);
      if (!dt) continue;

      // Slot outside operating hours → always blocked
      const h = dt.getHours();
      if (h < OPERATING_START_HOUR || h > OPERATING_END_HOUR) {
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

    // ── 2. Fully-booked dates in ±60-day window ───────────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const windowStart = new Date(today);
    const windowEnd   = new Date(today);
    windowEnd.setDate(windowEnd.getDate() + 90);

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
    for (const b of bookings) {
      if (b.preferredDate) {
        const d = b.preferredDate.toISOString().slice(0, 10);
        dateSet.add(d);
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

    return NextResponse.json({ blockedSlots, fullyBookedDates });
  } catch (e) {
    console.error("[/api/bookings/available-slots]", e);
    return NextResponse.json({ blockedSlots: [], fullyBookedDates: [] }, { status: 500 });
  }
}
