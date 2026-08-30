"use client";

import { useEffect, useState, useRef } from "react";

type Wilayah = { kode: string; nama: string };

type Props = {
  initialProvince?: string | null;
  initialRegency?: string | null;
  initialDistrict?: string | null;
  initialVillage?: string | null;
  onCityChange?: (city: string) => void;
};

async function fetchWilayah(parent?: string | null): Promise<Wilayah[]> {
  const url = parent ? `/api/wilayah?parent=${encodeURIComponent(parent)}` : "/api/wilayah";
  const res = await fetch(url);
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error ?? `Gagal memuat wilayah (${res.status})`);
  }
  const j = await res.json();
  return (j.data ?? []) as Wilayah[];
}

function WilayahCombobox({
  label,
  options,
  value,
  onChange,
  disabled,
  placeholder,
  loading,
}: {
  label: string;
  options: Wilayah[];
  value: string;
  onChange: (kode: string) => void;
  disabled?: boolean;
  placeholder?: string;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = query
    ? options.filter((o) => o.nama.toLowerCase().includes(query.toLowerCase()) || o.kode.includes(query))
    : options;

  const selected = options.find((o) => o.kode === value);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (open && listRef.current && inputRef.current) {
      const selIdx = filtered.findIndex((o) => o.kode === value);
      if (selIdx >= 0) {
        const items = listRef.current.children;
        if (items[selIdx]) (items[selIdx] as HTMLElement).scrollIntoView({ block: "nearest" });
      }
    }
  }, [open, filtered, value]);

  return (
    <div className="relative">
      <label className="mb-1 block text-xs font-medium text-foreground">{label}</label>
      <input
        ref={inputRef}
        type="text"
        value={open ? query : selected ? `${selected.nama} (${selected.kode})` : ""}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        disabled={disabled || loading}
        placeholder={loading ? "Memuat..." : placeholder ?? "Ketik untuk cari..."}
        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
      />
      {open && !disabled && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-white shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-xs text-muted">Tidak ditemukan</li>
          ) : (
            filtered.map((o) => (
              <li
                key={o.kode}
                onMouseDown={() => {
                  onChange(o.kode);
                  setOpen(false);
                }}
                className={`cursor-pointer px-3 py-2 text-xs hover:bg-primary/10 ${
                  o.kode === value ? "bg-primary/10 font-medium" : ""
                }`}
              >
                {o.nama} <span className="text-muted">({o.kode})</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export function RegionSelect({
  initialProvince = null,
  initialRegency = null,
  initialDistrict = null,
  initialVillage = null,
  onCityChange,
}: Props) {
  const [provinsi, setProvinsi] = useState<Wilayah[]>([]);
  const [kabkota, setKabkota] = useState<Wilayah[]>([]);
  const [kecamatan, setKecamatan] = useState<Wilayah[]>([]);
  const [desa, setDesa] = useState<Wilayah[]>([]);

  const [selProv, setSelProv] = useState<string>(initialProvince ?? "");
  const [selKab, setSelKab] = useState<string>(initialRegency ?? "");
  const [selKec, setSelKec] = useState<string>(initialDistrict ?? "");
  const [selDesa, setSelDesa] = useState<string>(initialVillage ?? "");

  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setLoading("provinsi");
    fetchWilayah(null)
      .then(setProvinsi)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(null));
  }, []);

  useEffect(() => {
    if (!selProv) {
      setKabkota([]);
      setKecamatan([]);
      setDesa([]);
      setSelKab("");
      setSelKec("");
      setSelDesa("");
      return;
    }
    setLoading("kabkota");
    setError(null);
    fetchWilayah(selProv)
      .then((rows) => {
        setKabkota(rows);
        const found = rows.find((r) => r.kode === selKab);
        if (found && onCityChange) onCityChange(found.nama);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(null));
  }, [selProv]);

  useEffect(() => {
    if (!selKab) {
      setKecamatan([]);
      setDesa([]);
      setSelKec("");
      setSelDesa("");
      return;
    }
    setLoading("kecamatan");
    fetchWilayah(selKab)
      .then(setKecamatan)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(null));
  }, [selKab]);

  useEffect(() => {
    if (!selKec) {
      setDesa([]);
      setSelDesa("");
      return;
    }
    setLoading("desa");
    fetchWilayah(selKec)
      .then(setDesa)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(null));
  }, [selKec]);

  useEffect(() => {
    if (initialProvince) setSelProv(initialProvince);
  }, [initialProvince]);
  useEffect(() => {
    if (initialRegency) setSelKab(initialRegency);
  }, [initialRegency]);
  useEffect(() => {
    if (initialDistrict) setSelKec(initialDistrict);
  }, [initialDistrict]);
  useEffect(() => {
    if (initialVillage) setSelDesa(initialVillage);
  }, [initialVillage]);

  function handleProvChange(v: string) {
    setSelProv(v);
    setSelKab("");
    setSelKec("");
    setSelDesa("");
    setKabkota([]);
    setKecamatan([]);
    setDesa([]);
  }
  function handleKabChange(v: string) {
    setSelKab(v);
    setSelKec("");
    setSelDesa("");
    setKecamatan([]);
    setDesa([]);
    const found = kabkota.find((r) => r.kode === v);
    if (found && onCityChange) onCityChange(found.nama);
  }
  function handleKecChange(v: string) {
    setSelKec(v);
    setSelDesa("");
    setDesa([]);
  }

  const regionPathPreview = [
    desa.find((d) => d.kode === selDesa)?.nama,
    kecamatan.find((k) => k.kode === selKec)?.nama,
    kabkota.find((k) => k.kode === selKab)?.nama,
    provinsi.find((p) => p.kode === selProv)?.nama,
  ]
    .filter(Boolean)
    .join(" › ");

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Wilayah</h3>
      <p className="mt-1 text-xs text-muted">
        Pilih provinsi → kab/kota → kecamatan → desa untuk menentukan daerah listing.
      </p>

      {error && (
        <div className="mt-3 rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <WilayahCombobox
          label="Provinsi"
          options={provinsi}
          value={selProv}
          onChange={handleProvChange}
          loading={loading === "provinsi"}
          placeholder="Pilih provinsi..."
        />
        <WilayahCombobox
          label="Kabupaten / Kota"
          options={kabkota}
          value={selKab}
          onChange={handleKabChange}
          disabled={!selProv}
          loading={loading === "kabkota"}
          placeholder="Pilih kab/kota..."
        />
        <WilayahCombobox
          label="Kecamatan"
          options={kecamatan}
          value={selKec}
          onChange={handleKecChange}
          disabled={!selKab}
          loading={loading === "kecamatan"}
          placeholder="Pilih kecamatan..."
        />
        <WilayahCombobox
          label="Desa / Kelurahan"
          options={desa}
          value={selDesa}
          onChange={setSelDesa}
          disabled={!selKec}
          loading={loading === "desa"}
          placeholder="Pilih desa/kel..."
        />
      </div>

      {regionPathPreview && (
        <div className="mt-3 rounded-lg bg-background px-3 py-2">
          <p className="text-[11px] font-medium text-muted">Pratinjau wilayah</p>
          <p className="mt-0.5 text-xs font-medium text-foreground">{regionPathPreview}</p>
        </div>
      )}

      <input type="hidden" name="provinceCode" value={selProv} />
      <input type="hidden" name="regencyCode" value={selKab} />
      <input type="hidden" name="districtCode" value={selKec} />
      <input type="hidden" name="villageCode" value={selDesa} />
      <input type="hidden" name="regionCode" value={selDesa || selKec || selKab || selProv} />

      <p className="mt-3 text-[11px] text-muted">
        Kota akan otomatis diisi dari Kab/Kota terpilih (bisa di-override manual di field Kota).
      </p>
    </div>
  );
}
