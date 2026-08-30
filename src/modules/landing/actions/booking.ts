"use server";

import { prisma } from "@/shared/lib/db";
import { bookingSchema, propertyTypeValues } from "@/shared/lib/validations/booking";
import {
  combineDateTime,
  findConflicts,
  isWithinOperatingHours,
  OPERATING_START_HOUR,
  OPERATING_END_HOUR,
} from "@/shared/lib/booking-schedule";
import { getScheduleSettings, describeScheduleConflict } from "@/shared/lib/schedule-settings";

export type BookingActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Server Action untuk form booking di landing page marketing.
 * Menyimpan ke tabel BookingRequest dan kirim notifikasi email via Resend.
 */
export async function createBookingRequest(
  _prevState: BookingActionState,
  formData: FormData
): Promise<BookingActionState> {
  const raw = {
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    // Compose alamat dari hidden field (addressDetail, wilayah) yang di-build di client
    address: String(formData.get("address") ?? "").trim(),
    propertyType: String(formData.get("propertyType") ?? "RUMAH").trim() || "RUMAH",
    preferredDate: formData.get("preferredDate") ? String(formData.get("preferredDate")) : null,
    preferredTime: formData.get("preferredTime") ? String(formData.get("preferredTime")) : null,
    productId: formData.get("productId") ? String(formData.get("productId")).trim() : null,
  };

  if (!propertyTypeValues.includes(raw.propertyType as (typeof propertyTypeValues)[number])) {
    raw.propertyType = "RUMAH";
  }

  // Validasi jadwal jika diisi
  if (raw.preferredDate && raw.preferredTime) {
    const dt = combineDateTime(raw.preferredDate, raw.preferredTime);
    if (dt) {
      if (!isWithinOperatingHours(dt)) {
        return { error: `Jadwal di luar jam operasional. Pilih waktu antara ${OPERATING_START_HOUR.toString().padStart(2,"0")}:00 – ${OPERATING_END_HOUR.toString().padStart(2,"0")}:00.` };
      }
      // Cek pengaturan jadwal dari /admin/settings (hari tutup + hari libur + jam per hari)
      const schedule = await getScheduleSettings();
      const scheduleConflict = describeScheduleConflict(schedule, dt);
      if (scheduleConflict) {
        return { error: `Maaf, jadwal tidak tersedia — ${scheduleConflict}. Silakan pilih tanggal/waktu lain.` };
      }
      const conflicts = await findConflicts(dt);
      if (conflicts.length > 0) {
        return { error: `Maaf, jadwal tersebut sudah terisi. Silakan pilih tanggal/waktu lain.` };
      }
    }
    // Gabung ke satu string untuk schema transform
    raw.preferredDate = `${raw.preferredDate}T${raw.preferredTime}`;
  }

  const parsed = bookingSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, phone, address, propertyType, preferredDate } = parsed.data;
  const productId = raw.productId || null;

  let resolvedProductId: string | null = null;
  if (productId) {
    const product = await prisma.serviceProduct.findUnique({ where: { id: productId }, select: { id: true } });
    if (product) resolvedProductId = product.id;
  }

  let booking;
  try {
    booking = await prisma.bookingRequest.create({
      data: {
        name,
        phone,
        address,
        propertyType: propertyType as (typeof propertyTypeValues)[number],
        preferredDate: preferredDate ?? null,
        status: "PENDING",
        productId: resolvedProductId,
      },
    });
  } catch (e) {
    console.error("[createBookingRequest] db error", e);
    return { error: "Gagal menyimpan booking. Coba lagi." };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (apiKey) {
    const fallbackEmail =
      process.env.ADMIN_EMAIL?.trim() ||
      process.env.SEED_ADMIN_EMAIL?.trim() ||
      "admin@properti360.local";

    let adminEmail = fallbackEmail;
    try {
      const admin = await prisma.user.findFirst({
        where: { role: "ADMIN" },
        select: { email: true },
        orderBy: { createdAt: "asc" },
      });
      if (admin?.email) adminEmail = admin.email;
    } catch {}

    const preferredDateStr = booking.preferredDate
      ? new Date(booking.preferredDate).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
      : "belum ditentukan";

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";

    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Properti360 <noreply@properti360.id>",
          to: [adminEmail],
          subject: `Booking Baru: ${escapeHtml(name)} — ${preferredDateStr}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px">
              <h2 style="margin:0 0 16px;color:#1d4ed8">Booking Request Baru 🏠</h2>
              <p><strong>Nama:</strong> ${escapeHtml(name)}</p>
              <p><strong>No HP:</strong> ${escapeHtml(phone)}</p>
              <p><strong>Alamat:</strong> ${escapeHtml(address)}</p>
              <p><strong>Jadwal Preferensi:</strong> ${preferredDateStr}</p>
              <p style="margin:16px 0">
                <a href="https://wa.me/${encodeURIComponent(phone.replace(/\D/g, ""))}?text=${encodeURIComponent(`Halo ${name}, terkait booking jasa foto 360° Properti360 untuk ${address}. Konfirmasi jadwal ${preferredDateStr} ya.`)}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">Balas via WhatsApp →</a>
              </p>
              ${siteUrl ? `<p style="margin:16px 0 0;font-size:12px;color:#94a3b8">Lihat dashboard admin: <a href="${siteUrl}/admin">${siteUrl}/admin</a></p>` : ""}
              <p style="margin:8px 0 0;color:#94a3b8;font-size:12px">Email otomatis dari Properti360 — jangan balas langsung ke email ini.</p>
            </div>
          `,
        }),
      }).then(async (r) => {
        if (!r.ok) {
          const txt = await r.text().catch(() => "");
          console.warn("[createBookingRequest] Resend non-OK", r.status, txt.slice(0, 500));
        }
      });
    } catch (e) {
      console.warn("[createBookingRequest] Resend fetch error (ignored)", e);
    }
  }

  return { success: true };
}
