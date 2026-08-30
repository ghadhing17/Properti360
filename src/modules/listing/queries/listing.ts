import { prisma } from "@/shared/lib/db";

/**
 * Data-access layer domain `listing` (halaman publik).
 * Halaman app/ tidak boleh memanggil prisma langsung — selalu lewat sini.
 */

export function getListingBySlug(slug: string) {
  return prisma.listing.findUnique({
    where: { slug },
    include: {
      category: { select: { name: true, slug: true, id: true } },
      owner: { select: { name: true, phone: true } },
      media: { orderBy: { order: "asc" } },
    },
  });
}

// Properti Serupa — categoryId SAMA atau regency/city SAMA, exclude self, limit 4
export function getSimilarListings(input: {
  excludeId: string;
  categoryId: string | null;
  regencyCode: string | null;
  city: string;
}) {
  return prisma.listing
    .findMany({
      where: {
        status: "PUBLISHED",
        id: { not: input.excludeId },
        OR: [
          { categoryId: input.categoryId },
          ...(input.regencyCode
            ? [{ regencyCode: input.regencyCode } as const]
            : [{ city: input.city } as const]),
        ],
      },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        media: { where: { type: "PHOTO" }, take: 1, orderBy: { order: "asc" } },
        _count: { select: { media: { where: { type: "PANOEE_TOUR" } } } },
      },
    })
    .catch(() => []);
}

/**
 * Increment viewCount total + upsert log harian (fire-and-forget).
 * Dedup via cookie ditangani pemanggil (page) — di sini murni pencatatan.
 */
export function recordListingView(listingId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Total view count
  prisma.listing
    .update({ where: { id: listingId }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  // Harian — ListingViewLog upsert (listingId + date unique)
  (prisma as unknown as {
    listingViewLog: { upsert: (args: unknown) => Promise<unknown> };
  }).listingViewLog
    .upsert({
      where: { listingId_date: { listingId, date: today } },
      update: { count: { increment: 1 } },
      create: { listingId, date: today, count: 1 },
    })
    .catch(() => {});
}
