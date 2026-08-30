import { NextRequest, NextResponse } from "next/server";
import { findConflicts, combineDateTime } from "@/shared/lib/booking-schedule";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const date      = searchParams.get("date");
  const time      = searchParams.get("time");
  const excludeId = searchParams.get("excludeId") ?? undefined;

  const dt = combineDateTime(date, time);
  if (!dt) {
    return NextResponse.json({ conflicts: [] });
  }

  try {
    const conflicts = await findConflicts(dt, excludeId);
    return NextResponse.json({
      conflicts: conflicts.map((c) => ({
        id:            c.id,
        name:          c.name,
        formattedDate: c.formattedDate,
      })),
    });
  } catch (e) {
    console.error("[/api/bookings/conflicts]", e);
    return NextResponse.json({ conflicts: [] }, { status: 500 });
  }
}
