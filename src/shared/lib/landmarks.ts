// ---------------------------------------------------------------------------
// Landmark sekitar properti — sumber data: OpenStreetMap via Overpass API (gratis).
// Dipakai oleh: action CMS (fetch & cache saat save) dan halaman publik (render).
// Murni utilitas — tidak menyentuh prisma / filesystem.
// ---------------------------------------------------------------------------

export type LandmarkCategory =
  | "TOLL"
  | "STATION"
  | "AIRPORT"
  | "SCHOOL"
  | "MALL"
  | "HOSPITAL"
  | "TOURISM"
  | "WORSHIP";

export interface NearbyPlace {
  name: string;
  category: LandmarkCategory;
  lat: number;
  lng: number;
  distanceKm: number; // dibulatkan 1 desimal
  minutes: number; // estimasi waktu tempuh berkendara
}

export const LANDMARK_META: Record<
  LandmarkCategory,
  { label: string; color: string }
> = {
  TOLL: { label: "Gerbang Tol", color: "#DC2626" },
  STATION: { label: "Stasiun", color: "#0891B2" },
  AIRPORT: { label: "Bandara", color: "#1D4ED8" },
  SCHOOL: { label: "Sekolah / Kampus", color: "#CA8A04" },
  MALL: { label: "Pusat Perbelanjaan", color: "#7C3AED" },
  HOSPITAL: { label: "Rumah Sakit", color: "#EA580C" },
  TOURISM: { label: "Tempat Wisata", color: "#16A34A" },
  WORSHIP: { label: "Tempat Ibadah", color: "#0D9488" },
};

// ── Tab kategori untuk tampilan card — urutan = urutan tab
export type LandmarkTabKey = "TRANSPORT" | "SCHOOL" | "MALL" | "HEALTH" | "TOURISM" | "WORSHIP";

export const LANDMARK_TABS: { key: LandmarkTabKey; label: string; categories: LandmarkCategory[] }[] = [
  { key: "TRANSPORT", label: "Transportasi", categories: ["STATION", "TOLL", "AIRPORT"] },
  { key: "SCHOOL", label: "Sekolah", categories: ["SCHOOL"] },
  { key: "MALL", label: "Pusat Perbelanjaan", categories: ["MALL"] },
  { key: "HEALTH", label: "Kesehatan", categories: ["HOSPITAL"] },
  { key: "TOURISM", label: "Wisata", categories: ["TOURISM"] },
  { key: "WORSHIP", label: "Tempat Ibadah", categories: ["WORSHIP"] },
];

const RADIUS_M = 5000;
const MAX_PER_CATEGORY = 3;
const MAX_TOTAL = 24;

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

// ---------------------------------------------------------------------------
// Geometri & estimasi
// ---------------------------------------------------------------------------

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Estimasi kasar waktu tempuh berkendara: rata-rata 25 km/jam + overhead 2 menit. */
function estimateMinutes(km: number): number {
  return Math.max(3, Math.round((km / 25) * 60 + 2));
}

/** Hitung ulang jarak & waktu dari titik properti baru (dipakai saat edit manual/koordinat). */
export function recomputeDistances(
  originLat: number,
  originLng: number,
  places: NearbyPlace[]
): NearbyPlace[] {
  return places.map((p) => {
    const distanceKm = Math.round(haversineKm(originLat, originLng, p.lat, p.lng) * 10) / 10;
    return { ...p, distanceKm, minutes: estimateMinutes(distanceKm) };
  });
}

// ---------------------------------------------------------------------------
// Query Overpass
// ---------------------------------------------------------------------------

function buildQuery(lat: number, lng: number): string {
  const around = `(around:${RADIUS_M},${lat},${lng})`;
  return `[out:json][timeout:25];
(
  nwr["barrier"="toll_gate"]${around};
  nwr["highway"="motorway_junction"]${around};
  nwr["amenity"="hospital"]${around};
  nwr["shop"="mall"]${around};
  nwr["railway"="station"]${around};
  nwr["public_transport"="station"]${around};
  nwr["aeroway"="aerodrome"]${around};
  nwr["amenity"~"^(school|university|college)$"]${around};
  nwr["amenity"="place_of_worship"]${around};
  nwr["tourism"~"^(attraction|museum|theme_park|zoo)$"]${around};
);
out center tags;`;
}

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function categorize(tags: Record<string, string>): LandmarkCategory | null {
  if (tags.barrier === "toll_gate" || tags.highway === "motorway_junction") return "TOLL";
  if (tags.amenity === "hospital") return "HOSPITAL";
  if (tags.shop === "mall") return "MALL";
  if (tags.railway === "station" || tags.public_transport === "station") return "STATION";
  if (tags.aeroway === "aerodrome") return "AIRPORT";
  if (tags.amenity === "school" || tags.amenity === "university" || tags.amenity === "college") return "SCHOOL";
  if (tags.amenity === "place_of_worship") return "WORSHIP";
  if (tags.tourism === "attraction" || tags.tourism === "museum" || tags.tourism === "theme_park" || tags.tourism === "zoo")
    return "TOURISM";
  return null;
}

