"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/shared/auth/session";
import { prisma } from "@/shared/lib/db";
import { getStorage, generateThumbnail } from "@/shared/storage";
import { listingDraftSchema, listingPublishSchema } from "@/shared/lib/validations/listing";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // hapus diakritik
    .replace(/[^a-z0-9\s-]/g, "") // hapus karakter aneh
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "listing";
}

async function generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let counter = 1;

  while (true) {
    const existing = await prisma.listing.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) break;
    if (excludeId && existing.id === excludeId) break;
    counter += 1;
    slug = `${base}-${counter}`;
    // safety: hindari loop tak berujung kalau base sudah panjang
    if (counter > 100) {
      slug = `${base}-${Date.now()}`;
      break;
    }
  }
  return slug;
}

function parsePanoeeEmbed(raw: string | null | undefined): { url: string | null; shortcode: string | null } {
  if (!raw) return { url: null, shortcode: null };
  const trimmed = raw.trim();
  if (!trimmed) return { url: null, shortcode: null };
  // Jika terlihat seperti URL (http atau //) atau mengandung <iframe => treat as URL/embed
  // Simpan sebagai panoeeEmbedUrl, shortcode tetap null, atau sebaliknya.
  // Heuristik sederhana: kalau ada "http" atau "<iframe" simpan url, sisanya shortcode.
  if (/https?:\/\//i.test(trimmed) || /<iframe/i.test(trimmed)) {
    // Extract src dari iframe kalau ada
    const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
    if (srcMatch) return { url: srcMatch[1], shortcode: trimmed };
    return { url: trimmed, shortcode: null };
  }
  // Anggap shortcode
  return { url: null, shortcode: trimmed };
}

function toNullableString(v: FormDataEntryValue | null): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

// Resolve nama wilayah dari kode — return map kode->nama, null jika tidak ada
async function resolveWilayah(kodes: (string | null | undefined)[]): Promise<Map<string, string>> {
  const uniq = [...new Set(kodes.filter((k): k is string => !!k && k.trim() !== ""))];
  if (uniq.length === 0) return new Map();
  const rows = await prisma.wilayah.findMany({ where: { kode: { in: uniq } } });
  return new Map(rows.map((r) => [r.kode, r.nama]));
}

function buildRegionPath(names: (string | null | undefined)[]): string | null {
  const parts = names.filter((n): n is string => !!n && n.trim() !== "");
  return parts.length ? parts.join(", ") : null;
}

