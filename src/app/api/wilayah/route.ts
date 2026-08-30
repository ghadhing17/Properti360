import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/lib/db";
import { getActiveRegionSets } from "@/modules/cms";

// GET /api/wilayah?parent=32       -> kab/kota di Jawa Barat
// GET /api/wilayah?parent=32.73    -> kecamatan di Kota Bandung
// GET /api/wilayah (no parent)     -> daftar provinsi
// GET /api/wilayah?q=bandung       -> search nama (autocomplete)
// GET /api/wilayah?kode=32.73.01.1001 -> single + chain untuk prefill edit
// GET /api/wilayah?codes=32,32.73,32.73.01 -> batch resolve nama (untuk display listing)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parent = searchParams.get("parent")?.trim() || null;
  const q = searchParams.get("q")?.trim() || null;
  const kode = searchParams.get("kode")?.trim() || null;
  const codesParam = searchParams.get("codes")?.trim() || null;

  try {
    // Batch resolve: ?codes=32,32.73,32.73.01.1001
    if (codesParam) {
      const codes = codesParam.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20);
      if (codes.length === 0) return NextResponse.json({ data: [] });
      const rows = await prisma.wilayah.findMany({ where: { kode: { in: codes } } });
      const map = new Map(rows.map((r) => [r.kode, r.nama]));
      return NextResponse.json({ data: codes.map((c) => ({ kode: c, nama: map.get(c) ?? null })) });
    }

    // Single kode + chain: untuk prefill form edit
    if (kode) {
      const row = await prisma.wilayah.findUnique({ where: { kode } });
      if (!row) return NextResponse.json({ error: "Kode tidak ditemukan" }, { status: 404 });
      // Ambil chain lengkap: 32 → 32.73 → 32.73.01 → 32.73.01.1001
      const parts = kode.split(".");
      const chain: string[] = [];
      for (let i = 1; i <= parts.length; i++) chain.push(parts.slice(0, i).join("."));
      const chainRows = await prisma.wilayah.findMany({ where: { kode: { in: chain } }, orderBy: { kode: "asc" } });
      return NextResponse.json({ data: row, chain: chainRows });
    }

    // Search mode: ?q=bandung&parent=32 (parent optional untuk scoped search)
    if (q) {
      const where: Record<string, unknown> = {
        nama: { contains: q, mode: "insensitive" },
      };
      if (parent) {
        // Cari di bawah parent saja
        (where as Record<string, unknown>).kode = { startsWith: parent + "." };
      }
      const rows = await prisma.wilayah.findMany({
        where: where as never,
        orderBy: { nama: "asc" },
        take: 30,
      });
      return NextResponse.json({ data: rows });
    }

    // Cascading children mode
    if (parent !== null) {
      // parent = "" atau "0" dianggap root (provinsi)
      if (parent === "" || parent === "0") {
        let rows = await prisma.wilayah.findMany({
          where: { kode: { not: { contains: "." } } },
          orderBy: { nama: "asc" },
        });
        // Hanya provinsi aktif (dikelola /admin/settings)
        const active = await getActiveRegionSets();
        if (active) rows = rows.filter((r) => active.provinces.has(r.kode));
        return NextResponse.json({ data: rows });
      }
      // Anak langsung: kode diawali parent + "." dan depth = parentDepth+1
      const parentDepth = parent.split(".").length;
      const targetDepth = parentDepth + 1;

      // Tentukan panjang kode target berdasarkan depth:
      // depth 1 (prov)   → anak kab/kota: "XX.XX"        = 5 chars
      // depth 2 (kab)    → anak kec:      "XX.XX.XX"     = 8 chars
      // depth 3 (kec)    → anak desa:     "XX.XX.XX.XXXX"= 13 chars
      const kodeLengthMap: Record<number, number> = { 2: 5, 3: 8, 4: 13 };
      const expectedLen = kodeLengthMap[targetDepth];

      if (expectedLen) {
        // Query langsung berdasarkan panjang kode — jauh lebih efisien, no post-filter
        const direct = await prisma.wilayah.findMany({
          where: {
            kode: {
              startsWith: parent + ".",
            },
          },
          orderBy: { nama: "asc" },
        });
        // Filter di aplikasi berdasarkan panjang kode tepat (menghindari kec/desa ikut masuk)
        let result = direct.filter((r) => r.kode.length === expectedLen);
        // Kab/kota hanya yang aktif (dikelola /admin/settings)
        if (expectedLen === 5) {
          const active = await getActiveRegionSets();
          if (active) result = result.filter((r) => active.regencies.has(r.kode));
        }
        return NextResponse.json({ data: result });
      }

      // Fallback untuk struktur kode non-standar
      const candidates = await prisma.wilayah.findMany({
        where: { kode: { startsWith: parent + "." } },
        orderBy: { nama: "asc" },
      });
      const direct = candidates.filter((r) => r.kode.split(".").length === targetDepth);
      return NextResponse.json({ data: direct });
    }

    // Default: daftar provinsi (kode tanpa titik) — hanya yang aktif
    let provinsi = await prisma.wilayah.findMany({
      where: { kode: { not: { contains: "." } } },
      orderBy: { nama: "asc" },
    });
    const active = await getActiveRegionSets();
    if (active) provinsi = provinsi.filter((r) => active.provinces.has(r.kode));
    return NextResponse.json({ data: provinsi });
  } catch (e) {
    console.error("[GET /api/wilayah]", e);
    // Jika tabel belum ada (belum migrate/seed), fallback ramah
    const msg = e instanceof Error ? e.message : "Gagal memuat wilayah";
    if (msg.includes("does not exist") || msg.includes("wilayah")) {
      return NextResponse.json(
        { error: "Tabel wilayah belum ada. Jalankan: npx prisma migrate dev && npm run db:seed:wilayah", data: [] },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
