"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { PlayArrow, OpenInNew, ThreeSixty } from "@mui/icons-material";

function isUrl(value: string) {
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function extractSrc(embed: string): string | null {
  const trimmed = embed.trim();
  if (!trimmed) return null;
  // jika langsung URL
  if (isUrl(trimmed) && !trimmed.includes("<iframe")) return trimmed;
  // coba parse iframe src
  const match = trimmed.match(/src=["']([^"']+)["']/i);
  if (match) return match[1];
  // panoee shortcode kadang tanpa src — fallback return null
  return null;
}

type ViewerFacadeProps = {
  embedCode?: string | null;
  thumbnailUrl?: string | null;
  title: string;
  categoryName?: string | null;
  regionLabel?: string | null;
  statusLabel?: string | null;
  priceLabel?: string | null;
};

export function ViewerFacade({
  embedCode,
  thumbnailUrl,
  title,
  categoryName,
  regionLabel,
  statusLabel,
  priceLabel,
}: ViewerFacadeProps) {
  const [loaded, setLoaded] = useState(false);
  const src = useMemo(() => (embedCode ? extractSrc(embedCode) : null), [embedCode]);

  if (!embedCode || !src) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 pt-6 md:pt-8">
        <div className="relative w-full overflow-hidden rounded-2xl bg-foreground shadow-lg">
          <div className="relative aspect-[16/10] w-full md:aspect-[21/9]">
            {thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbnailUrl} alt={title} className="h-full w-full object-cover opacity-60" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-[#1e3a8a] to-[#0f172a]" />
            )}
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="rounded-2xl border border-white/20 bg-white/10 px-6 py-5 text-center backdrop-blur-md">
                <ThreeSixty sx={{ fontSize: 40, color: "white" }} className="mx-auto" />
                <p className="mt-2 text-sm font-semibold text-white">Tour 360° belum tersedia</p>
                <p className="mt-1 text-xs text-white/70">
                  Admin belum menambahkan embed Panoee untuk listing ini.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Overlay info panel (breadcrumb + judul) — tampil sebelum & sesudah tour dimuat
  const infoPanel = (
    <div className="absolute left-4 top-4 right-4 z-10 md:left-6 md:top-6 md:right-auto md:max-w-xl">
      <div className="rounded-2xl border border-white/25 bg-black/30 p-4 backdrop-blur-md">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-[11px] font-medium text-white/80">
          <Link href="/" className="transition-colors hover:text-white">
            Beranda
          </Link>
          {categoryName && (
            <>
              <span aria-hidden className="text-white/40">›</span>
              <span>{categoryName}</span>
            </>
          )}
          {regionLabel && (
            <>
              <span aria-hidden className="text-white/40">›</span>
              <span className="line-clamp-1">{regionLabel}</span>
            </>
          )}
        </nav>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <h1 className="text-base font-bold leading-snug text-white md:text-xl">{title}</h1>
          {statusLabel && (
            <span className="rounded-full border border-white/30 bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              {statusLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (loaded) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 pt-6 md:pt-8">
        <div className="relative w-full overflow-hidden rounded-2xl bg-black shadow-lg">
          <div className="relative aspect-[16/10] w-full md:aspect-[21/9]">
            <iframe
              src={src}
              title={`Virtual Tour — ${title}`}
              className="h-full w-full border-0"
              allow="fullscreen; accelerometer; gyroscope; magnetometer"
              loading="lazy"
              allowFullScreen
            />
          </div>
          {infoPanel}
          {priceLabel && (
            <div className="absolute bottom-4 left-4 z-10 rounded-full border border-white/25 bg-black/40 px-4 py-2 text-sm font-bold text-white backdrop-blur-md md:bottom-6 md:left-6">
              {priceLabel}
            </div>
          )}
          <Link
            href="/"
            className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/40 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-md transition-colors hover:bg-black/60 md:bottom-6 md:right-6"
          >
            <ThreeSixty sx={{ fontSize: 14, color: "white" }} />
            Virtual Tour by Properti360
          </Link>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute right-4 top-4 z-10 inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/40 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-md transition-colors hover:bg-black/60 md:right-6 md:top-6"
          >
            <OpenInNew sx={{ fontSize: 14, color: "white" }} />
            Buka di tab baru
          </a>
        </div>
      </section>
    );
  }

  // Facade sebelum di-load — Vistura style: gradient + glass play button + info panel
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-6 md:pt-8">
      <div className="relative w-full overflow-hidden rounded-2xl bg-black shadow-lg">
        <div className="relative aspect-[16/10] w-full md:aspect-[21/9]">
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbnailUrl} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#1e3a8a] to-[#0f172a]" />
          )}
          {/* gradient overlay Vistura: gelap di bawah untuk price chip */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40" />

          {infoPanel}

          {/* tombol play glass — center */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center">
            <button
              onClick={() => setLoaded(true)}
              aria-label="Muat virtual tour 360°"
              className="group inline-flex h-20 w-20 items-center justify-center rounded-full border border-white/40 bg-white/15 backdrop-blur-md transition-all hover:scale-105 hover:bg-white/25 md:h-24 md:w-24"
            >
              <PlayArrow sx={{ fontSize: 44, color: "white" }} />
            </button>
            <p className="mt-3 text-sm font-semibold text-white md:text-base">Lihat Tour 360°</p>
            <p className="mt-1 text-xs text-white/70">Klik untuk memuat virtual tour (lazy load)</p>
          </div>

          {priceLabel && (
            <div className="absolute bottom-4 left-4 z-10 rounded-full border border-white/25 bg-black/40 px-4 py-2 text-sm font-bold text-white backdrop-blur-md md:bottom-6 md:left-6">
              {priceLabel}
            </div>
          )}

          <Link
            href="/"
            className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/40 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-md transition-colors hover:bg-black/60 md:bottom-6 md:right-6"
          >
            <ThreeSixty sx={{ fontSize: 14, color: "white" }} />
            Virtual Tour by Properti360
          </Link>
        </div>
      </div>
    </section>
  );
}
