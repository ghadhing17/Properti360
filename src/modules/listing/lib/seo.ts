/**
 * Helper SEO/URL untuk halaman listing publik.
 * Semua fungsi murni — tidak ada side effect, mudah di-diff untuk verifikasi SEO.
 */

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  if (!base) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function toAbsoluteImage(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return absoluteUrl(url);
}

/** Canonical URL listing publik — absolut jika NEXT_PUBLIC_SITE_URL diset. */
export function listingCanonicalUrl(slug: string): string {
  const base = getSiteUrl();
  return base ? `${base}/listing/${slug}` : `/listing/${slug}`;
}
