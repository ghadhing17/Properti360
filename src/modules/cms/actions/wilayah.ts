"use server";

import { requireRole } from "@/shared/auth/session";
import { getActiveRegionSets } from "@/modules/cms/queries/settings";
import { getWilayahProvinces, getWilayahChildren } from "@/modules/cms/queries/wilayah";
import { pickWilayahMatch } from "@/shared/lib/wilayah-match";

// Nominatim (OpenStreetMap) — gratis tanpa API key. Patuhi usage policy:
// User-Agent jelas + panggilan jarang (hanya saat admin menandai lokasi).
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const NOMINATIM_HEADERS = {
  "User-Agent": "Properti360-CMS/1.0 (admin listing form)",
  "Accept-Language": "id,en;q=0.8",
};

async function nominatimJson<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = `${NOMINATIM_BASE}${path}?${new URLSearchParams(params).toString()}`;
  const res = await fetch(url, {
    headers: NOMINATIM_HEADERS,
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  return (await res.json()) as T;
}

export type ResolveWilayahResult = {
  error?: string;
  warning?: string;
  provinceCode?: string | null;
  provinceName?: string | null;
  regencyCode?: string | null;
  regencyName?: string | null;
  districtCode?: string | null;
  districtName?: string | null;
  villageCode?: string | null;
  villageName?: string | null;
};

// Reverse-geocode koordinat → kode wilayah Kepmendagri (provinsi s/d kelurahan).
// Partial match allowed: level yang tidak dikenali dikembalikan null + warning.
export async function resolveWilayahFromCoords(lat: number, lng: number): Promise<ResolveWilayahResult> {
  await requireRole("ADMIN");

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { error: "Koordinat tidak valid" };
  }

  try {
    const geo = await nominatimJson<{
      country_code?: string;
      address?: Record<string, string>;
    }>("/reverse", {
      format: "jsonv2",
      lat: String(lat),
      lon: String(lng),
      zoom: "14",
      addressdetails: "1",
    });

    const addr = geo.address;
    if (!addr || (geo.country_code && geo.country_code !== "id")) {
      return { error: "Titik berada di luar Indonesia — wilayah tidak bisa disinkronkan otomatis" };
    }

    const out: ResolveWilayahResult = {};
    const active = await getActiveRegionSets();

    let provinces = await getWilayahProvinces();
    if (active) provinces = provinces.filter((r) => active.provinces.has(r.kode));
    const prov = pickWilayahMatch([addr.state], provinces);
    if (!prov) {
      return { error: "Provinsi tidak dikenali dari koordinat ini — silakan pilih wilayah manual" };
    }
    out.provinceCode = prov.kode;
    out.provinceName = prov.nama;

    let kabRows = await getWilayahChildren(prov.kode, 2);
    if (active) kabRows = kabRows.filter((r) => active.regencies.has(r.kode));
    const kab = pickWilayahMatch([addr.county, addr.city, addr.town, addr.municipality], kabRows);
    if (!kab) {
      out.warning = "Kabupaten/Kota tidak dikenali — lengkapi manual";
      return out;
    }
    out.regencyCode = kab.kode;
    out.regencyName = kab.nama;

    // Kecamatan: OSM sering TIDAK punya boundary kecamatan di area pedesaan
    // (hanya mengembalikan village/hamlet). Kalau match langsung gagal,
    // tebak kecamatan dari nama desa di seluruh kab/kota via kode wilayah.
    const kecRows = await getWilayahChildren(kab.kode, 3);
    const desaCandidates = [addr.village, addr.hamlet, addr.suburb, addr.quarter, addr.neighbourhood];
    let kec = pickWilayahMatch(
      [addr.city_district, addr.district, addr.town, addr.municipality, addr.suburb],
      kecRows
    );
    let desa: { kode: string; nama: string } | null = null;

    if (kec) {
      desa = pickWilayahMatch(desaCandidates, await getWilayahChildren(kec.kode, 4));
    } else {
      const guessed = pickWilayahMatch(desaCandidates, await getWilayahChildren(kab.kode, 4));
      if (guessed) {
        desa = guessed;
        kec = kecRows.find((r) => guessed.kode.startsWith(r.kode + ".")) ?? null;
      }
    }

    if (!kec) {
      out.warning = "Kecamatan tidak dikenali — coba klik lebih dekat ke pusat desa, atau cari nama kecamatan di kolom pencarian";
      return out;
    }
    out.districtCode = kec.kode;
    out.districtName = kec.nama;

    if (desa) {
      out.villageCode = desa.kode;
      out.villageName = desa.nama;
    } else {
      out.warning = "Kelurahan/Desa tidak dikenali — coba geser pin lebih dekat ke permukiman";
    }
    return out;
  } catch (e: unknown) {
    console.error("[resolveWilayahFromCoords]", e);
    return { error: "Gagal menghubungi layanan peta — coba lagi atau pilih wilayah manual" };
  }
}

export type PlaceResult = { lat: string; lon: string; label: string };

// Pencarian tempat untuk peta (dibatasi Indonesia).
export async function searchPlaces(q: string): Promise<PlaceResult[]> {
  await requireRole("ADMIN");
  const query = q.trim();
  if (query.length < 3) return [];

  try {
    const rows = await nominatimJson<Array<{ lat: string; lon: string; display_name: string }>>("/search", {
      format: "jsonv2",
      q: query,
      limit: "6",
      countrycodes: "id",
    });
    return rows.map((r) => ({ lat: r.lat, lon: r.lon, label: r.display_name }));
  } catch (e: unknown) {
    console.error("[searchPlaces]", e);
    return [];
  }
}
