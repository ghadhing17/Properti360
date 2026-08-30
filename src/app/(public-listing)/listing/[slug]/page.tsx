import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { Visibility, Person, KingBed, Bathtub, SquareFoot, HomeWork } from "@mui/icons-material";
import { auth } from "@/shared/auth";
import { ViewerFacade } from "@/modules/listing/components/viewer-facade";
import { ListingHeader } from "@/modules/listing/components/listing-header";
import { ShareButtons } from "@/modules/listing/components/share-buttons";
import { GalleryLightbox } from "@/modules/listing/components/gallery-lightbox";
import { ContactCard } from "@/modules/listing/components/contact-card";
import { QuickStatsBar, QuickStat, SpecDetailGrid, buildSpecItems } from "@/modules/listing/components/property-specs";
import { FacilityPills } from "@/modules/listing/components/facility-pills";
import { AccessLandmarksCard } from "@/modules/listing/components/access-landmarks";
import { SimilarListings } from "@/modules/listing/components/similar-listings";
import { getListingBySlug, getSimilarListings, recordListingView } from "@/modules/listing/queries/listing";
import { parseNearbyPlaces } from "@/shared/lib/landmarks";
import { listingCanonicalUrl, toAbsoluteImage, getSiteUrl } from "@/modules/listing/lib/seo";

type Props = { params: Promise<{ slug: string }> };

// 1) generateMetadata — title/description fallback, OG image cover, canonical absolute
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) return { title: "Listing tidak ditemukan" };

  const title = listing.metaTitle?.trim() ? listing.metaTitle : `${listing.title} - Virtual Tour 360° | Properti360`;
  const description = listing.metaDescription?.trim()
    ? listing.metaDescription
    : listing.description.slice(0, 160);

  const canonical = listingCanonicalUrl(listing.slug);
  const thumbRaw =
    listing.media.find((m) => m.thumbnailUrl)?.thumbnailUrl ??
    listing.media.find((m) => m.url)?.url ??
    null;
  const thumb = toAbsoluteImage(thumbRaw);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: thumb ? [{ url: thumb, alt: listing.title }] : undefined,
      type: "article",
      locale: "id_ID",
      siteName: "Properti360",
    },
    twitter: {
      card: thumb ? "summary_large_image" : "summary",
      title,
      description,
      images: thumb ? [thumb] : undefined,
    },
  };
}

