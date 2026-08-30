import {
  LANDMARK_META,
  type LandmarkCategory,
  type NearbyPlace,
} from "@/shared/lib/landmarks";
import { AccessMapLoader } from "./access-map-loader";
import { LandmarkTabs } from "./landmark-tabs";

export function AccessLandmarksCard({
  latitude,
  longitude,
  places,
}: {
  latitude: number;
  longitude: number;
  places: NearbyPlace[];
}) {
  const shownCategories = (Object.keys(LANDMARK_META) as LandmarkCategory[]).filter((c) =>
    places.some((p) => p.category === c)
  );

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground md:text-xl">
        Akses &amp; Landmark Sekitar
      </h2>

      <div className="mt-4 overflow-hidden rounded-xl border border-border">
        <AccessMapLoader latitude={latitude} longitude={longitude} places={places} />
      </div>

      {shownCategories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {shownCategories.map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5 text-xs text-muted">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: LANDMARK_META[c].color }}
              />
              {LANDMARK_META[c].label}
            </span>
          ))}
        </div>
      )}

      <LandmarkTabs places={places} />
    </div>
  );
}
