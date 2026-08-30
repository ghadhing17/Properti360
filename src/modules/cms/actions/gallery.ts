"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/shared/auth/session";
import { prisma } from "@/shared/lib/db";
import { getStorage, generateThumbnail } from "@/shared/storage";

// ── Constants ────────────────────────────────────────────────────────────
const MAX_PHOTOS_PER_LISTING = 20;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;
const ALLOWED_EXT_MSG = "Format harus JPG/PNG/WebP";

// ── Helpers ──────────────────────────────────────────────────────────────
function assertAllowedMime(mime: string) {
  const lower = mime.toLowerCase().split(";")[0].trim();
  if (!(ALLOWED_MIME as readonly string[]).includes(lower)) {
    throw new Error(`Format tidak didukung (${mime}). ${ALLOWED_EXT_MSG}`);
  }
}

function buildAltText(title: string, order: number, existingAlt?: string | null): string {
  const trimmed = (existingAlt ?? "").trim();
  if (trimmed) return trimmed;
  // order 0-based -> nomor urut 1-based
  return `Foto ${title} ${order + 1}`;
}

// ── Upload ────────────────────────────────────────────────────────────────
export type GalleryActionResult = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  data?: unknown;
};

export async function uploadGalleryPhotos(
  listingId: string,
  formData: FormData
): Promise<GalleryActionResult & { media?: Array<{ id: string; url: string | null; thumbnailUrl: string | null; altText: string | null; order: number }> }> {
  await requireRole("ADMIN");

  try {
    if (!listingId) return { error: "listingId wajib" };

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, title: true },
    });
    if (!listing) return { error: "Listing tidak ditemukan" };

    // Collect files from FormData (key "files" or "file" or any)
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && value.size > 0) {
        // allow keys "files", "file", "photos", etc. — treat any File as gallery photo
        // but skip thumbnail key if someone reuse
        if (key === "thumbnail") continue;
        files.push(value);
      }
    }
    // Also handle getAll("files")
    // dedup if already collected
    const filesFromGetAll = formData.getAll("files").filter((v) => v instanceof File && (v as File).size > 0) as File[];
    for (const f of filesFromGetAll) {
      if (!files.includes(f)) files.push(f);
    }

    if (files.length === 0) return { error: "Tidak ada file yang diupload" };

    // Validasi jumlah maksimal
    const existingCount = await prisma.media.count({
      where: { listingId, type: "PHOTO" },
    });
    if (existingCount + files.length > MAX_PHOTOS_PER_LISTING) {
      return {
        error: `Maksimal ${MAX_PHOTOS_PER_LISTING} foto per listing. Saat ini ${existingCount} foto, mencoba tambah ${files.length} foto.`,
      };
    }

    // Validasi tiap file
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return { error: `File "${file.name}" melebihi 5MB (${(file.size / 1024 / 1024).toFixed(2)}MB)` };
      }
      try {
        assertAllowedMime(file.type);
      } catch (e) {
        return { error: e instanceof Error ? e.message : "Format tidak didukung" };
      }
    }

    const storage = getStorage();

    // Upload sequential to keep order deterministic
    const created: Array<{ id: string; url: string | null; thumbnailUrl: string | null; altText: string | null; order: number }> = [];
    let nextOrder = existingCount; // continue from last

    // For altText generation we need to know if formData has altTexts
    // Accept optional "altTexts" JSON or individual "altText"
    let altTexts: string[] = [];
    const altRaw = formData.get("altTexts");
    if (altRaw && typeof altRaw === "string") {
      try {
        const parsed = JSON.parse(altRaw);
        if (Array.isArray(parsed)) altTexts = parsed.map((s) => String(s ?? ""));
      } catch {
        // ignore
      }
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const buffer = Buffer.from(await file.arrayBuffer());

      // Generate thumbnail via sharp
      let thumbBuffer: Buffer;
      try {
        thumbBuffer = await generateThumbnail(buffer, { maxWidth: 800, quality: 80 });
      } catch (e) {
        console.error("[uploadGallery] sharp fail", e);
        return { error: `Gagal memproses gambar "${file.name}". Pastikan file adalah gambar valid.` };
      }

      // Upload thumbnail (webp). We store same url for url & thumbnailUrl
      const uploadPath = `listings/${listingId}/gallery.webp`;
      const url = await storage.upload(thumbBuffer, uploadPath, "image/webp");

      const order = nextOrder++;
      const providedAlt = altTexts[i] ?? (formData.get(`altText_${i}`) ? String(formData.get(`altText_${i}`)) : null);
      const altText = buildAltText(listing.title, order, providedAlt);

      const media = await prisma.media.create({
        data: {
          listingId,
          type: "PHOTO",
          url,
          thumbnailUrl: url,
          altText,
          order,
        },
        select: { id: true, url: true, thumbnailUrl: true, altText: true, order: true },
      });
      created.push(media);
    }

    revalidatePath(`/admin/listings/${listingId}/edit`);
    revalidatePath(`/listing/[slug]`);
    revalidatePath("/admin/listings");

    return { success: true, media: created };
  } catch (e: unknown) {
    console.error("[uploadGalleryPhotos]", e);
    return { error: e instanceof Error ? e.message : "Gagal upload galeri" };
  }
}

