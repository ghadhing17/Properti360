import Link from "next/link";
import { LocationOn, ThreeSixty, ArrowForward } from "@mui/icons-material";

type SimilarItem = {
  id: string;
  slug: string;
  title: string;
  city: string;
  priceLabel: string | null;
  thumb: string | null;
  hasTour: boolean;
};

export function SimilarListings({ items, regionLabel }: { items: SimilarItem[]; regionLabel: string }) {
  if (items.length === 0) return null;

  return (
    <section className="border-t border-border bg-surface py-10">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground md:text-2xl">Properti Serupa</h2>
            <p className="mt-1 text-sm text-muted">Listing lain di {regionLabel}</p>
          </div>
        </div>

        <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
          {items.map((s) => (
            <Link
              key={s.id}
              href={`/listing/${s.slug}`}
              className="group w-[240px] shrink-0 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition hover:shadow-md md:w-[260px]"
            >
              <div className="relative aspect-[4/3] bg-background">
                {s.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.thumb}
                    alt={s.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted">No image</div>
                )}
                {s.hasTour && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                    <ThreeSixty sx={{ fontSize: 12 }} />
                    360° Tour
                  </span>
                )}
              </div>
              <div className="p-3.5">
                <p className="line-clamp-1 text-sm font-semibold text-foreground">{s.title}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                  <LocationOn sx={{ fontSize: 13 }} />
                  {s.city}
                </p>
                {s.priceLabel && <p className="mt-1.5 text-sm font-bold text-primary">{s.priceLabel}</p>}
                <span className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  Lihat Tour
                  <ArrowForward sx={{ fontSize: 13 }} className="transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
