import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/shared/auth";
import { ViewerFacade } from "@/modules/listing/components/viewer-facade";
import { ShareButtons } from "@/modules/listing/components/share-buttons";
import { ContactForm } from "@/modules/listing/components/contact-form";
import { GalleryLightbox } from "@/modules/listing/components/gallery-lightbox";
import { getListingBySlug, getSimilarListings, recordListingView } from "@/modules/listing/queries/listing";
import { listingCanonicalUrl, getSiteUrl, toAbsoluteImage } from "@/modules/listing/lib/seo";
import { fasilitasLabel, type FasilitasValue } from "@/shared/lib/validations/listing";

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

  // 7) Properti Serupa — categoryId SAMA atau regency/city SAMA, exclude self, limit 4, horizontal scroll
  const similar = await getSimilarListings({
    excludeId: listing.id,
    categoryId: listing.categoryId,
    regencyCode: listing.regencyCode,
    city: listing.city,
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

  return (
    <div className="bg-background">
      {/* 2) JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* 3) Section 360 tour — facade lazy load */}
      <section className="mx-auto max-w-6xl px-4 pt-6">
        <ViewerFacade embedCode={embedCode} thumbnailUrl={cover} title={listing.title} />
        <p className="mt-2 text-center text-[11px] text-muted">
          Konten 360° di-host di Panoee • Teks di sekitar viewer adalah sumber SEO utama
        </p>
      </section>

      {/* 4) Section info: judul, lokasi, harga, tombol share */}
      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-semibold text-primary-dark">
                {listing.category?.name}
              </span>
              <span className="text-xs text-muted">• {listing.regionPath ?? listing.city}</span>
              {listing.status === "DRAFT" && (
                <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                  Draft — hanya owner/admin
                </span>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold leading-tight text-foreground md:text-3xl">{listing.title}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted">
              <span>📍</span> {listing.address} — {listing.regionPath ?? listing.city}
            </p>
            {listing.regionPath && listing.regionPath !== listing.city && (
              <p className="mt-1 text-xs text-muted">
                Wilayah: {listing.regionPath}{" "}
                {listing.regionCode && <span className="font-mono text-[11px]">({listing.regionCode})</span>}
              </p>
            )}
            {priceLabel && <p className="mt-2 text-xl font-bold text-primary">{priceLabel}</p>}
          </div>
          <div className="shrink-0">
            <p className="mb-2 text-xs font-medium text-muted">Bagikan listing ini:</p>
            <ShareButtons url={canonical} title={listing.title} />
          </div>
        </div>
      </section>

      {/* Two column */}
      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="grid gap-6 md:grid-cols-[1.7fr_0.9fr]">
          {/* Left */}
          <div className="space-y-6">
            {/* 5) Deskripsi */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-foreground">Deskripsi Properti</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground/80">{listing.description}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
                <span className="rounded-full border bg-background px-2.5 py-1">{listing.propertyType}</span>
                <span className="rounded-full border bg-background px-2.5 py-1">{listing.viewCount} views</span>
                <span className="rounded-full border bg-background px-2.5 py-1">by {listing.owner?.name ?? "—"}</span>
              </div>
            </div>

            {/* 5) Galeri foto pendukung — grid responsive + lightbox */}
            {gallery.length > 0 && (
              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-foreground">Galeri Foto Pendukung</h2>
                <p className="mt-1 text-xs text-muted">Klik foto untuk memperbesar</p>
                <GalleryLightbox photos={gallery} title={listing.title} />
              </div>
            )}

            {/* 6) Detail Properti */}
            {(listing.luasTanah || listing.luasBangunan || listing.kamarTidur || listing.kamarMandi ||
              listing.lantai || listing.garasi || listing.statusProperti || listing.tahunDibangun ||
              listing.sertifikat || listing.hadapRumah || listing.dayaListrik || listing.sumberAir) && (
              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-foreground">Detail Properti</h2>
                <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                  {[
                    { label: "Status", value: listing.statusProperti?.replace("_", " / ") },
                    { label: "Sertifikat", value: listing.sertifikat },
                    { label: "Luas Tanah", value: listing.luasTanah ? `${listing.luasTanah} m²` : null },
                    { label: "Luas Bangunan", value: listing.luasBangunan ? `${listing.luasBangunan} m²` : null },
                    { label: "Kamar Tidur", value: listing.kamarTidur != null ? `${listing.kamarTidur} kamar` : null },
                    { label: "Kamar Mandi", value: listing.kamarMandi != null ? `${listing.kamarMandi} kamar` : null },
                    { label: "Lantai", value: listing.lantai != null ? `${listing.lantai} lantai` : null },
                    { label: "Garasi/Carport", value: listing.garasi != null ? `${listing.garasi} unit` : null },
                    { label: "Tahun Dibangun", value: listing.tahunDibangun },
                    { label: "Hadap Rumah", value: listing.hadapRumah?.replace(/_/g, " ") },
                    { label: "Daya Listrik", value: listing.dayaListrik ? `${listing.dayaListrik} W` : null },
                    { label: "Sumber Air", value: listing.sumberAir?.replace(/_/g, " ") },
                  ]
                    .filter((d) => d.value != null && d.value !== "")
                    .map((d) => (
                      <div key={d.label} className="flex flex-col">
                        <span className="text-[11px] font-medium uppercase tracking-wide text-muted">{d.label}</span>
                        <span className="mt-0.5 text-sm font-semibold text-foreground">{String(d.value)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 7) Fasilitas */}
            {listing.fasilitas && listing.fasilitas.length > 0 && (
              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-foreground">Fasilitas</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {listing.fasilitas.map((f) => (
                    <span
                      key={f}
                      className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary-dark"
                    >
                      {fasilitasLabel[f as FasilitasValue] ?? f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right sticky */}
          <div className="space-y-4">
            <div className="rounded-xl border bg-white p-6 shadow-sm md:sticky md:top-20">
              {/* 6) Form Hubungi Pemilik — via Server Action */}
              <h3 className="text-sm font-semibold text-foreground">Hubungi Pemilik</h3>
              <p className="mt-1 text-xs text-muted">
                Respon cepat via WhatsApp — pesan masuk ke dashboard pemilik & admin.
              </p>
              <div className="mt-4">
                <ContactForm listingId={listing.id} />
              </div>
              {/* Map embed */}
              <div className="mt-6">
                <p className="mb-2 text-xs font-medium text-foreground">Lokasi</p>
                <div className="overflow-hidden rounded-lg border">
                  <iframe
                    title={`Peta ${listing.title}`}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(listing.address + " " + listing.city)}&z=15&output=embed`}
                    className="h-48 w-full border-0"
                    loading="lazy"
                  />
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.address + " " + listing.city)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
                >
                  Buka di Google Maps →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7) Properti Serupa */}
      {similar.length > 0 && (
        <section className="border-t bg-white py-8">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-base font-semibold text-foreground">Properti Serupa di {listing.regencyName ?? listing.city}</h2>
            <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
              {similar.map((s) => {
                const thumb = s.media[0]?.thumbnailUrl ?? s.media[0]?.url ?? null;
                const price =
                  s.price != null
                    ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(s.price)
                    : null;
                return (
                  <Link
                    key={s.id}
                    href={`/listing/${s.slug}`}
                    className="min-w-[220px] shrink-0 overflow-hidden rounded-xl border bg-background hover:shadow-sm"
                  >
                    <div className="aspect-[4/3] bg-white">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt={s.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted">No image</div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-1 text-xs font-semibold text-foreground">{s.title}</p>
                      {price && <p className="mt-1 text-xs font-bold text-primary">{price}</p>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
