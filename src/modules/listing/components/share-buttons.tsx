"use client";

import { useState, useEffect, useRef } from "react";
import { Share, WhatsApp, Facebook, Link as LinkIcon, Check } from "@mui/icons-material";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      window.prompt("Copy link:", url);
    }
    setOpen(false);
  }

  // Tutup dropdown saat klik di luar / tekan Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const wa = `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  return (
    <div ref={rootRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Bagikan listing ini"
        className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
      >
        <Share sx={{ fontSize: 16 }} />
        Bagikan
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg md:left-0 md:right-auto"
        >
          <a
            role="menuitem"
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-foreground transition-colors hover:bg-background"
          >
            <WhatsApp sx={{ fontSize: 18, color: "#25D366" }} />
            WhatsApp
          </a>
          <a
            role="menuitem"
            href={fb}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-foreground transition-colors hover:bg-background"
          >
            <Facebook sx={{ fontSize: 18, color: "#1877F2" }} />
            Facebook
          </a>
          <button
            role="menuitem"
            type="button"
            onClick={copy}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-background"
          >
            {copied ? (
              <Check sx={{ fontSize: 18, color: "#16a34a" }} />
            ) : (
              <LinkIcon sx={{ fontSize: 18, color: "#64748b" }} />
            )}
            {copied ? "Tersalin!" : "Copy Link"}
          </button>
        </div>
      )}
    </div>
  );
}
