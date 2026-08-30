import { prisma } from "@/shared/lib/db";

/**
 * Data-access layer domain `landing` (halaman publik marketing).
 * Halaman app/ tidak boleh memanggil prisma langsung — selalu lewat sini.
 * Semua query best-effort: kalau DB gagal, landing tetap tampil (fallback kosong).
 */

// Portofolio listing published untuk landing page (take 6, card ringkas)
export async function getPortfolioListings() {
  try {
    const listings = await prisma.listing.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { media: { where: { type: "PHOTO" }, take: 1, orderBy: { order: "asc" } } },
    });
    return listings.map((l) => ({
      slug: l.slug,
      title: l.title,
      city: l.city,
      price: l.price,
      thumbnail: l.media[0]?.thumbnailUrl ?? l.media[0]?.url ?? null,
    }));
  } catch {
    return null;
  }
}

// Produk layanan aktif (dipakai landing pricing & halaman booking — query identik)
export async function getActiveServiceProducts() {
  try {
    return await prisma.serviceProduct.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        features: true,
        isPopular: true,
      },
    });
  } catch {
    return [];
  }
}

// Artikel blog published (maks 12 terbaru)
export async function getPublishedBlogPosts() {
  try {
    return await prisma.blogPost.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
      take: 12,
      select: { slug: true, title: true, coverImage: true, publishedAt: true },
    });
  } catch {
    return [];
  }
}

// Kategori untuk navigasi footer/header (nama + slug saja)
export async function getNavCategories() {
  try {
    return await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { name: true, slug: true },
    });
  } catch {
    return [];
  }
}
