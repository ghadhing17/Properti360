"use server";

import { prisma } from "@/shared/lib/db";
import { z } from "zod";

const leadSchema = z.object({
  listingId: z.string().min(1),
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  phone: z.string().min(8, "No HP minimal 8 karakter").max(20),
  message: z.string().min(5, "Pesan minimal 5 karakter").max(2000),
});

export type LeadActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Server Action untuk form "Hubungi Pemilik" di halaman publik /listing/[slug].
 * Insert ke tabel Lead + kirim email notifikasi ke admin via Resend (non-blocking, best effort).
 * Dipakai oleh ContactForm (client) via form action / useActionState.
 */
export async function submitLead(
  _prevState: LeadActionState,
  formData: FormData
): Promise<LeadActionState> {
  const raw = {
    listingId: String(formData.get("listingId") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    message: String(formData.get("message") ?? "").trim(),
  };

  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { listingId, name, phone, message } = parsed.data;

  // Validasi listing ada (izinkan DRAFT tetap insert jika owner/admin yang lihat, tapi publik sudah di-guard di page)
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, title: true, slug: true, city: true },
  });
  if (!listing) return { error: "Listing tidak ditemukan" };

  try {
    await prisma.lead.create({ data: { listingId, name, phone, message } });
  } catch (e) {
    console.error("[submitLead] db error", e);
    return { error: "Gagal menyimpan pesan. Coba lagi." };
  }

  // Kirim email notifikasi ke admin — fire & forget, jangan gagalkan UX jika Resend error
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (apiKey) {
    // Cari email admin pertama sebagai penerima; fallback ke env ADMIN_EMAIL / SEED_ADMIN_EMAIL
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
    } catch {
      // ignore, pakai fallback
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
    const listingUrl = siteUrl ? `${siteUrl}/listing/${listing.slug}` : `/listing/${listing.slug}`;
    const from = process.env.RESEND_FROM?.trim() || "Properti360 <onboarding@resend.dev>";

    // Resend API via fetch (tanpa dependensi `resend` sdk supaya ringan)
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [adminEmail],
          subject: `Lead baru: ${listing.title} — ${name}`,
          html: `
            <div style="font-family:system-ui,sans-serif;line-height:1.6;color:#0f172a">
              <h2 style="margin:0 0 8px">Lead baru masuk</h2>
              <p style="margin:0 0 12px;color:#64748b">Listing: <a href="${listingUrl}">${listing.title}</a> (${listing.city})</p>
              <table style="border-collapse:collapse;width:100%;max-width:480px">
                <tr><td style="padding:6px 8px;border:1px solid #e2e8f0;font-weight:600;width:120px">Nama</td><td style="padding:6px 8px;border:1px solid #e2e8f0">${escapeHtml(name)}</td></tr>
                <tr><td style="padding:6px 8px;border:1px solid #e2e8f0;font-weight:600">Telepon</td><td style="padding:6px 8px;border:1px solid #e2e8f0"><a href="https://wa.me/${encodeURIComponent(phone.replace(/\D/g, ""))}">${escapeHtml(phone)}</a></td></tr>
                <tr><td style="padding:6px 8px;border:1px solid #e2e8f0;font-weight:600">Pesan</td><td style="padding:6px 8px;border:1px solid #e2e8f0;white-space:pre-wrap">${escapeHtml(message)}</td></tr>
              </table>
              <p style="margin:16px 0 0"><a href="${listingUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:8px 14px;border-radius:8px;text-decoration:none">Lihat listing</a>
              <a href="https://wa.me/${encodeURIComponent(phone.replace(/\D/g, ""))}?text=${encodeURIComponent(`Halo ${name}, terkait ${listing.title} — `)}" style="margin-left:8px;color:#1d4ed8">Balas via WhatsApp →</a></p>
              <p style="margin:16px 0 0;color:#94a3b8;font-size:12px">Email otomatis dari Properti360 — jangan balas langsung ke email ini.</p>
            </div>
          `,
        }),
      }).then(async (r) => {
        if (!r.ok) {
          const txt = await r.text().catch(() => "");
          console.warn("[submitLead] Resend non-OK", r.status, txt.slice(0, 500));
        }
      });
    } catch (e) {
      console.warn("[submitLead] Resend fetch error (ignored)", e);
    }
  }

  return { success: true };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
