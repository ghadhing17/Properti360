"use client";

import { useMemo, useState } from "react";
import {
  Flight,
  LocalHospital,
  Mosque,
  Place,
  School,
  ShoppingCart,
  Toll,
  Train,
} from "@mui/icons-material";
import {
  LANDMARK_TABS,
  formatLandmarkDistance,
  type LandmarkCategory,
  type LandmarkTabKey,
  type NearbyPlace,
} from "@/shared/lib/landmarks";

const TAB_ICON: Record<LandmarkTabKey, typeof Train> = {
  TRANSPORT: Train,
  SCHOOL: School,
  MALL: ShoppingCart,
  HEALTH: LocalHospital,
  TOURISM: Place,
  WORSHIP: Mosque,
};

const ROW_ICON: Record<LandmarkCategory, typeof Train> = {
  TOLL: Toll,
  STATION: Train,
  AIRPORT: Flight,
  SCHOOL: School,
  MALL: ShoppingCart,
  HOSPITAL: LocalHospital,
  TOURISM: Place,
  WORSHIP: Mosque,
};

export function LandmarkTabs({ places }: { places: NearbyPlace[] }) {
  const firstWithData = useMemo(
    () =>
      LANDMARK_TABS.find((t) => places.some((p) => t.categories.includes(p.category)))
        ?.key ?? "TRANSPORT",
    [places]
  );
  const [active, setActive] = useState<LandmarkTabKey>(firstWithData);
  const tab = LANDMARK_TABS.find((t) => t.key === active) ?? LANDMARK_TABS[0];

  const items = useMemo(
    () =>
      places
        .filter((p) => tab.categories.includes(p.category))
        .sort((a, b) => a.distanceKm - b.distanceKm),
    [places, tab]
  );

  return (
    <div className="mt-4">
      {/* Tab bar — scroll horizontal; tab terakhir sengaja terpotong sebagai isyarat bisa discroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {LANDMARK_TABS.map((t) => {
          const Icon = TAB_ICON[t.key];
          const count = places.filter((p) => t.categories.includes(p.category)).length;
          const on = t.key === active;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(t.key)}
              className={
                "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors " +
                (on
                  ? "border-primary bg-primary text-white shadow-sm"
                  : "border-border bg-background text-muted hover:border-primary/40 hover:text-primary")
              }
            >
              <Icon sx={{ fontSize: 15 }} />
              {t.label}
              {count > 0 && (
                <span className={"text-[10px] font-bold " + (on ? "text-white/80" : "text-muted/70")}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {items.length > 0 ? (
        <ul className="divide-y divide-border">
          {items.map((p, i) => {
            const Icon = ROW_ICON[p.category];
            return (
              <li key={`${p.category}-${p.name}-${i}`} className="flex items-center justify-between gap-3 py-3.5">
                <p className="min-w-0 truncate text-sm font-medium text-foreground">{p.name}</p>
                <div className="flex shrink-0 items-center gap-4">
                  <span className="flex items-center gap-1 text-sm font-semibold text-primary">
                    <Icon sx={{ fontSize: 16 }} />
                    {p.minutes} menit
                  </span>
                  <span className="flex items-center gap-1 text-sm text-muted">
                    <Place sx={{ fontSize: 14 }} />
                    {formatLandmarkDistance(p.distanceKm)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="py-8 text-center text-sm text-muted">
          Belum ada {tab.label.toLowerCase()} terdeteksi di sekitar properti ini.
        </p>
      )}
    </div>
  );
}
