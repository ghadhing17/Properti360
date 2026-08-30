"use client";

import { useState, useTransition, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { createListing, updateListing } from "@/modules/cms/actions/listings";
import { resolveWilayahFromCoords } from "@/modules/cms/actions/wilayah";
import { PhotoGallery } from "@/modules/cms/components/photo-gallery";
import { LandmarkEditor } from "@/modules/cms/components/landmark-editor";
import { parseNearbyPlaces } from "@/shared/lib/landmarks";
import { fasilitasValues, fasilitasLabel, getPublishMissingFields, type FasilitasValue, publishRequiredFields } from "@/shared/lib/validations/listing";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import MuiSelect from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import FormHelperText from "@mui/material/FormHelperText";
import Button from "@mui/material/Button";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Badge from "@mui/material/Badge";
import CircularProgress from "@mui/material/CircularProgress";
import PlaceIcon from "@mui/icons-material/Place";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LinkIcon from "@mui/icons-material/Link";
import TitleIcon from "@mui/icons-material/Title";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import SearchIcon from "@mui/icons-material/Search";
import DescriptionIcon from "@mui/icons-material/Description";
import TuneIcon from "@mui/icons-material/Tune";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import PublicIcon from "@mui/icons-material/Public";

// Leaflet butuh window — render hanya di client
const MapPicker = dynamic(
  () => import("@/modules/cms/components/map-picker").then((m) => m.MapPicker),
  {
    ssr: false,
    loading: () => (
      <Box sx={{ height: 320, borderRadius: 1, border: "1px solid #E2E8F0", bgcolor: "#F8FAFC" }} />
    ),
  }
);

type Category = { id: string; name: string };
type Customer = { id: string; name: string; email: string };

type InitialData = {
  id?: string;
  title: string;
  categoryId: string;
  address: string;
  city: string;
  price: number | null;
  description: string;
  panoeeEmbed: string;
  metaTitle: string;
  metaDescription: string;
  ownerId: string;
  status: "DRAFT" | "PUBLISHED";
  propertyType: string;
  thumbnailUrl?: string | null;
  // Wilayah
  provinceCode?: string | null;
  regencyCode?: string | null;
  districtCode?: string | null;
  villageCode?: string | null;
  regionPath?: string | null;
  // Detail Primer
  luasTanah?: number | null;
  luasBangunan?: number | null;
  kamarTidur?: number | null;
  kamarMandi?: number | null;
  lantai?: number | null;
  garasi?: number | null;
  statusProperti?: string | null;
  nego?: boolean | null;
  periodeSewa?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  tahunDibangun?: number | null;
  sertifikat?: string | null;
  hadapRumah?: string | null;
  dayaListrik?: number | null;
  sumberAir?: string | null;
  // Fasilitas Sekunder
  fasilitas?: string[];
  // Landmark (cache Overpass + flag manual) — untuk editor CRUD
  nearbyPlaces?: unknown;
  nearbyPlacesManual?: boolean | null;
};

type GalleryPhoto = {
  id: string;
  url: string | null;
  thumbnailUrl: string | null;
  altText: string | null;
  order: number;
};

const TABS = [
  { label: "Informasi Dasar", icon: <TitleIcon sx={{ fontSize: 16 }} /> },
  { label: "Wilayah", icon: <LocationOnIcon sx={{ fontSize: 16 }} /> },
  { label: "Detail & Fasilitas", icon: <TuneIcon sx={{ fontSize: 16 }} /> },
  { label: "Deskripsi", icon: <DescriptionIcon sx={{ fontSize: 16 }} /> },
  { label: "Media & Tour", icon: <PhotoLibraryIcon sx={{ fontSize: 16 }} /> },
  { label: "SEO & Publikasi", icon: <PublicIcon sx={{ fontSize: 16 }} /> },
];

// Pemetaan field → tab (indeks = nomor tab). Sumber tunggal untuk badge error,
// auto-navigate saat submit gagal, dan pre-check publish.
const TAB_FIELDS: string[][] = [
  ["title", "categoryId", "propertyType", "address", "city", "price"],
  ["provinceCode", "regencyCode", "districtCode", "villageCode", "latitude", "longitude"],
  ["luasTanah", "luasBangunan", "kamarTidur", "kamarMandi", "lantai", "garasi", "statusProperti", "nego", "periodeSewa", "tahunDibangun", "sertifikat", "hadapRumah", "dayaListrik", "sumberAir"],
  ["description"],
  [],
  ["metaTitle", "metaDescription", "ownerId"],
];

export function ListingForm({
  mode,
  categories,
  customers,
  initial,
  galleryPhotos,
}: {
  mode: "create" | "edit";
  categories: Category[];
  customers: Customer[];
  initial?: InitialData;
  galleryPhotos?: GalleryPhoto[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [activeTab, setActiveTab] = useState(0);
  const [customerQuery, setCustomerQuery] = useState("");
  const [panoeeValue, setPanoeeValue] = useState(initial?.panoeeEmbed ?? "");
  const [status, setStatus] = useState<InitialData["status"]>(initial?.status ?? "DRAFT");
  const [statusPropertiValue, setStatusPropertiValue] = useState<InitialData["statusProperti"]>(initial?.statusProperti ?? "");
  const [coords, setCoords] = useState({
    lat: initial?.latitude != null ? String(initial.latitude) : "",
    lng: initial?.longitude != null ? String(initial.longitude) : "",
  });
  const [regionCodes, setRegionCodes] = useState({
    provinceCode: initial?.provinceCode ?? "",
    regencyCode: initial?.regencyCode ?? "",
    districtCode: initial?.districtCode ?? "",
    villageCode: initial?.villageCode ?? "",
  });
  const [regionNames, setRegionNames] = useState<{
    province: string | null;
    regency: string | null;
    district: string | null;
    village: string | null;
  }>({ province: null, regency: null, district: null, village: null });
  const [regionSyncMsg, setRegionSyncMsg] = useState<{ severity: "success" | "warning"; text: string } | null>(null);
  const [resolvingRegion, setResolvingRegion] = useState(false);
  const syncSeq = useRef(0);

  // Sumber tunggal wilayah = peta: setiap titik lokasi ditentukan (klik / geser pin /
  // cari / ketik koordinat), Provinsi s/d Kelurahan otomatis mengikuti hasil geocode.
  async function syncRegionFromCoords(latStr: string, lngStr: string) {
    const lat = Number(latStr.replace(/,/g, "."));
    const lng = Number(lngStr.replace(/,/g, "."));
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return;

    const seq = ++syncSeq.current;
    setResolvingRegion(true);
    try {
      const res = await resolveWilayahFromCoords(lat, lng);
      if (seq !== syncSeq.current) return; // respons basi — sudah ada aksi terbaru
      if (res.error) {
        setRegionSyncMsg({ severity: "warning", text: res.error });
        return;
      }
      if (!res.provinceCode) {
        setRegionSyncMsg({ severity: "warning", text: "Wilayah tidak dikenali dari koordinat ini — coba geser pin lebih dekat ke lokasi" });
        return;
      }
      setRegionCodes({
        provinceCode: res.provinceCode ?? "",
        regencyCode: res.regencyCode ?? "",
        districtCode: res.districtCode ?? "",
        villageCode: res.villageCode ?? "",
      });
      setRegionNames({
        province: res.provinceName ?? null,
        regency: res.regencyName ?? null,
        district: res.districtName ?? null,
        village: res.villageName ?? null,
      });
      if (res.regencyName) setCityValue(res.regencyName);
      const parts = [res.provinceName, res.regencyName, res.districtName, res.villageName].filter(Boolean).join(" › ");
      setRegionSyncMsg({
        severity: res.warning ? "warning" : "success",
        text: `Wilayah mengikuti peta: ${parts}${res.warning ? ` — ${res.warning}` : ""}`,
      });
    } catch (e: unknown) {
      console.error("[syncRegionFromCoords]", e);
      if (seq !== syncSeq.current) return;
      setRegionSyncMsg({ severity: "warning", text: "Gagal menyinkronkan wilayah dari peta — periksa koneksi lalu coba lagi" });
    } finally {
      if (seq === syncSeq.current) setResolvingRegion(false);
    }
  }
  const [titleValue, setTitleValue] = useState(initial?.title ?? "");
  const [cityValue, setCityValue] = useState(initial?.city ?? "");
  const [fasilitas, setFasilitas] = useState<string[]>(initial?.fasilitas ?? []);
  const [metaDescValue, setMetaDescValue] = useState(initial?.metaDescription ?? "");

  const filteredCustomers = useMemo(
    () => customers.filter(
      (c) =>
        c.name.toLowerCase().includes(customerQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(customerQuery.toLowerCase())
    ),
    [customers, customerQuery]
  );

  const slugPreview = useMemo(() => {
    const base = (titleValue ?? "").trim() || "judul-properti";
    return base.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 60);
  }, [titleValue]);

  const previewSrc = useMemo(() => {
    if (!panoeeValue) return null;
    const m = panoeeValue.match(/src=["']([^"']+)["']/i);
    if (m) return m[1];
    if (/^https?:\/\//.test(panoeeValue.trim())) return panoeeValue.trim();
    return null;
  }, [panoeeValue]);

  // Tab badge — tandai tab yang punya field error
  const tabErrors = useMemo(
    () => TAB_FIELDS.map((keys) => keys.some((k) => fieldErrors[k]?.length)),
    [fieldErrors]
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const formData = new FormData(e.currentTarget);
    formData.set("status", status);

    // Pre-check publish di client: beri tahu field wajib yang belum diisi
    // tanpa round-trip server (validasi server tetap jadi penjaga terakhir).
    if (status === "PUBLISHED") {
      const missing = getPublishMissingFields(formData);
      if (missing.length > 0) {
        setFieldErrors(Object.fromEntries(missing.map((m) => [m.field, [m.message]])));
        setError(
          `Belum bisa dipublikasikan — field wajib belum diisi: ${missing.map((m) => m.label).join(", ")}. ` +
            "Tab dengan tanda merah berisi field yang perlu dilengkapi."
        );
        const tabIdx = TAB_FIELDS.findIndex((keys) => keys.includes(missing[0].field));
        if (tabIdx >= 0) setActiveTab(tabIdx);
        return;
      }
    }

    startTransition(async () => {
      const res = mode === "create" ? await createListing(formData) : await updateListing(initial!.id!, formData);
      if (res.error) {
        setError(res.error);
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
          // Auto-navigate ke tab pertama yang punya error
          const errKeys = Object.keys(res.fieldErrors);
          const tabIdx = TAB_FIELDS.findIndex((keys) => keys.some((k) => errKeys.includes(k)));
          if (tabIdx >= 0) setActiveTab(tabIdx);
        }
        return;
      }
      router.push("/admin/listings");
      router.refresh();
    });
  }

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 1,
      bgcolor: "white",
      "& fieldset": { borderColor: "#E2E8F0" },
      "&:hover fieldset": { borderColor: "#CBD5E1" },
      "&.Mui-focused fieldset": { borderColor: "#1D4ED8", borderWidth: 2 },
    },
    "& .MuiInputLabel-root": { fontSize: "0.85rem" },
    "& .MuiInputBase-input": { fontSize: "0.875rem" },
  };

  const tabContentSx = (idx: number) => ({
    display: activeTab === idx ? "block" : "none",
  });

  // Helper: apakah field ini wajib saat PUBLISHED?
  const isPublish = status === "PUBLISHED";
  const req = (field: string) =>
    isPublish && (publishRequiredFields as readonly string[]).includes(field);
  // Label suffix untuk field wajib publish
  const lbl = (label: string, field: string) =>
    req(field) ? `${label} *` : label;

  return (
    <Box component="form" onSubmit={handleSubmit} encType="multipart/form-data">
      {/* Top action bar */}
      <Box
        sx={{
          mx: -3,
          mt: -3,
          mb: 0,
          px: 3,
          py: 1.5,
          bgcolor: "white",
          borderBottom: "1px solid #E2E8F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0F172A" }}>
            {mode === "create" ? "Listing Baru" : "Edit Listing"}
          </Typography>
          <Typography variant="caption" sx={{ color: "#94A3B8" }}>
            Lengkapi tiap tab • paste embed Panoee • upload galeri
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <ToggleButtonGroup
            value={status}
            exclusive
            onChange={(_, v) => v && setStatus(v)}
            size="small"
            sx={{ "& .MuiToggleButton-root": { borderRadius: "4px !important", px: 2, py: 0.5, fontSize: "0.75rem", fontWeight: 600, textTransform: "none", border: "1px solid #E2E8F0" } }}
          >
            <ToggleButton value="DRAFT"
              sx={{ "&.Mui-selected": { bgcolor: "rgba(245,158,11,0.12)", color: "#F59E0B", borderColor: "rgba(245,158,11,0.3)" } }}>
              Draft
            </ToggleButton>
            <ToggleButton value="PUBLISHED"
              sx={{ "&.Mui-selected": { bgcolor: "rgba(22,163,74,0.12)", color: "#16A34A", borderColor: "rgba(22,163,74,0.3)" } }}>
              Published
            </ToggleButton>
          </ToggleButtonGroup>

          <Button variant="outlined" size="small" startIcon={<CloseIcon sx={{ fontSize: 15 }} />}
            onClick={() => router.push("/admin/listings")}
            sx={{ borderColor: "#E2E8F0", color: "#64748B", borderRadius: 1, fontSize: "0.78rem", "&:hover": { bgcolor: "#F8FAFC" } }}>
            Batal
          </Button>

          <Button type="submit" variant="contained" size="small" disabled={pending}
            startIcon={<SaveIcon sx={{ fontSize: 15 }} />}
            sx={{ bgcolor: "#1D4ED8", "&:hover": { bgcolor: "#1E3A8A" }, borderRadius: 1, fontSize: "0.78rem" }}>
            {pending ? "Menyimpan..." : "Simpan"}
          </Button>
        </Box>
      </Box>

      {/* Tab bar */}
      <Box sx={{ borderBottom: "1px solid #E2E8F0", bgcolor: "#FAFAFA", mx: -3, px: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTab-root": {
              fontSize: "0.78rem",
              fontWeight: 500,
              textTransform: "none",
              minHeight: 44,
              color: "#64748B",
              gap: 0.5,
            },
            "& .Mui-selected": { color: "#1D4ED8", fontWeight: 700 },
            "& .MuiTabs-indicator": { bgcolor: "#1D4ED8", height: 2 },
          }}
        >
          {TABS.map((t, i) => (
            <Tab
              key={t.label}
              label={
                <Badge
                  color="error"
                  variant="dot"
                  invisible={!tabErrors[i]}
                  sx={{ "& .MuiBadge-dot": { top: -2, right: -4 } }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    {t.icon}
                    {t.label}
                  </Box>
                </Badge>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* Error alert */}
      {error && (
        <Alert severity="error" sx={{ mt: 3, mb: 0, borderRadius: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Info banner: field wajib saat PUBLISHED */}
      {isPublish && (
        <Alert severity="info" icon={<CheckCircleOutlineIcon sx={{ fontSize: 18 }} />}
          sx={{ mt: 3, mb: 0, borderRadius: 1, border: "1px solid rgba(29,78,216,0.2)", bgcolor: "rgba(239,246,255,0.8)" }}>
          <strong>Mode Published</strong> — Field bertanda <strong>*</strong> wajib diisi sebelum listing bisa live:
          Judul, Kategori, Alamat, Kota, Harga, Deskripsi, Status Properti, Customer/Pemilik.
        </Alert>
      )}

      {/* Hidden status */}
      <input type="hidden" name="status" value={status} />

      {/* ── TAB 0: Informasi Dasar ── */}
      <Box sx={{ ...tabContentSx(0), pt: 3 }}>
        <Paper elevation={0} sx={{ borderRadius: 1, border: "1px solid #E2E8F0", p: 3 }}>
          <Stack spacing={2.5}>
            <TextField
              name="title"
              label="Judul Properti *"
              defaultValue={initial?.title ?? ""}
              onChange={(e) => setTitleValue(e.target.value)}
              required
              fullWidth
              placeholder="Contoh: Villa Mewah 3 Lantai di Jakarta Selatan"
              error={!!fieldErrors.title}
              helperText={
                fieldErrors.title?.[0] ??
                <span>Slug: <code style={{ background: "#F1F5F9", padding: "1px 4px", borderRadius: 4 }}>/listing/{slugPreview}</code></span>
              }
              sx={inputSx}
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth error={!!fieldErrors.categoryId} sx={inputSx}>
                  <InputLabel sx={{ fontSize: "0.85rem" }}>{lbl("Kategori", "categoryId")}</InputLabel>
                  <MuiSelect name="categoryId" defaultValue={initial?.categoryId ?? ""} label={lbl("Kategori", "categoryId")} required={req("categoryId")}>
                    <MenuItem value="" disabled><em>-- Pilih Kategori --</em></MenuItem>
                    {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </MuiSelect>
                  {fieldErrors.categoryId && <FormHelperText>{fieldErrors.categoryId[0]}</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth sx={inputSx}>
                  <InputLabel sx={{ fontSize: "0.85rem" }}>Tipe Properti</InputLabel>
                  <MuiSelect name="propertyType" defaultValue={initial?.propertyType ?? "RUMAH"} label="Tipe Properti">
                    {["RUMAH","APARTEMEN","HOTEL","RUKO","VENUE","LAINNYA"].map((t) => (
                      <MenuItem key={t} value={t}>{t}</MenuItem>
                    ))}
                  </MuiSelect>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              name="address"
              label={lbl("Alamat Lengkap", "address")}
              defaultValue={initial?.address ?? ""}
              required={req("address")}
              fullWidth
              placeholder="Jl. Contoh No. 123, Kebayoran Baru"
              error={!!fieldErrors.address}
              helperText={fieldErrors.address?.[0]}
              sx={inputSx}
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  name="city"
                  label={lbl("Kota", "city")}
                  value={cityValue}
                  onChange={(e) => setCityValue(e.target.value)}
                  required={req("city")}
                  fullWidth
                  placeholder="Otomatis dari Kab/Kota di tab Wilayah"
                  error={!!fieldErrors.city}
                  helperText={fieldErrors.city?.[0] ?? "Terisi otomatis saat pilih Kab/Kota di tab Wilayah."}
                  sx={inputSx}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  name="price"
                  label={lbl("Harga", "price") + (isPublish ? "" : " (opsional)")}
                  type="number"
                  slotProps={{ htmlInput: { min: 0, step: 1 }, input: { startAdornment: <InputAdornment position="start"><Typography variant="caption" sx={{ color: "#94A3B8" }}>Rp</Typography></InputAdornment> } }}
                  defaultValue={initial?.price ?? ""}
                  required={req("price")}
                  fullWidth
                  placeholder={isPublish ? "Wajib diisi untuk publish" : "Kosongkan jika tidak pakai harga"}
                  error={!!fieldErrors.price}
                  helperText={fieldErrors.price?.[0]}
                  sx={inputSx}
                />
              </Grid>
            </Grid>
          </Stack>
        </Paper>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button variant="contained" size="small" onClick={() => setActiveTab(1)}
            sx={{ bgcolor: "#1D4ED8", "&:hover": { bgcolor: "#1E3A8A" }, borderRadius: 1, fontSize: "0.78rem" }}>
            Lanjut: Wilayah →
          </Button>
        </Box>
      </Box>

      {/* ── TAB 1: Wilayah (sumber: peta) ── */}
      <Box sx={{ ...tabContentSx(1), pt: 3 }}>
        <Paper elevation={0} sx={{ borderRadius: 1, border: "1px solid #E2E8F0", p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <PlaceIcon sx={{ color: "#1D4ED8", fontSize: 20 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0F172A" }}>Wilayah &amp; Lokasi pada Peta</Typography>
              <Typography variant="caption" sx={{ color: "#94A3B8" }}>
                Tentukan titik lokasi via peta — Provinsi s/d Kelurahan otomatis mengikuti, tanpa pilih manual
              </Typography>
            </Box>
          </Box>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 7 }}>
              <MapPicker
                latitude={coords.lat}
                longitude={coords.lng}
                onChange={(lat, lng) => {
                  setCoords({ lat, lng });
                  void syncRegionFromCoords(lat, lng);
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Stack spacing={2}>
                <TextField
                  name="latitude"
                  label="Latitude"
                  value={coords.lat}
                  onChange={(e) => setCoords((c) => ({ ...c, lat: e.target.value }))}
                  onBlur={() => void syncRegionFromCoords(coords.lat, coords.lng)}
                  fullWidth
                  slotProps={{ htmlInput: { inputMode: "decimal", placeholder: "-6.2088" } }}
                  error={!!fieldErrors.latitude}
                  helperText={fieldErrors.latitude?.[0] ?? "Rentang -90 s/d 90"}
                  sx={inputSx}
                />
                <TextField
                  name="longitude"
                  label="Longitude"
                  value={coords.lng}
                  onChange={(e) => setCoords((c) => ({ ...c, lng: e.target.value }))}
                  onBlur={() => void syncRegionFromCoords(coords.lat, coords.lng)}
                  fullWidth
                  slotProps={{ htmlInput: { inputMode: "decimal", placeholder: "106.8456" } }}
                  error={!!fieldErrors.longitude}
                  helperText={fieldErrors.longitude?.[0] ?? "Rentang -180 s/d 180"}
                  sx={inputSx}
                />
                {resolvingRegion && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={14} />
                    <Typography variant="caption" sx={{ color: "#64748B" }}>Menyinkronkan wilayah dari peta...</Typography>
                  </Box>
                )}
                {regionSyncMsg && (
                  <Alert
                    severity={regionSyncMsg.severity}
                    onClose={() => setRegionSyncMsg(null)}
                    sx={{ borderRadius: 1, py: 0.25, fontSize: "0.75rem", alignItems: "center" }}
                  >
                    {regionSyncMsg.text}
                  </Alert>
                )}
                <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: "#94A3B8", fontSize: "0.67rem" }}>
                    WILAYAH (OTOMATIS DARI PETA)
                  </Typography>
                  {regionNames.province ? (
                    <Stack spacing={0.25} sx={{ mt: 0.75 }}>
                      {[
                        ["Provinsi", regionNames.province],
                        ["Kabupaten / Kota", regionNames.regency],
                        ["Kecamatan", regionNames.district],
                        ["Kelurahan / Desa", regionNames.village],
                      ].map(([label, value]) => (
                        <Box key={label} sx={{ display: "flex", gap: 1, alignItems: "baseline" }}>
                          <Typography variant="caption" sx={{ color: "#64748B", minWidth: 110 }}>{label}</Typography>
                          <Typography variant="caption" sx={{ color: "#0F172A", fontWeight: value ? 600 : 400 }}>
                            {value ?? "belum dikenali"}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  ) : initial?.regionPath ? (
                    <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "#64748B" }}>
                      Wilayah tersimpan: <strong>{initial.regionPath}</strong>
                      {" — "}tentukan titik di peta untuk menggantinya
                    </Typography>
                  ) : (
                    <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "#94A3B8" }}>
                      Belum ditentukan — klik peta atau cari lokasi untuk mengisi wilayah.
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Grid>
          </Grid>

          {/* Kode wilayah — murni hasil geocode peta, ikut ter-submit */}
          <input type="hidden" name="provinceCode" value={regionCodes.provinceCode} />
          <input type="hidden" name="regencyCode" value={regionCodes.regencyCode} />
          <input type="hidden" name="districtCode" value={regionCodes.districtCode} />
          <input type="hidden" name="villageCode" value={regionCodes.villageCode} />
          <input
            type="hidden"
            name="regionCode"
            value={regionCodes.villageCode || regionCodes.districtCode || regionCodes.regencyCode || regionCodes.provinceCode}
          />

          <Divider sx={{ my: 2.5 }} />

          <LandmarkEditor
            latitude={coords.lat}
            longitude={coords.lng}
            initialPlaces={parseNearbyPlaces(initial?.nearbyPlaces)}
          />
        </Paper>
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
          <Button variant="outlined" size="small" onClick={() => setActiveTab(0)}
            sx={{ borderColor: "#E2E8F0", color: "#64748B", borderRadius: 1, fontSize: "0.78rem" }}>
            ← Kembali
          </Button>
          <Button variant="contained" size="small" onClick={() => setActiveTab(2)}
            sx={{ bgcolor: "#1D4ED8", "&:hover": { bgcolor: "#1E3A8A" }, borderRadius: 1, fontSize: "0.78rem" }}>
            Lanjut: Detail & Fasilitas →
          </Button>
        </Box>
      </Box>

      {/* ── TAB 2: Detail & Fasilitas ── */}
      <Box sx={{ ...tabContentSx(2), pt: 3 }}>
        <Paper elevation={0} sx={{ borderRadius: 1, border: "1px solid #E2E8F0", p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
            <HomeWorkIcon sx={{ color: "#1D4ED8", fontSize: 20 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0F172A" }}>Detail Properti</Typography>
              <Typography variant="caption" sx={{ color: "#94A3B8" }}>
                {isPublish ? "Status Properti wajib diisi untuk publish — sisanya opsional" : "Informasi teknis — semua opsional"}
              </Typography>
            </Box>
          </Box>
          <Stack spacing={2.5}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth error={!!fieldErrors.statusProperti} sx={inputSx}>
                  <InputLabel>{lbl("Status Properti", "statusProperti")}</InputLabel>
                  <MuiSelect
                    name="statusProperti"
                    value={statusPropertiValue ?? ""}
                    onChange={(e) => setStatusPropertiValue(e.target.value)}
                    label={lbl("Status Properti", "statusProperti")}
                    required={req("statusProperti")}
                  >
                    <MenuItem value="">-- Pilih --</MenuItem>
                    <MenuItem value="DIJUAL">Dijual</MenuItem>
                    <MenuItem value="DISEWA">Disewa</MenuItem>
                    <MenuItem value="DIJUAL_DISEWA">Dijual / Disewa</MenuItem>
                  </MuiSelect>
                  {fieldErrors.statusProperti && <FormHelperText>{fieldErrors.statusProperti[0]}</FormHelperText>}
                </FormControl>
              </Grid>
              {(statusPropertiValue === "DIJUAL" || statusPropertiValue === "DIJUAL_DISEWA") && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={<Checkbox name="nego" defaultChecked={initial?.nego ?? false} />}
                    label="Nego"
                    sx={{ height: 56, m: 0, "& .MuiFormControlLabel-label": { fontSize: "0.8rem", color: "#0F172A" } }}
                  />
                </Grid>
              )}
              {(statusPropertiValue === "DISEWA" || statusPropertiValue === "DIJUAL_DISEWA") && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth sx={inputSx}>
                    <InputLabel>Periode Sewa</InputLabel>
                    <MuiSelect name="periodeSewa" defaultValue={initial?.periodeSewa ?? ""} label="Periode Sewa">
                      <MenuItem value="">-- Pilih --</MenuItem>
                      <MenuItem value="BULANAN">Bulanan</MenuItem>
                      <MenuItem value="TAHUNAN">Tahunan</MenuItem>
                      <MenuItem value="BULANAN_DAN_TAHUNAN">Bulanan dan Tahunan</MenuItem>
                    </MuiSelect>
                  </FormControl>
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth sx={inputSx}>
                  <InputLabel>Sertifikat</InputLabel>
                  <MuiSelect name="sertifikat" defaultValue={initial?.sertifikat ?? ""} label="Sertifikat">
                    <MenuItem value="">-- Pilih --</MenuItem>
                    {["SHM","HGB","SHP","SHSRS","GIRIK","LAINNYA"].map(v => (
                      <MenuItem key={v} value={v}>{v}</MenuItem>
                    ))}
                  </MuiSelect>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField name="luasTanah" label="Luas Tanah (m²)" type="number" defaultValue={initial?.luasTanah ?? ""} fullWidth slotProps={{ htmlInput: { min: 0 } }} sx={inputSx} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField name="luasBangunan" label="Luas Bangunan (m²)" type="number" defaultValue={initial?.luasBangunan ?? ""} fullWidth slotProps={{ htmlInput: { min: 0 } }} sx={inputSx} />
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <TextField name="kamarTidur" label="K. Tidur" type="number" defaultValue={initial?.kamarTidur ?? ""} fullWidth slotProps={{ htmlInput: { min: 0 } }} sx={inputSx} />
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <TextField name="kamarMandi" label="K. Mandi" type="number" defaultValue={initial?.kamarMandi ?? ""} fullWidth slotProps={{ htmlInput: { min: 0 } }} sx={inputSx} />
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <TextField name="lantai" label="Lantai" type="number" defaultValue={initial?.lantai ?? ""} fullWidth slotProps={{ htmlInput: { min: 0 } }} sx={inputSx} />
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <TextField name="garasi" label="Garasi/Carport" type="number" defaultValue={initial?.garasi ?? ""} fullWidth slotProps={{ htmlInput: { min: 0 } }} sx={inputSx} />
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <TextField name="tahunDibangun" label="Tahun Dibangun" type="number" defaultValue={initial?.tahunDibangun ?? ""} fullWidth slotProps={{ htmlInput: { min: 1900, max: 2100 } }} sx={inputSx} />
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <TextField name="dayaListrik" label="Daya Listrik (W)" type="number" defaultValue={initial?.dayaListrik ?? ""} fullWidth slotProps={{ htmlInput: { min: 0 } }} sx={inputSx} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth sx={inputSx}>
                  <InputLabel>Hadap Rumah</InputLabel>
                  <MuiSelect name="hadapRumah" defaultValue={initial?.hadapRumah ?? ""} label="Hadap Rumah">
                    <MenuItem value="">-- Pilih --</MenuItem>
                    {[
                      ["UTARA","Utara"],["SELATAN","Selatan"],["TIMUR","Timur"],["BARAT","Barat"],
                      ["TIMUR_LAUT","Timur Laut"],["BARAT_LAUT","Barat Laut"],
                      ["TIMUR_SELATAN","Timur Selatan"],["BARAT_SELATAN","Barat Selatan"],
                    ].map(([v,l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
                  </MuiSelect>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth sx={inputSx}>
                  <InputLabel>Sumber Air</InputLabel>
                  <MuiSelect name="sumberAir" defaultValue={initial?.sumberAir ?? ""} label="Sumber Air">
                    <MenuItem value="">-- Pilih --</MenuItem>
                    <MenuItem value="PDAM">PDAM</MenuItem>
                    <MenuItem value="SUMUR">Sumur</MenuItem>
                    <MenuItem value="SUMUR_BOR">Sumur Bor</MenuItem>
                    <MenuItem value="LAINNYA">Lainnya</MenuItem>
                  </MuiSelect>
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ borderColor: "#F1F5F9" }} />

            {/* Fasilitas */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "#0F172A", display: "block", mb: 1.5, fontSize: "0.8rem" }}>
                Fasilitas {fasilitas.length > 0 && <Chip label={fasilitas.length} size="small" sx={{ ml: 1, height: 18, fontSize: "0.7rem", bgcolor: "#1D4ED8", color: "#fff" }} />}
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {fasilitasValues.map((f) => {
                  const checked = fasilitas.includes(f);
                  return (
                    <Chip
                      key={f}
                      label={fasilitasLabel[f as FasilitasValue]}
                      onClick={() =>
                        setFasilitas((prev) =>
                          checked ? prev.filter((x) => x !== f) : [...prev, f]
                        )
                      }
                      variant={checked ? "filled" : "outlined"}
                      size="small"
                      sx={{
                        cursor: "pointer",
                        borderColor: checked ? "#1D4ED8" : "#E2E8F0",
                        bgcolor: checked ? "#1D4ED8" : "transparent",
                        color: checked ? "#fff" : "#64748B",
                        fontWeight: checked ? 600 : 400,
                        "&:hover": { bgcolor: checked ? "#1E3A8A" : "#F1F5F9" },
                      }}
                    />
                  );
                })}
              </Box>
              {fasilitas.map((f) => (
                <input key={f} type="hidden" name="fasilitas" value={f} />
              ))}
            </Box>
          </Stack>
        </Paper>
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
          <Button variant="outlined" size="small" onClick={() => setActiveTab(1)}
            sx={{ borderColor: "#E2E8F0", color: "#64748B", borderRadius: 1, fontSize: "0.78rem" }}>
            ← Kembali
          </Button>
          <Button variant="contained" size="small" onClick={() => setActiveTab(3)}
            sx={{ bgcolor: "#1D4ED8", "&:hover": { bgcolor: "#1E3A8A" }, borderRadius: 1, fontSize: "0.78rem" }}>
            Lanjut: Deskripsi →
          </Button>
        </Box>
      </Box>

      {/* ── TAB 3: Deskripsi ── */}
      <Box sx={{ ...tabContentSx(3), pt: 3 }}>
        <Paper elevation={0} sx={{ borderRadius: 1, border: "1px solid #E2E8F0", p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
            <DescriptionIcon sx={{ color: "#1D4ED8", fontSize: 20 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0F172A" }}>Deskripsi Properti</Typography>
              <Typography variant="caption" sx={{ color: "#94A3B8" }}>Tulis deskripsi kaya keyword lokasi/jenis — sumber SEO utama</Typography>
            </Box>
          </Box>
          <TextField
            name="description"
            label={lbl("Deskripsi", "description")}
            defaultValue={initial?.description ?? ""}
            required={req("description")}
            fullWidth
            multiline
            rows={10}
            placeholder="Deskripsi lengkap properti — lokasi strategis, spesifikasi, lingkungan sekitar..."
            error={!!fieldErrors.description}
            helperText={fieldErrors.description?.[0] ?? (isPublish ? "Wajib diisi minimal 10 karakter untuk publish" : "Opsional saat draft")}
            sx={inputSx}
          />
        </Paper>
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
          <Button variant="outlined" size="small" onClick={() => setActiveTab(2)}
            sx={{ borderColor: "#E2E8F0", color: "#64748B", borderRadius: 1, fontSize: "0.78rem" }}>
            ← Kembali
          </Button>
          <Button variant="contained" size="small" onClick={() => setActiveTab(4)}
            sx={{ bgcolor: "#1D4ED8", "&:hover": { bgcolor: "#1E3A8A" }, borderRadius: 1, fontSize: "0.78rem" }}>
            Lanjut: Media & Tour →
          </Button>
        </Box>
      </Box>

      {/* ── TAB 4: Media & Tour ── */}
      <Box sx={{ ...tabContentSx(4), pt: 3 }}>
        <Stack spacing={3}>
          {/* Virtual Tour */}
          <Paper elevation={0} sx={{ borderRadius: 1, border: "1px solid #E2E8F0", p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
              <TravelExploreIcon sx={{ color: "#1D4ED8", fontSize: 20 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0F172A" }}>Virtual Tour (Panoee)</Typography>
                <Typography variant="caption" sx={{ color: "#94A3B8" }}>Paste shortcode atau URL embed dari dashboard Panoee</Typography>
              </Box>
            </Box>

            <TextField
              name="panoeeEmbed"
              value={panoeeValue}
              onChange={(e) => setPanoeeValue(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="https://panoee.com/xxx atau <iframe ...>"
              helperText="Paste shortcode dari dashboard Panoee. Simpan juga link langsung untuk migrasi."
              slotProps={{ htmlInput: { style: { fontFamily: "monospace", fontSize: "0.8rem" } } }}
              sx={inputSx}
            />

            <Box sx={{ mt: 2, borderRadius: 1, overflow: "hidden", border: "1px solid #E2E8F0", bgcolor: "#F8FAFC", aspectRatio: "16/9" }}>
              {previewSrc ? (
                <iframe src={previewSrc} title="Preview Panoee" style={{ width: "100%", height: "100%", border: 0 }} loading="lazy" />
              ) : (
                <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", p: 3, textAlign: "center" }}>
                  <Box>
                    <TravelExploreIcon sx={{ fontSize: 32, color: "#CBD5E1", mb: 1 }} />
                    <Typography variant="caption" sx={{ color: "#94A3B8", display: "block" }}>
                      {panoeeValue ? "Tidak bisa preview — pastikan URL embed valid." : "Preview tour akan muncul di sini setelah paste embed code."}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Thumbnail */}
          <Paper elevation={0} sx={{ borderRadius: 1, border: "1px solid #E2E8F0", p: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0F172A", mb: 2 }}>Cover Thumbnail</Typography>
            {initial?.thumbnailUrl && (
              <Box sx={{ mb: 2 }}>
                <Box component="img" src={initial.thumbnailUrl} alt="Thumbnail"
                  sx={{ height: 112, width: 176, objectFit: "cover", borderRadius: 1, border: "1px solid #E2E8F0" }} />
                <Typography variant="caption" sx={{ color: "#94A3B8", display: "block", mt: 0.5 }}>
                  Thumbnail saat ini — upload baru untuk mengganti.
                </Typography>
              </Box>
            )}
            <Box
              sx={{
                border: "2px dashed #E2E8F0",
                borderRadius: 1,
                p: 3,
                textAlign: "center",
                bgcolor: "#F8FAFC",
                position: "relative",
                "&:hover": { borderColor: "#1D4ED8", bgcolor: "rgba(29,78,216,0.02)" },
                transition: "all 0.2s",
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 28, color: "#94A3B8", mb: 1 }} />
              <Typography variant="caption" sx={{ color: "#64748B", display: "block" }}>
                JPG/PNG/WebP, maks 5MB → di-resize ke WebP 800px via sharp
              </Typography>
              <input
                type="file"
                name="thumbnail"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
              />
            </Box>
          </Paper>

          {/* Gallery */}
          <Paper elevation={0} sx={{ borderRadius: 1, border: "1px solid #E2E8F0", p: 3 }}>
            {mode === "edit" && initial?.id ? (
              <PhotoGallery
                listingId={initial.id}
                listingTitle={titleValue || initial.title || "Properti"}
                initialPhotos={galleryPhotos ?? []}
              />
            ) : (
              <>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                  <CloudUploadIcon sx={{ color: "#1D4ED8", fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0F172A" }}>Galeri Foto Pendukung</Typography>
                </Box>
                <Box sx={{ border: "2px dashed #E2E8F0", borderRadius: 1, p: 4, textAlign: "center", bgcolor: "#F8FAFC" }}>
                  <CloudUploadIcon sx={{ fontSize: 36, color: "#CBD5E1", mb: 1.5 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#64748B" }}>
                    Simpan listing dulu untuk kelola galeri
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94A3B8", display: "block", mt: 0.5 }}>
                    Galeri tersedia di halaman edit — multiple upload, drag reorder, alt text SEO.
                  </Typography>
                </Box>
              </>
            )}
          </Paper>
        </Stack>
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
          <Button variant="outlined" size="small" onClick={() => setActiveTab(3)}
            sx={{ borderColor: "#E2E8F0", color: "#64748B", borderRadius: 1, fontSize: "0.78rem" }}>
            ← Kembali
          </Button>
          <Button variant="contained" size="small" onClick={() => setActiveTab(5)}
            sx={{ bgcolor: "#1D4ED8", "&:hover": { bgcolor: "#1E3A8A" }, borderRadius: 1, fontSize: "0.78rem" }}>
            Lanjut: SEO & Publikasi →
          </Button>
        </Box>
      </Box>

      {/* ── TAB 5: SEO & Publikasi ── */}
      <Box sx={{ ...tabContentSx(5), pt: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Stack spacing={3}>
              {/* SEO */}
              <Paper elevation={0} sx={{ borderRadius: 1, border: "1px solid #E2E8F0", p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                  <LinkIcon sx={{ color: "#1D4ED8", fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0F172A" }}>SEO</Typography>
                </Box>
                <Stack spacing={2}>
                  <TextField
                    name="metaTitle"
                    label="Meta Title"
                    defaultValue={initial?.metaTitle ?? ""}
                    slotProps={{ htmlInput: { maxLength: 70 } }}
                    fullWidth
                    placeholder="Judul SEO (maks 70)"
                    helperText="Template: {Judul} - Virtual Tour 360° | Properti360"
                    sx={inputSx}
                  />
                  <TextField
                    name="metaDescription"
                    label="Meta Description"
                    defaultValue={initial?.metaDescription ?? ""}
                    onChange={(e) => setMetaDescValue(e.target.value)}
                    slotProps={{ htmlInput: { maxLength: 160 } }}
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Deskripsi SEO (maks 160)"
                    helperText={`${metaDescValue.length}/160 karakter`}
                    sx={inputSx}
                  />
                  <Box sx={{ p: 2, borderRadius: 1, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#94A3B8", fontSize: "0.67rem" }}>URL PREVIEW</Typography>
                    <Typography variant="caption" sx={{ display: "block", mt: 0.5, fontFamily: "monospace", color: "#1D4ED8", wordBreak: "break-all" }}>
                      /listing/{slugPreview}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              {/* Assign Owner */}
              <Paper elevation={0} sx={{ borderRadius: 1, border: "1px solid #E2E8F0", p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                  <PersonSearchIcon sx={{ color: "#1D4ED8", fontSize: 20 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0F172A" }}>Assign Owner</Typography>
                    <Typography variant="caption" sx={{ color: "#94A3B8" }}>Pilih customer pemilik listing ini</Typography>
                  </Box>
                </Box>

                <TextField
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="Cari nama / email..."
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: "#94A3B8" }} /></InputAdornment> } }}
                  sx={{ ...inputSx, mb: 1.5 }}
                />

                <FormControl fullWidth error={!!fieldErrors.ownerId} sx={inputSx}>
                  <InputLabel sx={{ fontSize: "0.85rem" }}>{lbl("Owner", "ownerId")}</InputLabel>
                  <MuiSelect name="ownerId" defaultValue={initial?.ownerId ?? ""} label={lbl("Owner", "ownerId")} required={req("ownerId")} sx={{ fontSize: "0.85rem" }}>
                    <MenuItem value="" disabled><em>-- Pilih Customer --</em></MenuItem>
                    {filteredCustomers.map((c) => (
                      <MenuItem key={c.id} value={c.id} sx={{ fontSize: "0.85rem" }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>{c.name}</Typography>
                          <Typography variant="caption" sx={{ color: "#94A3B8" }}>{c.email}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </MuiSelect>
                  {fieldErrors.ownerId && <FormHelperText>{fieldErrors.ownerId[0]}</FormHelperText>}
                </FormControl>

                {customers.length === 0 && (
                  <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 1, fontSize: "0.78rem" }}>
                    Belum ada user CUSTOMER. Buat via registrasi.
                  </Alert>
                )}
              </Paper>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Paper elevation={0} sx={{ borderRadius: 1, border: "1px solid #E2E8F0", p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <CheckCircleOutlineIcon sx={{ color: "#1D4ED8", fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0F172A" }}>Checklist Publish</Typography>
              </Box>
              <Stack spacing={1}>
                {[
                  "Judul & alamat terisi",
                  "Deskripsi kaya keyword",
                  "Wilayah dipilih",
                  "Panoee embed + thumbnail",
                  "Owner ter-assign",
                  "Meta SEO (opsional tapi disarankan)",
                ].map((item) => (
                  <Box key={item} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckCircleOutlineIcon sx={{ fontSize: 15, color: "#CBD5E1" }} />
                    <Typography variant="caption" sx={{ color: "#64748B" }}>{item}</Typography>
                  </Box>
                ))}
              </Stack>

              <Divider sx={{ my: 2.5, borderColor: "#F1F5F9" }} />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={pending}
                startIcon={<SaveIcon />}
                sx={{ bgcolor: "#1D4ED8", "&:hover": { bgcolor: "#1E3A8A" }, borderRadius: 1, fontWeight: 600 }}
              >
                {pending ? "Menyimpan..." : mode === "create" ? "Buat Listing" : "Simpan Perubahan"}
              </Button>
            </Paper>

            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" size="small" onClick={() => setActiveTab(4)}
                sx={{ borderColor: "#E2E8F0", color: "#64748B", borderRadius: 1, fontSize: "0.78rem" }}>
                ← Kembali
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