export default async function ListingPage({ params }: Props) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) notFound();

  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const userId = (session?.user as { id?: string } | undefined)?.id;

  // 9) DRAFT hanya bisa dilihat owner & ADMIN — selain itu 404 (hindari leak via URL langsung)
  if (listing.status === "DRAFT") {
    const isOwner = userId != null && userId === listing.ownerId;
    const isAdmin = role === "ADMIN";
    if (!isOwner && !isAdmin) notFound();
  }

  // 8) Increment viewCount + ListingViewLog dengan dedup cookie (hindari double count reload cepat)
  // Cookie key per listing, TTL 30 menit. Lazy but awaited agar Set-Cookie terkirim.
  try {
    const cookieStore = await cookies();
    const viewKey = `viewed_${listing.id}`;
    const hasViewed = cookieStore.get(viewKey)?.value === "1";
    if (!hasViewed) {
      // Set cookie terlebih dahulu supaya reload dalam 30 menit tidak double count
      // (httpOnly false agar bisa dibaca client jika perlu, sameSite lax)
      try {
        cookieStore.set(viewKey, "1", {
          maxAge: 60 * 30, // 30 menit
          path: "/",
          httpOnly: false,
          sameSite: "lax",
        });
      } catch {
        // Next.js mungkin throw jika cookies() dipanggil di context yang tidak allow set — ignore
      }

      recordListingView(listing.id);
    }
  } catch {
    // Jangan gagalkan render jika cookies gagal (mis. edge)
    // Fallback: tetap increment tanpa dedup — best effort
    try {
      recordListingView(listing.id);
    } catch {}
  }

  const panoee = listing.media.find((m) => m.type === "PANOEE_TOUR");
  const embedCode = panoee?.panoeeShortcode ?? panoee?.panoeeEmbedUrl ?? null;
  const cover =
    listing.media.find((m) => m.thumbnailUrl)?.thumbnailUrl ??
    listing.media.find((m) => m.url)?.url ??
    null;
  const gallery = listing.media.filter((m) => m.type === "PHOTO");

  const priceLabel =
    listing.price != null
      ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(listing.price)
      : null;

  const regionLabel = listing.regionPath ?? listing.city;
  const statusLabel = listing.statusProperti?.replace("_", " / ") ?? null;

  // 7) Properti Serupa — categoryId SAMA atau regency/city SAMA, exclude self, limit 4, horizontal scroll
  const similar = await getSimilarListings({
    excludeId: listing.id,
    categoryId: listing.categoryId,
    regencyCode: listing.regencyCode,
    city: listing.city,
  });

  const similarItems = similar.map((s) => {
    const thumb = s.media[0]?.thumbnailUrl ?? s.media[0]?.url ?? null;
    return {
      id: s.id,
      slug: s.slug,
      title: s.title,
      city: s.city,
      priceLabel:
        s.price != null
          ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(s.price)
          : null,
      thumb,
      hasTour: s._count.media > 0,
    };
  });

  const canonical = listingCanonicalUrl(listing.slug);

  // 2) JSON-LD structured data — RealEstateListing (fallback Product juga valid, pilih RealEstateListing)
  const coverAbs = toAbsoluteImage(cover);
  const galleryAbs = gallery.map((m) => toAbsoluteImage(m.url ?? m.thumbnailUrl ?? "")).filter(Boolean) as string[];
  const allImages = [coverAbs, ...galleryAbs].filter(Boolean) as string[];

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: listing.title,
    description: (listing.metaDescription ?? listing.description).slice(0, 300),
    url: canonical,
    image: allImages.length > 0 ? allImages : coverAbs ? [coverAbs] : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: listing.address,
      addressLocality: listing.regencyName ?? listing.city,
      addressRegion: listing.provinceName ?? undefined,
      addressCountry: "ID",
    },
    datePublished: listing.createdAt.toISOString(),
    dateModified: listing.updatedAt.toISOString(),
    category: listing.category?.name ?? "",
    ...(priceLabel && listing.price != null
      ? {
          offers: {
            "@type": "Offer",
            price: listing.price,
            priceCurrency: "IDR",
            availability: "https://schema.org/InStock",
            url: canonical,
          },
        }
      : {}),
    provider: {
      "@type": "Organization",
      name: "Properti360",
      url: getSiteUrl() || "https://properti360.id",
    },
  };

  const specItems = buildSpecItems(listing);

  return (
    <div className="bg-background">
      {/* 2) JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* 3) Hero virtual tour full-width — Vistura style (facade lazy load) */}
      <ViewerFacade
        embedCode={embedCode}
        thumbnailUrl={cover}
        title={listing.title}
        categoryName={listing.category?.name ?? null}
        regionLabel={regionLabel}
        statusLabel={statusLabel}
        priceLabel={priceLabel}
      />

      {/* 4) Section info: judul, lokasi, harga, tombol share */}
      <ListingHeader
        title={listing.title}
        address={listing.address}
        regionLabel={regionLabel}
        regionPath={listing.regionPath}
        categoryName={listing.category?.name}
        statusLabel={statusLabel}
        isDraft={listing.status === "DRAFT"}
        priceLabel={priceLabel}
        certificate={listing.sertifikat}
        shareSlot={<ShareButtons url={canonical} title={listing.title} />}
      />

      {/* Two column — Vistura layout */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 md:grid-cols-[13fr_7fr]">
          {/* Left */}
          <div className="space-y-6">
            {/* Quick stats bar — kamar / luas (ala Vistura) */}
            <QuickStatsBar
              items={[
                listing.kamarTidur != null ? (
                  <QuickStat key="kt" icon={<KingBed sx={{ fontSize: 20 }} />} label="Kamar Tidur" value={`${listing.kamarTidur} Kamar`} />
                ) : null,
                listing.kamarMandi != null ? (
                  <QuickStat key="km" icon={<Bathtub sx={{ fontSize: 20 }} />} label="Kamar Mandi" value={`${listing.kamarMandi} Kamar`} />
                ) : null,
                listing.luasTanah ? (
                  <QuickStat key="lt" icon={<SquareFoot sx={{ fontSize: 20 }} />} label="Luas Tanah" value={`${listing.luasTanah} m²`} />
                ) : null,
                listing.luasBangunan ? (
                  <QuickStat key="lb" icon={<HomeWork sx={{ fontSize: 20 }} />} label="Luas Bangunan" value={`${listing.luasBangunan} m²`} />
                ) : null,
              ]}
            />

            {/* 5) Deskripsi */}
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground md:text-xl">Deskripsi Properti</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground/80">{listing.description}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1">
                  <span className="font-medium">{listing.propertyType}</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1">
                  <Visibility sx={{ fontSize: 14 }} /> {listing.viewCount} kali dilihat
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1">
                  <Person sx={{ fontSize: 14 }} /> {listing.owner?.name ?? "—"}
                </span>
              </div>
            </div>

            {/* 5) Galeri foto pendukung — grid responsive + lightbox */}
            {gallery.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground md:text-xl">Galeri Foto</h2>
                <p className="mt-1 text-xs text-muted">Klik foto untuk memperbesar</p>
                <GalleryLightbox photos={gallery} title={listing.title} />
              </div>
            )}

            {/* 6) Spesifikasi detail — grid ikon ala Vistura */}
            {specItems.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground md:text-xl">Spesifikasi Detail</h2>
                <div className="mt-5">
                  <SpecDetailGrid items={specItems} />
                </div>
              </div>
            )}

            {/* 7) Fasilitas & Fitur Utama — pills dengan ikon */}
            {listing.fasilitas && listing.fasilitas.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground md:text-xl">Fasilitas &amp; Fitur Utama</h2>
                <div className="mt-4">
                  <FacilityPills fasilitas={listing.fasilitas} />
                </div>
              </div>
            )}

            {/* 8) Akses & Landmark Sekitar — cache Overpass (muncul saat save dgn koordinat) */}
            {listing.latitude != null &&
              listing.longitude != null &&
              listing.nearbyPlaces != null && (
                <AccessLandmarksCard
                  latitude={listing.latitude}
                  longitude={listing.longitude}
                  places={parseNearbyPlaces(listing.nearbyPlaces)}
                />
              )}
          </div>

          {/* Right sticky — contact card + map */}
          <div className="space-y-4">
            <ContactCard
              listingId={listing.id}
              ownerName={listing.owner?.name}
              ownerPhone={listing.owner?.phone}
              city={listing.city}
              title={listing.title}
            />
          </div>
        </div>
      </section>

      {/* 7) Properti Serupa */}
      <SimilarListings items={similarItems} regionLabel={listing.city} />
    </div>
  );
}
