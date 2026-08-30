"use client";

import { useEffect, useState, useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

type Wilayah = { kode: string; nama: string };

async function fetchWilayah(parent?: string | null): Promise<Wilayah[]> {
  const url = parent
    ? `/api/wilayah?parent=${encodeURIComponent(parent)}`
    : "/api/wilayah";
  const res = await fetch(url);
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error ?? `Gagal memuat wilayah (${res.status})`);
  }
  const j = await res.json();
  return (j.data ?? []) as Wilayah[];
}

// ── MUI-styled Wilayah Combobox ───────────────────────────────────────────────

function WilayahCombobox({
  label,
  options,
  value,
  onChange,
  disabled,
  placeholder,
  loading,
  error,
  helperText,
}: {
  label: string;
  options: Wilayah[];
  value: string;
  onChange: (kode: string, nama: string) => void;
  disabled?: boolean;
  placeholder?: string;
  loading?: boolean;
  error?: boolean;
  helperText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query
    ? options.filter((o) => o.nama.toLowerCase().includes(query.toLowerCase()))
    : options;

  const selected = options.find((o) => o.kode === value);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Scroll selected into view
  useEffect(() => {
    if (open && listRef.current) {
      const selIdx = filtered.findIndex((o) => o.kode === value);
      if (selIdx >= 0) {
        const items = listRef.current.children;
        if (items[selIdx]) (items[selIdx] as HTMLElement).scrollIntoView({ block: "nearest" });
      }
    }
  }, [open, filtered, value]);

  const isDisabled = disabled || loading;

  return (
    <Box ref={containerRef} sx={{ position: "relative" }}>
      <TextField
        inputRef={inputRef}
        label={label}
        size="small"
        fullWidth
        error={error}
        disabled={isDisabled}
        placeholder={loading ? "Memuat..." : placeholder ?? "Ketik untuk cari..."}
        value={open ? query : selected ? selected.nama : ""}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => { if (!isDisabled) setOpen(true); }}
        onClick={() => { if (!isDisabled) setOpen(true); }}
        slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  {loading ? (
                    <CircularProgress size={14} />
                  ) : (
                    <KeyboardArrowDownIcon
                      sx={{
                        fontSize: 18,
                        color: "text.disabled",
                        transform: open ? "rotate(180deg)" : "none",
                        transition: "transform 0.15s",
                        cursor: isDisabled ? "default" : "pointer",
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        if (!isDisabled) setOpen((v) => !v);
                      }}
                    />
                  )}
                </InputAdornment>
              ),
            },
          }}
        sx={{
          "& .MuiOutlinedInput-root": { borderRadius: 1 },
          "& input": { cursor: isDisabled ? "not-allowed" : "text" },
        }}
      />
      {helperText && (
        <Typography sx={{ fontSize: "0.72rem", color: "error.main", mt: 0.25, ml: 0.5 }}>
          {helperText}
        </Typography>
      )}

      {open && !isDisabled && (
        <Paper
          elevation={4}
          sx={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 1400,
            mt: 0.5,
            maxHeight: 200,
            overflowY: "auto",
            borderRadius: 1,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box component="ul" ref={listRef} sx={{ listStyle: "none", m: 0, p: 0 }}>
            {filtered.length === 0 ? (
              <Box
                component="li"
                sx={{ px: 2, py: 1.5, fontSize: "0.8rem", color: "text.disabled" }}
              >
                Tidak ditemukan
              </Box>
            ) : (
              filtered.map((o) => (
                <Box
                  key={o.kode}
                  component="li"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(o.kode, o.nama);
                    setOpen(false);
                  }}
                  sx={{
                    px: 2,
                    py: 1,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    bgcolor: o.kode === value ? "rgba(29,78,216,0.08)" : "transparent",
                    fontWeight: o.kode === value ? 600 : 400,
                    color: "text.primary",
                    "&:hover": { bgcolor: "rgba(29,78,216,0.06)" },
                  }}
                >
                  {o.nama}
                </Box>
              ))
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
}

// ── AddressFields component ───────────────────────────────────────────────────

export type AddressValue = {
  provinceCode: string;
  provinceName: string;
  regencyCode: string;
  regencyName: string;
  districtCode: string;
  districtName: string;
  villageCode: string;
  villageName: string;
  addressDetail: string;
};

type Props = {
  value: AddressValue;
  onChange: (v: AddressValue) => void;
  fieldErrors?: Record<string, string[]>;
  showErrors?: boolean;
};

export function AddressFields({ value, onChange, fieldErrors, showErrors = false }: Props) {
  const [provinsi, setProvinsi] = useState<Wilayah[]>([]);
  const [kabkota, setKabkota] = useState<Wilayah[]>([]);
  const [kecamatan, setKecamatan] = useState<Wilayah[]>([]);
  const [desa, setDesa] = useState<Wilayah[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Load provinsi on mount
  useEffect(() => {
    setLoading("provinsi");
    fetchWilayah(null)
      .then(setProvinsi)
      .catch((e) => setFetchError(e.message))
      .finally(() => setLoading(null));
  }, []);

  // Load kab/kota when province changes
  useEffect(() => {
    if (!value.provinceCode) {
      setKabkota([]); setKecamatan([]); setDesa([]);
      return;
    }
    setLoading("kabkota");
    setFetchError(null);
    fetchWilayah(value.provinceCode)
      .then(setKabkota)
      .catch((e) => setFetchError(e.message))
      .finally(() => setLoading(null));
  }, [value.provinceCode]);

  // Load kecamatan when regency changes
  useEffect(() => {
    if (!value.regencyCode) {
      setKecamatan([]); setDesa([]);
      return;
    }
    setLoading("kecamatan");
    fetchWilayah(value.regencyCode)
      .then(setKecamatan)
      .catch((e) => setFetchError(e.message))
      .finally(() => setLoading(null));
  }, [value.regencyCode]);

  // Load desa when district changes
  useEffect(() => {
    if (!value.districtCode) {
      setDesa([]);
      return;
    }
    setLoading("desa");
    fetchWilayah(value.districtCode)
      .then(setDesa)
      .catch((e) => setFetchError(e.message))
      .finally(() => setLoading(null));
  }, [value.districtCode]);

  const set = (patch: Partial<AddressValue>) => onChange({ ...value, ...patch });

  // Breadcrumb preview
  const preview = [value.villageName, value.districtName, value.regencyName, value.provinceName]
    .filter(Boolean)
    .join(" › ");

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.5 }}>
        <LocationOnIcon sx={{ fontSize: 16, color: "primary.main" }} />
        <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: "text.primary" }}>
          Lokasi Properti
        </Typography>
      </Box>

      {fetchError && (
        <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 1, fontSize: "0.8rem", py: 0.5 }}>
          {fetchError}
        </Alert>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5, mb: 1.5 }}>
        <WilayahCombobox
          label="Provinsi *"
          options={provinsi}
          value={value.provinceCode}
          loading={loading === "provinsi"}
          placeholder="Pilih provinsi..."
          error={showErrors && !value.provinceCode}
          helperText={showErrors && !value.provinceCode ? "Provinsi wajib dipilih" : undefined}
          onChange={(kode, nama) =>
            set({
              provinceCode: kode, provinceName: nama,
              regencyCode: "", regencyName: "",
              districtCode: "", districtName: "",
              villageCode: "", villageName: "",
            })
          }
        />
        <WilayahCombobox
          label="Kabupaten / Kota *"
          options={kabkota}
          value={value.regencyCode}
          disabled={!value.provinceCode}
          loading={loading === "kabkota"}
          placeholder="Pilih kab/kota..."
          error={showErrors && !!value.provinceCode && !value.regencyCode}
          helperText={showErrors && !!value.provinceCode && !value.regencyCode ? "Kab/Kota wajib dipilih" : undefined}
          onChange={(kode, nama) =>
            set({
              regencyCode: kode, regencyName: nama,
              districtCode: "", districtName: "",
              villageCode: "", villageName: "",
            })
          }
        />
        <WilayahCombobox
          label="Kecamatan *"
          options={kecamatan}
          value={value.districtCode}
          disabled={!value.regencyCode}
          loading={loading === "kecamatan"}
          placeholder="Pilih kecamatan..."
          error={showErrors && !!value.regencyCode && !value.districtCode}
          helperText={showErrors && !!value.regencyCode && !value.districtCode ? "Kecamatan wajib dipilih" : undefined}
          onChange={(kode, nama) =>
            set({
              districtCode: kode, districtName: nama,
              villageCode: "", villageName: "",
            })
          }
        />
        <WilayahCombobox
          label="Kelurahan / Desa *"
          options={desa}
          value={value.villageCode}
          disabled={!value.districtCode}
          loading={loading === "desa"}
          placeholder="Pilih kelurahan..."
          error={showErrors && !!value.districtCode && !value.villageCode}
          helperText={showErrors && !!value.districtCode && !value.villageCode ? "Kelurahan/Desa wajib dipilih" : undefined}
          onChange={(kode, nama) => set({ villageCode: kode, villageName: nama })}
        />
      </Box>

      {/* Preview breadcrumb */}
      {preview && (
        <Box
          sx={{
            px: 1.5,
            py: 1,
            mb: 1.5,
            bgcolor: "rgba(29,78,216,0.05)",
            border: "1px solid rgba(29,78,216,0.12)",
            borderRadius: 1,
          }}
        >
          <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
            {preview}
          </Typography>
        </Box>
      )}

      {/* Alamat lengkap */}
      <TextField
        label="Alamat Lengkap"
        placeholder="Jl. Mawar No. 10, RT 02/RW 05..."
        required
        size="small"
        fullWidth
        multiline
        minRows={2}
        value={value.addressDetail}
        onChange={(e) => set({ addressDetail: e.target.value })}
        error={!!fieldErrors?.address}
        helperText={fieldErrors?.address?.[0] ?? "Nomor jalan, RT/RW, blok, atau patokan"}
        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
      />
    </Box>
  );
}