export async function deleteGalleryPhoto(
  listingId: string,
  mediaId: string
): Promise<GalleryActionResult> {
  await requireRole("ADMIN");
  try {
    if (!listingId || !mediaId) return { error: "listingId & mediaId wajib" };

    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) return { error: "Foto tidak ditemukan" };
    if (media.listingId !== listingId) return { error: "Foto tidak termasuk listing ini" };
    if (media.type !== "PHOTO") return { error: "Hanya foto galeri (PHOTO) yang bisa dihapus via endpoint ini" };

    // Delete from storage (best effort)
    const toDelete = [media.url, media.thumbnailUrl].filter(Boolean) as string[];
    const storage = getStorage();
    for (const p of toDelete) {
      try {
        await storage.delete(p);
      } catch (e) {
        console.warn("[deleteGalleryPhoto] storage delete fail", p, e);
      }
    }

    await prisma.media.delete({ where: { id: mediaId } });

    // Optional: normalize order remaining
    const remaining = await prisma.media.findMany({
      where: { listingId, type: "PHOTO" },
      orderBy: { order: "asc" },
      select: { id: true, order: true },
    });
    // Reassign sequential order if gaps
    const ops = remaining.map((m, idx) =>
      m.order !== idx ? prisma.media.update({ where: { id: m.id }, data: { order: idx } }) : null
    );
    await Promise.all(ops.filter(Boolean) as unknown as Promise<unknown>[]);

    revalidatePath(`/admin/listings/${listingId}/edit`);
    revalidatePath("/admin/listings");
    return { success: true };
  } catch (e: unknown) {
    console.error("[deleteGalleryPhoto]", e);
    return { error: e instanceof Error ? e.message : "Gagal hapus foto" };
  }
}

export async function reorderGalleryPhotos(
  listingId: string,
  orderedIds: string[]
): Promise<GalleryActionResult> {
  await requireRole("ADMIN");
  try {
    if (!listingId) return { error: "listingId wajib" };
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) return { error: "orderedIds wajib array" };

    const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { id: true, title: true } });
    if (!listing) return { error: "Listing tidak ditemukan" };

    const medias = await prisma.media.findMany({
      where: { listingId, type: "PHOTO" },
      select: { id: true, order: true },
    });
    const existingIds = new Set(medias.map((m) => m.id));
    // Validate all ids belong to listing
    for (const id of orderedIds) {
      if (!existingIds.has(id)) return { error: `Media ID tidak valid: ${id}` };
    }
    if (orderedIds.length !== medias.length) {
      // Allow partial reorder? But require full set to avoid ambiguity
      // If partial, we still update those provided and keep others at end
      // For strictness, require same length
      return { error: `Jumlah ID tidak cocok. Expected ${medias.length}, got ${orderedIds.length}` };
    }

    // Transactional update
    await prisma.$transaction(
      orderedIds.map((id, idx) =>
        prisma.media.update({ where: { id }, data: { order: idx } })
      )
    );

    revalidatePath(`/admin/listings/${listingId}/edit`);
    return { success: true };
  } catch (e: unknown) {
    console.error("[reorderGalleryPhotos]", e);
    return { error: e instanceof Error ? e.message : "Gagal reorder foto" };
  }
}

export async function updateGalleryPhotoAltText(
  listingId: string,
  mediaId: string,
  altText: string
): Promise<GalleryActionResult> {
  await requireRole("ADMIN");
  try {
    if (!listingId || !mediaId) return { error: "listingId & mediaId wajib" };

    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) return { error: "Foto tidak ditemukan" };
    if (media.listingId !== listingId) return { error: "Foto tidak termasuk listing ini" };
    if (media.type !== "PHOTO") return { error: "Hanya PHOTO yang bisa update altText" };

    const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { title: true } });
    const finalAlt = buildAltText(listing?.title ?? "Properti", media.order, altText);

    await prisma.media.update({ where: { id: mediaId }, data: { altText: finalAlt } });

    revalidatePath(`/admin/listings/${listingId}/edit`);
    return { success: true, data: { altText: finalAlt } };
  } catch (e: unknown) {
    console.error("[updateGalleryPhotoAltText]", e);
    return { error: e instanceof Error ? e.message : "Gagal update alt text" };
  }
}
