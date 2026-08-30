import { prisma } from "@/shared/lib/db";
import type { Prisma } from "@prisma/client";

/**
 * Data-access layer domain `cms` (admin).
 * Halaman app/ tidak boleh memanggil prisma langsung — selalu lewat sini.
 */

// ── Overview ──────────────────────────────────────────────────────────────
export function getAdminOverview() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  return Promise.all([
    prisma.listing.count(),
    prisma.listing.count({ where: { status: "PUBLISHED" } }),
    prisma.listing.aggregate({ _sum: { viewCount: true } }),
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.listing.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { category: { select: { name: true } }, _count: { select: { leads: true } } },
    }),
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { listing: { select: { title: true, slug: true } } },
    }),
    prisma.listing.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true, viewCount: true },
    }),
    prisma.bookingRequest.count(),
    prisma.bookingRequest.count({ where: { status: "PENDING" } }),
  ]);
}

// ── Bookings ──────────────────────────────────────────────────────────────
export function searchBookings(input: {
  where: Prisma.BookingRequestWhereInput;
  orderBy: Prisma.BookingRequestOrderByWithRelationInput | Prisma.BookingRequestOrderByWithRelationInput[];
  skip: number;
  take: number;
}) {
  return Promise.all([
    prisma.bookingRequest.count({ where: input.where }),
    prisma.bookingRequest.findMany({
      where: input.where,
      orderBy: input.orderBy,
      skip: input.skip,
      take: input.take,
    }),
  ]);
}

export function getBookingById(id: string) {
  return prisma.bookingRequest.findUnique({
    where: { id },
    include: { product: { select: { id: true, name: true, price: true } } },
  });
}

export function getActiveProducts() {
  return prisma.serviceProduct.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: { id: true, name: true, price: true, isPopular: true },
  });
}

// ── Listings ──────────────────────────────────────────────────────────────
export function getAllListingsAdmin() {
  return prisma.listing.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true } },
      media: { where: { type: "PHOTO" }, orderBy: { order: "asc" }, take: 1 },
    },
  });
}

export function getListingForEdit(id: string) {
  return prisma.listing.findUnique({
    where: { id },
    include: {
      media: { where: { type: { in: ["PHOTO", "PANOEE_TOUR"] } }, orderBy: { order: "asc" } },
    },
  });
}

export function getListingFormData() {
  return Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);
}

// ── Categories / Leads / Products ─────────────────────────────────────────
export function getAllCategoriesWithCount() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { listings: true } } },
  });
}

export function getRecentLeads(limit = 50) {
  return prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { listing: { select: { title: true, slug: true } } },
  });
}

export function getAllProductsAdmin() {
  return prisma.serviceProduct.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { bookings: true } } },
  });
}

export function getProductById(id: string) {
  return prisma.serviceProduct.findUnique({ where: { id } });
}
