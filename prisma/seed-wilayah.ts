/**
 * Seed wilayah Indonesia dari wilayah.sql (Kepmendagri No. 300.2.2-2430 Tahun 2025)
 * ~91k baris data provinsi → desa/kelurahan
 *
 * Cara pakai:
 * 1. Letakkan file wilayah.sql di ./prisma/wilayah.sql atau ./tmp/wilayah/db/wilayah.sql
 * 2. npm run db:seed:wilayah
 *
 * Opsi: WILAYAH_SQL_PATH env untuk path custom.
 */
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CANDIDATE_PATHS = [
  process.env.WILAYAH_SQL_PATH,
  path.join(process.cwd(), "prisma", "wilayah.sql"),
  path.join(process.cwd(), "tmp", "wilayah", "db", "wilayah.sql"),
  path.join(process.cwd(), "..", "wilayah", "db", "wilayah.sql"),
  "C:\\Users\\Ghadhing's PC\\AppData\\Local\\Temp\\opencode\\wilayah\\db\\wilayah.sql",
].filter(Boolean) as string[];

function resolveSqlPath(): string {
  for (const p of CANDIDATE_PATHS) {
    if (fs.existsSync(p)) return p;
  }
    throw new Error(
      `wilayah.sql tidak ditemukan. Letakkan file wilayah.sql di prisma/ atau tmp/wilayah/db/\n` +
        `Atau set WILAYAH_SQL_PATH. Mencari di: ${CANDIDATE_PATHS.join(", ")}`
    );
}

function parseSql(content: string): { kode: string; nama: string }[] {
  // Baris INSERT VALUES: ('11','Aceh'), ('11.01','Kabupaten ...'), ...
  // Escape MySQL: '' untuk '
  const regex = /\('([^']*(?:''[^']*)*)','((?:''|[^'])*)'\)/g;
  const rows: { kode: string; nama: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(content)) !== null) {
    const kode = m[1].replace(/''/g, "'");
    const nama = m[2].replace(/''/g, "'");
    if (kode && nama) rows.push({ kode, nama });
  }
  return rows;
}

async function main() {
  const sqlPath = resolveSqlPath();
  console.log(`[wilayah] Membaca ${sqlPath}`);
  const content = fs.readFileSync(sqlPath, "utf-8");
  const rows = parseSql(content);
  console.log(`[wilayah] Parsed ${rows.length} baris`);

  if (rows.length === 0) throw new Error("Gagal parse — 0 baris. Periksa format wilayah.sql");

  // Validasi distribusi level untuk sanity check
  const byLen = rows.reduce<Record<string, number>>((a, r) => {
    const k = r.kode.split(".").length;
    a[k] = (a[k] ?? 0) + 1;
    return a;
  }, {});
  console.log("[wilayah] Distribusi level (1=prov,2=kab/kota,3=kec,4=desa):", byLen);

  const BATCH = 2000;
  let inserted = 0;
  // Gunakan createMany dengan skipDuplicates agar idempotent (bisa di-run ulang setelah update Kepmendagri)
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const res = await prisma.wilayah.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    inserted += res.count;
    console.log(`[wilayah] batch ${i / BATCH + 1}/${Math.ceil(rows.length / BATCH)} — +${res.count} (total ${inserted})`);
  }

  // Kalau ada baris baru melebihi skipDuplicates, update nama yang berubah (opsional: upsert)
  // Untuk perubahan nama wilayah di Kepmendagri, jalankan update terpisah
  const existingCount = await prisma.wilayah.count();
  console.log(`[wilayah] Selesai. DB sekarang ${existingCount} baris (inserted this run: ${inserted})`);

  // Contoh verifikasi chain
  const sample = await prisma.wilayah.findMany({
    where: { kode: { in: ["32", "32.73", "32.73.01", "32.73.01.1001"] } },
  });
  if (sample.length) console.log("[wilayah] sample chain:", sample.map((s) => `${s.kode}:${s.nama}`).join(" | "));
}

main()
  .catch((e) => {
    console.error("[wilayah] error:", e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