// Validasi & upload thumbnail — return URL atau null
async function handleThumbnailUpload(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/avif", "image/gif"];
  if (!allowed.includes(file.type)) {
    throw new Error("Format thumbnail harus JPG/PNG/WebP/AVIF/GIF");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Ukuran thumbnail maksimal 5MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const thumbBuffer = await generateThumbnail(buffer, { maxWidth: 800, quality: 80 });
  const storage = getStorage();
  const url = await storage.upload(thumbBuffer, "listings/cover.webp", "image/webp");
  return url;
}

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

export type ActionResult = { success?: boolean; error?: string; fieldErrors?: Record<string, string[]> };

export async function createListing(formData: FormData): Promise<ActionResult> {
  await requireRole("ADMIN");

  try {
    const raw = {
      title: toNullableString(formData.get("title")) ?? "",
      categoryId: toNullableString(formData.get("categoryId")) ?? "",
      address: toNullableString(formData.get("address")) ?? "",
      city: toNullableString(formData.get("city")) ?? "",
      price: toNullableString(formData.get("price")),
      description: toNullableString(formData.get("description")) ?? "",
      panoeeEmbed: toNullableString(formData.get("panoeeEmbed")),
      metaTitle: toNullableString(formData.get("metaTitle")),
      metaDescription: toNullableString(formData.get("metaDescription")),
      ownerId: toNullableString(formData.get("ownerId")) ?? "",
      status: (toNullableString(formData.get("status")) as "DRAFT" | "PUBLISHED") ?? "DRAFT",
      propertyType: (toNullableString(formData.get("propertyType")) as never) ?? "RUMAH",
      provinceCode: toNullableString(formData.get("provinceCode")),
      regencyCode: toNullableString(formData.get("regencyCode")),
      districtCode: toNullableString(formData.get("districtCode")),
      villageCode: toNullableString(formData.get("villageCode")),
      regionCode: toNullableString(formData.get("regionCode")),
      // Detail Primer
      luasTanah: toNullableString(formData.get("luasTanah")),
      luasBangunan: toNullableString(formData.get("luasBangunan")),
      kamarTidur: toNullableString(formData.get("kamarTidur")),
      kamarMandi: toNullableString(formData.get("kamarMandi")),
      lantai: toNullableString(formData.get("lantai")),
      garasi: toNullableString(formData.get("garasi")),
      statusProperti: toNullableString(formData.get("statusProperti")) as never,
      tahunDibangun: toNullableString(formData.get("tahunDibangun")),
      sertifikat: toNullableString(formData.get("sertifikat")) as never,
      hadapRumah: toNullableString(formData.get("hadapRumah")) as never,
      dayaListrik: toNullableString(formData.get("dayaListrik")),
      sumberAir: toNullableString(formData.get("sumberAir")) as never,
      // Fasilitas Sekunder (multiple checkbox → multiple FormData entries)
      fasilitas: formData.getAll("fasilitas").map(String).filter(Boolean) as never,
    };

    // Pilih schema berdasarkan status: DRAFT longgar, PUBLISHED strict
    const isPublish = raw.status === "PUBLISHED";
    const schema = isPublish ? listingPublishSchema : listingDraftSchema;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Data tidak valid",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const data = parsed.data;

    // Validasi FK exist — hanya saat PUBLISHED (DRAFT boleh tanpa kategori/owner)
    if (isPublish) {
      const [category, owner] = await Promise.all([
        data.categoryId ? prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } }) : null,
        data.ownerId ? prisma.user.findUnique({ where: { id: data.ownerId }, select: { id: true, role: true } }) : null,
      ]);
      if (!category) return { error: "Kategori tidak ditemukan" };
      if (!owner) return { error: "Customer tidak ditemukan" };
    } else {
      // DRAFT: validasi FK hanya jika field diisi
      if (data.categoryId) {
        const category = await prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } });
        if (!category) return { error: "Kategori tidak ditemukan" };
      }
      if (data.ownerId) {
        const owner = await prisma.user.findUnique({ where: { id: data.ownerId }, select: { id: true } });
        if (!owner) return { error: "Customer tidak ditemukan" };
      }
    }

    // Resolve nama wilayah & validasi hierarki (parent harus prefix dari child)
    const wilayahMap = await resolveWilayah([
      data.provinceCode,
      data.regencyCode,
      data.districtCode,
      data.villageCode,
      data.regionCode,
    ]);
    for (const k of [data.provinceCode, data.regencyCode, data.districtCode, data.villageCode].filter(Boolean) as string[]) {
      if (!wilayahMap.has(k)) return { error: `Kode wilayah tidak ditemukan: ${k}` };
    }
    if (data.regencyCode && data.provinceCode && !data.regencyCode.startsWith(data.provinceCode + ".")) {
      return { error: "Kabupaten/Kota tidak sesuai dengan Provinsi" };
    }
    if (data.districtCode && data.regencyCode && !data.districtCode.startsWith(data.regencyCode + ".")) {
      return { error: "Kecamatan tidak sesuai dengan Kabupaten/Kota" };
    }
    if (data.villageCode && data.districtCode && !data.villageCode.startsWith(data.districtCode + ".")) {
      return { error: "Desa/Kelurahan tidak sesuai dengan Kecamatan" };
    }

    const provinceName = data.provinceCode ? wilayahMap.get(data.provinceCode!) ?? null : null;
    const regencyName = data.regencyCode ? wilayahMap.get(data.regencyCode!) ?? null : null;
    const districtName = data.districtCode ? wilayahMap.get(data.districtCode!) ?? null : null;
    const villageName = data.villageCode ? wilayahMap.get(data.villageCode!) ?? null : null;

    const resolvedRegionCode = data.villageCode ?? data.districtCode ?? data.regencyCode ?? data.provinceCode ?? data.regionCode ?? null;
    const regionPath = buildRegionPath([villageName, districtName, regencyName, provinceName]);

    let cityValue = data.city;
    if ((!cityValue || cityValue.trim().length < 2) && regencyName) cityValue = regencyName;
    if (!cityValue || cityValue.trim().length < 2) return { error: "Kota wajib diisi (atau pilih wilayah)" };

    const slug = await generateUniqueSlug(data.title);
    const { url: panoeeUrl, shortcode: panoeeCode } = parsePanoeeEmbed(data.panoeeEmbed ?? null);

    const file = formData.get("thumbnail") as File | null;
    let thumbnailUrl: string | null = null;
    if (file && file instanceof File && file.size > 0) {
      thumbnailUrl = await handleThumbnailUpload(file);
    }

    const createPayload = {
      slug,
      title: data.title,
      description: data.description ?? "",
      propertyType: data.propertyType,
      address: data.address ?? "",
      city: cityValue,
      price: data.price,
      status: data.status,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      ...(data.ownerId ? { ownerId: data.ownerId } : {}),
      ...(data.categoryId ? { categoryId: data.categoryId } : {}),
      provinceCode: data.provinceCode ?? null,
      provinceName,
      regencyCode: data.regencyCode ?? null,
      regencyName,
      districtCode: data.districtCode ?? null,
      districtName,
      villageCode: data.villageCode ?? null,
      villageName,
      regionCode: resolvedRegionCode,
      regionPath,
      luasTanah: data.luasTanah ?? null,
      luasBangunan: data.luasBangunan ?? null,
      kamarTidur: data.kamarTidur ?? null,
      kamarMandi: data.kamarMandi ?? null,
      lantai: data.lantai ?? null,
      garasi: data.garasi ?? null,
      statusProperti: data.statusProperti ?? null,
      tahunDibangun: data.tahunDibangun ?? null,
      sertifikat: data.sertifikat ?? null,
      hadapRumah: data.hadapRumah ?? null,
      dayaListrik: data.dayaListrik ?? null,
      sumberAir: data.sumberAir ?? null,
      fasilitas: data.fasilitas ?? [],
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listing = await (prisma.listing.create as any)({ data: createPayload });

    // Buat Media entries untuk thumbnail & panoee (jika ada)
    const mediaCreates: Promise<unknown>[] = [];
    if (thumbnailUrl) {
      mediaCreates.push(
        prisma.media.create({
          data: {
            listingId: listing.id,
            type: "PHOTO",
            url: thumbnailUrl,
            thumbnailUrl: thumbnailUrl,
            altText: data.title,
            order: 0,
          },
        }),
      );
    }
    if (panoeeUrl || panoeeCode) {
      mediaCreates.push(
        prisma.media.create({
          data: {
            listingId: listing.id,
            type: "PANOEE_TOUR",
            panoeeEmbedUrl: panoeeUrl,
            panoeeShortcode: panoeeCode,
            order: thumbnailUrl ? 1 : 0,
          },
        }),
      );
    }
    if (mediaCreates.length) await Promise.all(mediaCreates);

    revalidatePath("/admin/listings");
    revalidatePath("/admin");
    return { success: true };
  } catch (e: unknown) {
    console.error("[createListing]", e);
    const msg = e instanceof Error ? e.message : "Gagal membuat listing";
    return { error: msg };
  }
}

