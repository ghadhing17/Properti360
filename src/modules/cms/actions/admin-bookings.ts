"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/shared/auth/session";
import { prisma } from "@/shared/lib/db";
import {
  adminBookingSchema,
  bookingStatusValues,
  propertyTypeValues,
  type BookingStatusValue,
} from "@/shared/lib/validations/booking";
import {
  combineDateTime,
  findConflicts,
  isWithinOperatingHours,
  OPERATING_START_HOUR,
  OPERATING_END_HOUR,
} from "@/shared/lib/booking-schedule";
import { getScheduleSettings, describeScheduleConflict } from "@/shared/lib/schedule-settings";

export type BookingActionResult = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function parseFormData(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    propertyType: String(formData.get("propertyType") ?? "RUMAH").trim() || "RUMAH",
    preferredDate: formData.get("preferredDate") ? String(formData.get("preferredDate")) : null,
    preferredTime: formData.get("preferredTime") ? String(formData.get("preferredTime")) : null,
    status: String(formData.get("status") ?? "PENDING").trim() || "PENDING",
    productId: formData.get("productId") ? String(formData.get("productId")).trim() : null,
  };
}

/**
 * Validasi jadwal: jam operasional + conflict detection.
 * Mengembalikan pesan error atau null jika valid.
 */
async function validateSchedule(
  dateStr: string | null,
  timeStr: string | null,
  excludeId?: string,
): Promise<string | null> {
  const dt = combineDateTime(dateStr, timeStr);
  if (!dt) return null; // jadwal kosong → boleh (opsional)

  if (!isWithinOperatingHours(dt)) {
    return `Jadwal di luar jam operasional. Pilih waktu antara ${OPERATING_START_HOUR.toString().padStart(2,"0")}:00 – ${OPERATING_END_HOUR.toString().padStart(2,"0")}:00.`;
  }

  // Cek pengaturan jadwal dari /admin/settings (hari tutup + hari libur + jam per hari)
  const schedule = await getScheduleSettings();
  const scheduleConflict = describeScheduleConflict(schedule, dt);
  if (scheduleConflict) {
    return `Maaf, jadwal tidak tersedia — ${scheduleConflict}.`;
  }

  const conflicts = await findConflicts(dt, excludeId);
  if (conflicts.length > 0) {
    const list = conflicts.map((c) => `• ${c.name} — ${c.formattedDate}`).join("\n");
    return `Jadwal bertabrakan dengan booking yang sudah ada (jendela ±4 jam):\n${list}\n\nSilakan pilih waktu lain.`;
  }

  return null;
}

export async function createBooking(_prevState: BookingActionResult, formData: FormData): Promise<BookingActionResult> {
  await requireRole("ADMIN");

  const raw = parseFormData(formData);
  if (!(propertyTypeValues as readonly string[]).includes(raw.propertyType)) raw.propertyType = "RUMAH";
  if (!(bookingStatusValues as readonly string[]).includes(raw.status)) raw.status = "PENDING";

  // Validasi jadwal sebelum schema parse
  const scheduleError = await validateSchedule(raw.preferredDate, raw.preferredTime);
  if (scheduleError) return { error: scheduleError };

  // Gabung tanggal + waktu sebelum parse schema
  if (raw.preferredDate && raw.preferredTime) {
    raw.preferredDate = `${raw.preferredDate}T${raw.preferredTime}`;
  }

  const parsed = adminBookingSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, phone, address, propertyType, preferredDate, status } = parsed.data;
  const productId = raw.productId || null;

  await prisma.bookingRequest.create({
    data: { name, phone, address, propertyType, preferredDate, status, productId },
  });

  revalidatePath("/admin/bookings");
  redirect("/admin/bookings");
}

export async function updateBooking(id: string, _prevState: BookingActionResult, formData: FormData): Promise<BookingActionResult> {
  await requireRole("ADMIN");

  const raw = parseFormData(formData);
  if (!(propertyTypeValues as readonly string[]).includes(raw.propertyType)) raw.propertyType = "RUMAH";
  if (!(bookingStatusValues as readonly string[]).includes(raw.status)) raw.status = "PENDING";

  // Validasi jadwal (kecualikan booking saat ini)
  const scheduleError = await validateSchedule(raw.preferredDate, raw.preferredTime, id);
  if (scheduleError) return { error: scheduleError };

  if (raw.preferredDate && raw.preferredTime) {
    raw.preferredDate = `${raw.preferredDate}T${raw.preferredTime}`;
  }

  const parsed = adminBookingSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, phone, address, propertyType, preferredDate, status } = parsed.data;
  const productId = raw.productId || null;

  const existing = await prisma.bookingRequest.findUnique({ where: { id } });
  if (!existing) return { error: "Booking tidak ditemukan" };

  await prisma.bookingRequest.update({
    where: { id },
    data: { name, phone, address, propertyType, preferredDate, status, productId },
  });

  revalidatePath("/admin/bookings");
  redirect("/admin/bookings");
}

export async function updateBookingStatus(id: string, status: string): Promise<BookingActionResult> {
  await requireRole("ADMIN");

  if (!(bookingStatusValues as readonly string[]).includes(status)) {
    return { error: "Status tidak valid" };
  }

  const existing = await prisma.bookingRequest.findUnique({ where: { id } });
  if (!existing) return { error: "Booking tidak ditemukan" };

  await prisma.bookingRequest.update({
    where: { id },
    data: { status: status as BookingStatusValue },
  });

  revalidatePath("/admin/bookings");
  return { success: true };
}

export async function deleteBooking(id: string): Promise<BookingActionResult> {
  await requireRole("ADMIN");

  const existing = await prisma.bookingRequest.findUnique({ where: { id } });
  if (!existing) return { error: "Booking tidak ditemukan" };

  await prisma.bookingRequest.delete({ where: { id } });

  revalidatePath("/admin/bookings");
  return { success: true };
}
