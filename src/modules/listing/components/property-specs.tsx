import {
  KingBed,
  Bathtub,
  SquareFoot,
  HomeWork,
  Sell,
  Gavel,
  Explore,
  Bolt,
  WaterDrop,
  Stairs,
  DirectionsCar,
  CalendarMonth,
} from "@mui/icons-material";
import type { ReactNode } from "react";

/* ── Quick stats bar (Vistura style: box dengan 4 kolom ikon + label + nilai) ── */

export function QuickStatsBar({ items }: { items: (ReactNode | null)[] }) {
  const visible = items.filter(Boolean);
  if (visible.length === 0) return null;

  return (
    <div
      className={`grid gap-4 rounded-2xl border border-border bg-background p-5 ${
        visible.length >= 4 ? "grid-cols-2 md:grid-cols-4" : `grid-cols-2 md:grid-cols-${visible.length}`
      }`}
    >
      {visible.map((item, i) => (
        <div key={i}>{item}</div>
      ))}
    </div>
  );
}

export function QuickStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

/* ── Spesifikasi detail (grid ikon melingkar ala Vistura) ── */

type SpecItem = {
  label: string;
  value: string;
  icon: ReactNode;
};

export function SpecDetailGrid({ items }: { items: SpecItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((d) => (
        <div key={d.label} className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            {d.icon}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{d.label}</p>
            <p className="text-sm font-semibold text-foreground">{d.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Helper: bangun daftar spec dari field listing (label + value + ikon) ── */

type ListingSpecSource = {
  statusProperti?: string | null;
  sertifikat?: string | null;
  luasTanah?: number | null;
  luasBangunan?: number | null;
  kamarTidur?: number | null;
  kamarMandi?: number | null;
  lantai?: number | null;
  garasi?: number | null;
  tahunDibangun?: string | number | null;
  hadapRumah?: string | null;
  dayaListrik?: number | null;
  sumberAir?: string | null;
};

export function buildSpecItems(listing: ListingSpecSource): SpecItem[] {
  const raw: (SpecItem | null)[] = [
    listing.statusProperti
      ? {
          label: "Status",
          value: listing.statusProperti.replace("_", " / "),
          icon: <Sell sx={{ fontSize: 20 }} />,
        }
      : null,
    listing.sertifikat
      ? { label: "Sertifikat", value: listing.sertifikat, icon: <Gavel sx={{ fontSize: 20 }} /> }
      : null,
    listing.luasTanah
      ? {
          label: "Luas Tanah",
          value: `${listing.luasTanah} m²`,
          icon: <SquareFoot sx={{ fontSize: 20 }} />,
        }
      : null,
    listing.luasBangunan
      ? {
          label: "Luas Bangunan",
          value: `${listing.luasBangunan} m²`,
          icon: <HomeWork sx={{ fontSize: 20 }} />,
        }
      : null,
    listing.kamarTidur != null
      ? {
          label: "Kamar Tidur",
          value: `${listing.kamarTidur} kamar`,
          icon: <KingBed sx={{ fontSize: 20 }} />,
        }
      : null,
    listing.kamarMandi != null
      ? {
          label: "Kamar Mandi",
          value: `${listing.kamarMandi} kamar`,
          icon: <Bathtub sx={{ fontSize: 20 }} />,
        }
      : null,
    listing.lantai != null
      ? {
          label: "Lantai",
          value: `${listing.lantai} lantai`,
          icon: <Stairs sx={{ fontSize: 20 }} />,
        }
      : null,
    listing.garasi != null
      ? {
          label: "Garasi/Carport",
          value: `${listing.garasi} unit`,
          icon: <DirectionsCar sx={{ fontSize: 20 }} />,
        }
      : null,
    listing.tahunDibangun
      ? {
          label: "Tahun Dibangun",
          value: String(listing.tahunDibangun),
          icon: <CalendarMonth sx={{ fontSize: 20 }} />,
        }
      : null,
    listing.hadapRumah
      ? {
          label: "Hadap Rumah",
          value: listing.hadapRumah.replace(/_/g, " "),
          icon: <Explore sx={{ fontSize: 20 }} />,
        }
      : null,
    listing.dayaListrik
      ? {
          label: "Daya Listrik",
          value: `${listing.dayaListrik} W`,
          icon: <Bolt sx={{ fontSize: 20 }} />,
        }
      : null,
    listing.sumberAir
      ? {
          label: "Sumber Air",
          value: listing.sumberAir.replace(/_/g, " "),
          icon: <WaterDrop sx={{ fontSize: 20 }} />,
        }
      : null,
  ];
  return raw.filter((x): x is SpecItem => x !== null);
}
