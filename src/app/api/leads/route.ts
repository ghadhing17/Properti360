import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/db";
import { z } from "zod";

const leadSchema = z.object({
  listingId: z.string().min(1),
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  phone: z.string().min(8).max(20),
  message: z.string().min(5, "Pesan minimal 5 karakter").max(2000),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input tidak valid" }, { status: 400 });
    }
    const { listingId, name, phone, message } = parsed.data;

    // cek listing ada & published (atau tetap izinkan draft? — izinkan tapi log)
    const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { id: true } });
    if (!listing) return NextResponse.json({ error: "Listing tidak ditemukan" }, { status: 404 });

    const lead = await prisma.lead.create({
      data: { listingId, name, phone, message },
    });

    // Kirim email notifikasi via Resend (non-blocking, best-effort — jangan gagalkan response)
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (apiKey) {
      const listingFull = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { title: true, slug: true, city: true },
      });
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
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
      const url = listingFull && siteUrl ? `${siteUrl}/listing/${listingFull.slug}` : "";
      const from = process.env.RESEND_FROM?.trim() || "Properti360 <onboarding@resend.dev>";
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [adminEmail],
          subject: `Lead baru: ${listingFull?.title ?? listingId} — ${name}`,
          html: `<p>Lead baru untuk <a href="${url}">${listingFull?.title ?? listingId}</a> (${listingFull?.city ?? ""})</p><p><b>${name}</b> — ${phone}</p><p style="white-space:pre-wrap">${message}</p><p><a href="${url}">Lihat listing</a></p>`,
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, id: lead.id });
  } catch (e) {
    console.error("[leads] POST error", e);
    return NextResponse.json({ error: "Gagal menyimpan pesan" }, { status: 500 });
  }
}
