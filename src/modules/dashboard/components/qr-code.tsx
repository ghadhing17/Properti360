"use client";

import { useMemo } from "react";

export function QrCode({ url, size = 180 }: { url: string; size?: number }) {
  const src = useMemo(() => {
    const encoded = encodeURIComponent(url);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}`;
  }, [url, size]);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`QR code untuk ${url}`}
        width={size}
        height={size}
        className="rounded-lg border bg-white p-2"
        loading="lazy"
      />
      <p className="max-w-[200px] break-all text-center text-[11px] text-muted">{url}</p>
      <a href={src} download={`qr-${Date.now()}.png`} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary hover:underline">
        Download QR
      </a>
    </div>
  );
}
