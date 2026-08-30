"use client";

import { useState, useEffect, useCallback } from "react";

type Photo = { id: string; url: string | null; thumbnailUrl: string | null; altText: string | null };

export function GalleryLightbox({
  photos,
  title,
}: {
  photos: Photo[];
  title: string;
}) {
  const [active, setActive] = useState<number | null>(null);

  const close = useCallback(() => setActive(null), []);
  const next = useCallback(() => {
    if (active === null) return;
    setActive((active + 1) % photos.length);
  }, [active, photos.length]);
  const prev = useCallback(() => {
    if (active === null) return;
    setActive((active - 1 + photos.length) % photos.length);
  }, [active, photos.length]);

  // Keyboard & body scroll lock
  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [active, close, next, prev]);

  if (photos.length === 0) return null;

  return (
    <>
      {/* Grid responsive */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((m, idx) => {
          const src = m.url ?? m.thumbnailUrl ?? "";
          if (!src) return null;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setActive(idx)}
              className="group overflow-hidden rounded-lg border bg-background text-left focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label={`Buka foto ${idx + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={m.altText ?? `${title} — foto ${idx + 1}`}
                className="aspect-[4/3] w-full object-cover transition group-hover:scale-[1.02]"
                loading="lazy"
              />
            </button>
          );
        })}
      </div>

      {/* Lightbox modal */}
      {active !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Lightbox galeri"
        >
          <button
            onClick={close}
            className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-foreground hover:bg-white"
            aria-label="Tutup"
          >
            ✕
          </button>

          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-3 text-foreground hover:bg-white sm:left-4"
                aria-label="Sebelumnya"
              >
                ‹
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-3 text-foreground hover:bg-white sm:right-4"
                aria-label="Berikutnya"
              >
                ›
              </button>
            </>
          )}

          <div
            className="max-h-[85vh] max-w-5xl overflow-hidden rounded-xl bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[active]?.url ?? photos[active]?.thumbnailUrl ?? ""}
              alt={photos[active]?.altText ?? `${title} — foto ${active + 1}`}
              className="max-h-[85vh] max-w-[90vw] object-contain"
            />
            <div className="flex items-center justify-between bg-white px-4 py-2 text-xs">
              <span className="text-muted">
                {active + 1} / {photos.length}
                {photos[active]?.altText ? ` — ${photos[active]?.altText}` : ""}
              </span>
              <span className="text-muted">{title}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
