import { LocationOn } from "@mui/icons-material";
import type { ReactNode } from "react";

type ListingHeaderProps = {
  title: string;
  address: string;
  regionLabel: string;
  regionPath?: string | null;
  categoryName?: string | null;
  statusLabel?: string | null;
  isDraft: boolean;
  priceLabel?: string | null;
  certificate?: string | null;
  shareSlot?: ReactNode;
};

export function ListingHeader({
  title,
  address,
  regionLabel,
  regionPath,
  categoryName,
  statusLabel,
  isDraft,
  priceLabel,
  certificate,
  shareSlot,
}: ListingHeaderProps) {
  return (
    <section className="border-b border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-5 md:py-6">
        <div className="flex flex-wrap items-center gap-2">
          {categoryName && (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-dark">
              {categoryName}
            </span>
          )}
          {statusLabel && (
            <span className="rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-success">
              {statusLabel}
            </span>
          )}
          {isDraft && (
            <span className="rounded-full bg-warning/10 px-2.5 py-1 text-[11px] font-medium text-warning">
              Draft — hanya owner/admin
            </span>
          )}
        </div>

        {/* Baris 1 — judul | harga: baseline sejajar */}
        <div className="mt-3 flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
          <h1 className="min-w-0 break-words text-2xl font-bold leading-snug text-foreground md:text-3xl">
            {title}
          </h1>
          {priceLabel && (
            <p className="shrink-0 text-xl font-bold text-primary sm:text-right md:text-2xl">
              {priceLabel}
            </p>
          )}
        </div>

        {/* Baris 2 — lokasi | status/sertifikat + share: sejajar atas */}
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <p className="flex items-start gap-1 text-sm text-muted">
              <LocationOn sx={{ fontSize: 18, color: "#64748B", flexShrink: 0, mt: "1px" }} />
              <span className="break-words">
                {address} — {regionLabel}
              </span>
            </p>
            {regionPath && regionPath !== regionLabel && (
              <p className="mt-1 pl-6 text-xs text-muted">Wilayah: {regionPath}</p>
            )}
          </div>

          {(statusLabel || certificate || shareSlot) && (
            <div className="shrink-0 sm:text-right">
              {(statusLabel || certificate) && (
                <p className="text-xs font-medium leading-6 text-muted">
                  {[statusLabel, certificate && `Sertifikat ${certificate}`].filter(Boolean).join(" • ")}
                </p>
              )}
              {shareSlot && <div className="mt-2 flex sm:justify-end">{shareSlot}</div>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
