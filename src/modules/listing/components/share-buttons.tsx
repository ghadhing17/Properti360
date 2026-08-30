"use client";

import { useState } from "react";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      window.prompt("Copy link:", url);
    }
  }

  const wa = `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  return (
    <div className="flex items-center gap-2">
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-xs font-bold text-white hover:opacity-90"
        aria-label="Share ke WhatsApp"
      >
        WA
      </a>
      <a
        href={fb}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1877F2] text-xs font-bold text-white hover:opacity-90"
        aria-label="Share ke Facebook"
      >
        f
      </a>
      <button
        onClick={copy}
        className="inline-flex h-9 items-center rounded-full border border-border bg-white px-3 text-xs font-medium text-foreground hover:bg-background"
      >
        {copied ? "Tersalin!" : "Copy Link"}
      </button>
    </div>
  );
}