function resolveName(tags: Record<string, string>, category: LandmarkCategory): string | null {
  const name =
    tags.name?.trim() ||
    tags["name:id"]?.trim() ||
    tags["int_name"]?.trim() ||
    tags["alt_name"]?.trim() ||
    "";
  if (name) return name;
  if (category === "TOLL" && tags.ref?.trim()) return `Gerbang Tol ${tags.ref.trim()}`;
  return null;
}

async function queryOverpass(query: string): Promise<OverpassElement[] | null> {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          // Overpass menolak (406) request tanpa User-Agent yang mengidentifikasi aplikasi
          "User-Agent": "Properti360/1.0 (nearby-landmark lookup; +https://properti360.app)",
          Accept: "application/json",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(25000),
        cache: "no-store",
      });
      if (!res.ok) continue;
      const json = (await res.json()) as { elements?: OverpassElement[] };
      return Array.isArray(json.elements) ? json.elements : [];
    } catch (e) {
      console.error(`[queryOverpass] endpoint ${endpoint} gagal`, e);
    }
  }
  return null;
}

/**
 * Ambil landmark penting dalam radius 5 km dari titik properti.
 * Return `null` jika SEMUA endpoint gagal (caller tidak boleh menimpa cache
 * dengan data kosong akibat gangguan jaringan).
 */
export async function fetchNearbyPlaces(
  lat: number,
  lng: number
): Promise<NearbyPlace[] | null> {
  const elements = await queryOverpass(buildQuery(lat, lng));
  if (elements === null) return null;

  // Map key dedup: kategori + nama (satu mall bisa muncul sebagai node & way)
  const byKey = new Map<string, NearbyPlace>();
  for (const el of elements) {
    const tags = el.tags ?? {};
    const category = categorize(tags);
    if (!category) continue;
    const elLat = el.lat ?? el.center?.lat;
    const elLng = el.lon ?? el.center?.lon;
    if (elLat == null || elLng == null) continue;
    const name = resolveName(tags, category);
    if (!name) continue;

    const distanceKm = Math.round(haversineKm(lat, lng, elLat, elLng) * 10) / 10;
    const place: NearbyPlace = {
      name,
      category,
      lat: elLat,
      lng: elLng,
      distanceKm,
      minutes: estimateMinutes(distanceKm),
    };
    const key = `${category}::${name.toLowerCase()}`;
    const prev = byKey.get(key);
    if (!prev || prev.distanceKm > distanceKm) byKey.set(key, place);
  }

  // Batasi per kategori (terdekat dulu), lalu total keseluruhan
  const perCategory = new Map<LandmarkCategory, NearbyPlace[]>();
  for (const place of [...byKey.values()].sort((a, b) => a.distanceKm - b.distanceKm)) {
    const list = perCategory.get(place.category) ?? [];
    if (list.length >= MAX_PER_CATEGORY) continue;
    list.push(place);
    perCategory.set(place.category, list);
  }

  return [...perCategory.values()]
    .flat()
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, MAX_TOTAL);
}

// ---------------------------------------------------------------------------
// Validasi data tersimpan (kolom Json) — dipakai halaman publik
// ---------------------------------------------------------------------------

const CATEGORIES = new Set<string>(Object.keys(LANDMARK_META));

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function parseNearbyPlaces(value: unknown): NearbyPlace[] {
  if (!Array.isArray(value)) return [];
  const out: NearbyPlace[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    if (
      typeof o.name === "string" &&
      typeof o.category === "string" &&
      CATEGORIES.has(o.category) &&
      isFiniteNumber(o.lat) &&
      isFiniteNumber(o.lng) &&
      isFiniteNumber(o.distanceKm) &&
      isFiniteNumber(o.minutes)
    ) {
      out.push({
        name: o.name,
        category: o.category as LandmarkCategory,
        lat: o.lat,
        lng: o.lng,
        distanceKm: o.distanceKm,
        minutes: o.minutes,
      });
    }
  }
  return out;
}

export function formatLandmarkDistance(km: number): string {
  if (km < 1) return `${Math.max(1, Math.round(km * 1000))} m`;
  return `${km.toFixed(1).replace(".", ",")} km`;
}
