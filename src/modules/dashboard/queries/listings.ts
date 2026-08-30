import { prisma } from "@/shared/lib/db";

/**
 * Data-access layer domain `dashboard` (customer).
 * Halaman app/ tidak boleh memanggil prisma langsung — selalu lewat sini.
 */

// Listing milik owner + agregat ringkas (dipakai /customer dan /customer/listings)
export function getMyListings(ownerId: string) {
  return prisma.listing.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true } },
      media: { where: { type: "PHOTO" }, take: 1, orderBy: { order: "asc" } },
      _count: { select: { leads: true } },
    },
  });
}

export function getMyListingOverview(ownerId: string) {
  return Promise.all([
    prisma.listing.count({ where: { ownerId } }),
    prisma.listing.aggregate({ where: { ownerId }, _sum: { viewCount: true } }),
    prisma.lead.count({
      where: {
        listing: { ownerId },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) },
      },
    }),
  ]);
}

// Listing milik owner (untuk halaman detail /customer/listings/[id])
export async function getOwnedListing(id: string) {
  return prisma.listing.findUnique({
    where: { id },
    include: {
      owner: { select: { name: true, phone: true } },
      category: { select: { name: true } },
      media: { where: { type: "PHOTO" }, orderBy: { order: "asc" } },
      _count: { select: { leads: true } },
    },
  });
}

export function getCustomerProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, phone: true, role: true, createdAt: true },
  });
}
