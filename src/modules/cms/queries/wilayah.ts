import { prisma } from "@/shared/lib/db";
import type { WilayahRow } from "@/shared/lib/wilayah-match";

// Level: 2 = kab/kota, 3 = kecamatan, 4 = desa/kelurahan (jumlah segmen kode)
export function getWilayahProvinces(): Promise<WilayahRow[]> {
  return prisma.wilayah.findMany({
    where: { kode: { not: { contains: "." } } },
    orderBy: { kode: "asc" },
    select: { kode: true, nama: true },
  });
}

export async function getWilayahChildren(parent: string, level: 2 | 3 | 4): Promise<WilayahRow[]> {
  const rows = await prisma.wilayah.findMany({
    where: { kode: { startsWith: parent + "." } },
    orderBy: { kode: "asc" },
    select: { kode: true, nama: true },
  });
  return rows.filter((r) => r.kode.split(".").length === level);
}