export async function updateListing(id: string, formData: FormData): Promise<ActionResult> {
  await requireRole("ADMIN");

  try {
    const existing = await prisma.listing.findUnique({
      where: { id },
      include: { media: true },
    });
    if (!existing) return { error: "Listing tidak ditemukan" };

    const raw = {
      title: toNullableString(formData.get("title")) ?? "",
      categoryId: toNullableString(formData.get("categoryId")) ?? "",
      address: toNullableString(formData.get("address")) ?? "",
      city: toNullableString(formData.get("city")) ?? "",
      price: toNullableString(formData.get("price")),
      description: toNullableString(formData.get("description")) ?? "",
      panoeeEmbed: toNullableString(formData.get("panoeeEmbed")),
      metaTitle: toNullableString(formData.get("metaTitle")),
      metaDescription: toNullableString(formData.get("metaDescription")),
      ownerId: toNullableString(formData.get("ownerId")) ?? "",
      status: (toNullableString(formData.get("status")) as "DRAFT" | "PUBLISHED") ?? existing.status,
      propertyType: (toNullableString(formData.get("propertyType")) as never) ?? existing.propertyType,
      provinceCode: toNullableString(formData.get("provinceCode")),
      regencyCode: toNullableString(formData.get("regencyCode")),
      districtCode: toNullableString(formData.get("districtCode")),
      villageCode: toNullableString(formData.get("villageCode")),
      regionCode: toNullableString(formData.get("regionCode")),
      // Detail Primer
      luasTanah: toNullableString(formData.get("luasTanah")),
      luasBangunan: toNullableString(formData.get("luasBangunan")),
      kamarTidur: toNullableString(formData.get("kamarTidur")),
      kamarMandi: toNullableString(formData.get("kamarMandi")),
      lantai: toNullableString(formData.get("lantai")),
      garasi: toNullableString(formData.get("garasi")),
      statusProperti: toNullableString(formData.get("statusProperti")) as never,
      tahunDibangun: toNullableString(formData.get("tahunDibangun")),
      sertifikat: toNullableString(formData.get("sertifikat")) as never,
      hadapRumah: toNullableString(formData.get("hadapRumah")) as never,
      dayaListrik: toNullableString(formData.get("dayaListrik")),
      sumberAir: toNullableString(formData.get("sumberAir")) as never,
      fasilitas: formData.getAll("fasilitas").map(String).filter(Boolean) as never,
    };

    // Pilih schema berdasarkan status: DRAFT longgar, PUBLISHED strict
    const isPublishUpdate = raw.status === "PUBLISHED";
    const schemaUpdate = isPublishUpdate ? listingPublishSchema : listingDraftSchema;
    const parsed = schemaUpdate.safeParse(raw);
    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Data tidak valid",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    const data = parsed.data;

    // Validasi FK hanya saat PUBLISHED atau jika field diisi
    if (isPublishUpdate) {
      const [category, owner] = await Promise.all([
        data.categoryId ? prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } }) : null,
        data.ownerId ? prisma.user.findUnique({ where: { id: data.ownerId }, select: { id: true } }) : null,
      ]);
      if (!category) return { error: "Kategori tidak ditemukan" };
      if (!owner) return { error: "Customer tidak ditemukan" };
    } else {
      if (data.categoryId) {
        const category = await prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } });
        if (!category) return { error: "Kategori tidak ditemukan" };
      }
      if (data.ownerId) {
        const owner = await prisma.user.findUnique({ where: { id: data.ownerId }, select: { id: true } });
        if (!owner) return { error: "Customer tidak ditemukan" };
      }
    }

    const wilayahMap = await resolveWilayah([
      data.provinceCode,
      data.regencyCode,
      data.districtCode,
      data.villageCode,
      data.regionCode,
    ]);
    for (const k of [data.provinceCode, data.regencyCode, data.districtCode, data.villageCode].filter(Boolean) as string[]) {
      if (!wilayahMap.has(k)) return { error: `Kode wilayah tidak ditemukan: ${k}` };
    }
    if (data.regencyCode && data.provinceCode && !data.regencyCode.startsWith(data.provinceCode + ".")) {
      return { error: "Kabupaten/Kota tidak sesuai dengan Provinsi" };
    }
    if (data.districtCode && data.regencyCode && !data.districtCode.startsWith(data.regencyCode + ".")) {
      return { error: "Kecamatan tidak sesuai dengan Kabupaten/Kota" };
    }
    if (data.villageCode && data.districtCode && !data.villageCode.startsWith(data.districtCode + ".")) {
      return { error: "Desa/Kelurahan tidak sesuai dengan Kecamatan" };
    }
    const provinceName = data.provinceCode ? wilayahMap.get(data.provinceCode!) ?? null : null;
    const regencyName = data.regencyCode ? wilayahMap.get(data.regencyCode!) ?? null : null;
    const districtName = data.districtCode ? wilayahMap.get(data.districtCode!) ?? null : null;
    const villageName = data.villageCode ? wilayahMap.get(data.villageCode!) ?? null : null;
    const resolvedRegionCode = data.villageCode ?? data.districtCode ?? data.regencyCode ?? data.provinceCode ?? data.regionCode ?? null;
    const regionPath = buildRegionPath([villageName, districtName, regencyName, provinceName]);
    let cityValue = data.city;
    if ((!cityValue || cityValue.trim().length < 2) && regencyName) cityValue = regencyName;
    if (!cityValue || cityValue.trim().length < 2) return { error: "Kota wajib diisi (atau pilih wilayah)" };

    // Regenerate slug hanya jika title berubah
    let slug = existing.slug;
    if (data.title !== existing.title) {
      slug = await generateUniqueSlug(data.title, id);
    }

    const { url: panoeeUrl, shortcode: panoeeCode } = parsePanoeeEmbed(data.panoeeEmbed ?? null);

    // Thumbnail: jika upload baru, replace media PHOTO order 0
    const file = formData.get("thumbnail") as File | null;
    let newThumbnailUrl: string | null = null;
    if (file && file instanceof File && file.size > 0) {
      newThumbnailUrl = await handleThumbnailUpload(file);
    }

    const updatePayload = {
      slug,
      title: data.title,
      description: data.description ?? "",
      propertyType: data.propertyType,
      address: data.address ?? "",
      city: cityValue,
      price: data.price,
      status: data.status,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      ...(data.ownerId ? { ownerId: data.ownerId } : {}),
      ...(data.categoryId ? { categoryId: data.categoryId } : {}),
      provinceCode: data.provinceCode ?? null,
      provinceName,
      regencyCode: data.regencyCode ?? null,
      regencyName,
      districtCode: data.districtCode ?? null,
      districtName,
      villageCode: data.villageCode ?? null,
      villageName,
      regionCode: resolvedRegionCode,
      regionPath,
      luasTanah: data.luasTanah ?? null,
      luasBangunan: data.luasBangunan ?? null,
      kamarTidur: data.kamarTidur ?? null,
      kamarMandi: data.kamarMandi ?? null,
      lantai: data.lantai ?? null,
      garasi: data.garasi ?? null,
      statusProperti: data.statusProperti ?? null,
      tahunDibangun: data.tahunDibangun ?? null,
      sertifikat: data.sertifikat ?? null,
      hadapRumah: data.hadapRumah ?? null,
      dayaListrik: data.dayaListrik ?? null,
      sumberAir: data.sumberAir ?? null,
      fasilitas: data.fasilitas ?? [],
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.listing.update as any)({ where: { id }, data: updatePayload });

    // Upsert media thumbnail
    if (newThumbnailUrl) {
      const existingThumb = existing.media.find((m) => m.type === "PHOTO" && m.order === 0);
      if (existingThumb) {
        // Hapus file lama (best effort)
        if (existingThumb.thumbnailUrl || existingThumb.url) {
          try {
            await getStorage().delete(existingThumb.thumbnailUrl ?? existingThumb.url ?? "");
          } catch {
            // ignore
          }
        }
        await prisma.media.update({
          where: { id: existingThumb.id },
          data: { url: newThumbnailUrl, thumbnailUrl: newThumbnailUrl, altText: data.title },
        });
      } else {
        await prisma.media.create({
          data: {
            listingId: id,
            type: "PHOTO",
            url: newThumbnailUrl,
            thumbnailUrl: newThumbnailUrl,
            altText: data.title,
            order: 0,
          },
        });
      }
    }

    // Upsert panoee media
    if (panoeeUrl !== null || panoeeCode !== null) {
      const existingPanoee = existing.media.find((m) => m.type === "PANOEE_TOUR");
      if (existingPanoee) {
        await prisma.media.update({
          where: { id: existingPanoee.id },
          data: { panoeeEmbedUrl: panoeeUrl, panoeeShortcode: panoeeCode },
        });
      } else {
        await prisma.media.create({
          data: {
            listingId: id,
            type: "PANOEE_TOUR",
            panoeeEmbedUrl: panoeeUrl,
            panoeeShortcode: panoeeCode,
            order: 1,
          },
        });
      }
    } else {
      // Jika field dikosongkan, hapus panoee media
      const existingPanoee = existing.media.find((m) => m.type === "PANOEE_TOUR");
      if (existingPanoee && (raw.panoeeEmbed === null || raw.panoeeEmbed === "")) {
        // Hanya hapus kalau user memang mengosongkan (raw null dari form kosong)
        // Cek apakah form mengirim key panoeeEmbed (bisa jadi kosong string)
        const panoeeRaw = formData.get("panoeeEmbed");
        if (panoeeRaw !== null && String(panoeeRaw).trim() === "") {
          await prisma.media.delete({ where: { id: existingPanoee.id } });
        }
      }
    }

    revalidatePath("/admin/listings");
    revalidatePath(`/admin/listings/${id}/edit`);
    return { success: true };
  } catch (e: unknown) {
    console.error("[updateListing]", e);
    const msg = e instanceof Error ? e.message : "Gagal update listing";
    return { error: msg };
  }
}

export async function deleteListing(id: string): Promise<ActionResult> {
  await requireRole("ADMIN");

  try {
    const existing = await prisma.listing.findUnique({
      where: { id },
      include: { media: true },
    });
    if (!existing) return { error: "Listing tidak ditemukan" };

    // Hapus file dari storage (best effort)
    for (const m of existing.media) {
      const pathToDelete = m.thumbnailUrl ?? m.url;
      if (pathToDelete) {
        try {
          await getStorage().delete(pathToDelete);
        } catch {
          // ignore
        }
      }
    }

    await prisma.listing.delete({ where: { id } });

    revalidatePath("/admin/listings");
    return { success: true };
  } catch (e: unknown) {
    console.error("[deleteListing]", e);
    return { error: e instanceof Error ? e.message : "Gagal menghapus listing" };
  }
}
