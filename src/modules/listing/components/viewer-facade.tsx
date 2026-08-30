"use client";

import Link from "next/link";
import { useState, useMemo } from "react";

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

export function ViewerFacade({
  embedCode,
  thumbnailUrl,
  title,
}: {
  embedCode?: string | null;
  thumbnailUrl?: string | null;
  title: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const src = useMemo(() => (embedCode ? extractSrc(embedCode) : null), [embedCode]);

  if (!embedCode || !src) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl border bg-background text-sm text-muted">
        <div className="text-center">
          <p className="font-medium">Tour 360° belum tersedia</p>
          <p className="mt-1 text-xs">Admin belum menambahkan embed Panoee untuk listing ini.</p>
        </div>
      </div>
    );
  }

  if (loaded) {
    return (
      <div className="relative overflow-hidden rounded-xl border bg-black">
        <div className="aspect-video w-full">
          <iframe
            src={src}
            title={`Virtual Tour — ${title}`}
            className="h-full w-full border-0"
            allow="fullscreen; accelerometer; gyroscope; magnetometer"
            loading="lazy"
            allowFullScreen
          />
        </div>
        <Link
          href="/"
          className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-foreground shadow hover:bg-white"
        >
          Virtual Tour by Properti360
        </Link>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-foreground shadow hover:bg-white"
        >
          Buka di tab baru
        </a>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border bg-black">
      <div className="aspect-video w-full bg-foreground/10">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnailUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-white/60">360° Preview</div>
        )}
      </div>
      {/* overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 p-6 text-center">
        <button
          onClick={() => setLoaded(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-primary-dark"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-primary">▶</span>
          Lihat Tour 360°
        </button>
        <p className="mt-3 text-xs text-white/80">Klik untuk memuat virtual tour (lazy load)</p>
      </div>
      <Link
        href="/"
        className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-foreground shadow hover:bg-white"
      >
        Virtual Tour by Properti360
      </Link>
    </div>
  );
}
