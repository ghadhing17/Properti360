"use client";

import { useMemo, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import AddLocationAltIcon from "@mui/icons-material/AddLocationAlt";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { generateLandmarksAction } from "@/modules/cms/actions/listings";
import {
  LANDMARK_META,
  formatLandmarkDistance,
  recomputeDistances,
  type LandmarkCategory,
  type NearbyPlace,
} from "@/shared/lib/landmarks";
import type { EditorPlace } from "./landmark-editor-map";

const LandmarkEditorMap = dynamic(
  () => import("./landmark-editor-map").then((m) => m.LandmarkEditorMap),
  {
    ssr: false,
    loading: () => (
      <Box sx={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#F1F5F9" }}>
        <CircularProgress size={24} sx={{ color: "#1D4ED8" }} />
      </Box>
    ),
  }
);

const CATEGORY_VALUES = Object.keys(LANDMARK_META) as LandmarkCategory[];

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `lm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseCoord(v: string): number | null {
  if (!v || !v.trim()) return null;
  const n = Number(v.replace(/,/g, "."));
  return Number.isFinite(n) ? n : null;
}

export function LandmarkEditor({
  latitude,
  longitude,
  initialPlaces,
}: {
  latitude: string;
  longitude: string;
  initialPlaces: NearbyPlace[];
}) {
  const [places, setPlaces] = useState<EditorPlace[]>(() =>
    initialPlaces.map((p) => ({ ...p, uid: uid() }))
  );
  const [dirty, setDirty] = useState(false);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ severity: "success" | "warning"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const lat = parseCoord(latitude);
  const lng = parseCoord(longitude);
  const hasCoords = lat != null && lng != null;

  // Jarak tampil selalu mengikuti titik properti terkini (live saat pin digeser).
  // recomputeDistances menjaga urutan array → zip kembali dengan uid.
  const displayPlaces = useMemo<EditorPlace[]>(() => {
    if (!hasCoords) return places;
    const recomputed = recomputeDistances(lat, lng, places);
    return places.map((p, i) => ({ ...p, ...recomputed[i] }));
  }, [places, lat, lng, hasCoords]);

  function markDirty() {
    setDirty(true);
  }

  function updatePlace(targetUid: string, patch: Partial<NearbyPlace>) {
    setPlaces((prev) => prev.map((p) => (p.uid === targetUid ? { ...p, ...patch } : p)));
    markDirty();
  }

  function removePlace(targetUid: string) {
    setPlaces((prev) => prev.filter((p) => p.uid !== targetUid));
    if (selectedUid === targetUid) setSelectedUid(null);
    markDirty();
  }

  function handleAdd() {
    if (!hasCoords) {
      setMsg({ severity: "warning", text: "Tentukan titik properti di peta di atas dulu sebelum menambah landmark." });
      return;
    }
    const p: EditorPlace = {
      uid: uid(),
      name: "",
      category: "STATION",
      lat,
      lng,
      distanceKm: 0,
      minutes: 0,
    };
    setPlaces((prev) => [...prev, p]);
    setSelectedUid(p.uid);
    markDirty();
    setMsg({ severity: "success", text: "Landmark baru dibuat — klik peta untuk mengatur posisinya, lalu isi namanya." });
  }

  function handleGenerate() {
    if (!hasCoords) {
      setMsg({ severity: "warning", text: "Tentukan titik properti di peta dulu sebelum generate otomatis." });
      return;
    }
    setMsg(null);
    startTransition(async () => {
      const res = await generateLandmarksAction(lat, lng);
      if (res.error || !res.places) {
        setMsg({ severity: "warning", text: res.error ?? "Gagal mengambil landmark dari peta" });
        return;
      }
      setPlaces(res.places.map((p) => ({ ...p, uid: uid() })));
      setSelectedUid(null);
      markDirty();
      setMsg({
        severity: "success",
        text:
          res.places.length > 0
            ? `${res.places.length} landmark terdeteksi dalam radius 5 km — sesuaikan bila perlu, lalu simpan.`
            : "Tidak ada landmark terdeteksi dalam radius 5 km — bisa ditambah manual.",
      });
    });
  }

  function handleMapClick(clickLat: number, clickLng: number) {
    if (!selectedUid) return;
    updatePlace(selectedUid, { lat: clickLat, lng: clickLng });
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0F172A" }}>
            Landmark Sekitar
          </Typography>
          <Typography variant="caption" sx={{ color: "#94A3B8" }}>
            Otomatis ter-generate saat menyimpan (bila koordinat berubah). Edit di sini untuk mengunci daftar manual.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={pending ? <CircularProgress size={14} /> : <AutoAwesomeIcon sx={{ fontSize: 16 }} />}
            onClick={handleGenerate}
            disabled={pending}
            sx={{ borderRadius: 1, fontSize: "0.75rem", borderColor: "#1D4ED8", color: "#1D4ED8" }}
          >
            Generate Otomatis
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddLocationAltIcon sx={{ fontSize: 16 }} />}
            onClick={handleAdd}
            sx={{ bgcolor: "#1D4ED8", "&:hover": { bgcolor: "#1E3A8A" }, borderRadius: 1, fontSize: "0.75rem" }}
          >
            Tambah Manual
          </Button>
        </Stack>
      </Box>

      {msg && (
        <Alert
          severity={msg.severity}
          onClose={() => setMsg(null)}
          sx={{ mt: 1.5, borderRadius: 1, py: 0.25, fontSize: "0.75rem", alignItems: "center" }}
        >
          {msg.text}
        </Alert>
      )}

      {places.length > 0 && (
        <Stack spacing={1} sx={{ mt: 2 }}>
          {displayPlaces.map((p) => (
            <Box
              key={p.uid}
              onClick={() => setSelectedUid(p.uid)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 1,
                borderRadius: 1,
                border: "1px solid",
                borderColor: p.uid === selectedUid ? "#1D4ED8" : "#E2E8F0",
                bgcolor: p.uid === selectedUid ? "#EFF6FF" : "white",
                cursor: "pointer",
              }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  flexShrink: 0,
                  bgcolor: LANDMARK_META[p.category].color,
                }}
              />
              <Select
                size="small"
                value={p.category}
                onChange={(e) => updatePlace(p.uid, { category: e.target.value as LandmarkCategory })}
                onClick={(e) => e.stopPropagation()}
                sx={{ minWidth: 150, fontSize: "0.78rem", "& .MuiSelect-select": { py: 0.75 } }}
              >
                {CATEGORY_VALUES.map((c) => (
                  <MenuItem key={c} value={c} sx={{ fontSize: "0.8rem" }}>
                    {LANDMARK_META[c].label}
                  </MenuItem>
                ))}
              </Select>
              <TextField
                size="small"
                fullWidth
                placeholder="Nama landmark — contoh: Stasiun MRT Ampera"
                value={p.name}
                onChange={(e) => updatePlace(p.uid, { name: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                sx={{ "& .MuiInputBase-input": { fontSize: "0.8rem", py: 0.85 } }}
              />
              <Typography
                variant="caption"
                sx={{ color: "#64748B", minWidth: 74, textAlign: "right", flexShrink: 0 }}
              >
                {hasCoords ? formatLandmarkDistance(p.distanceKm) : "—"}
              </Typography>
              <IconButton
                size="small"
                color={p.uid === selectedUid ? "primary" : "default"}
                title="Atur posisi — pilih lalu klik peta, atau geser pin"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedUid(p.uid === selectedUid ? null : p.uid);
                }}
              >
                <MyLocationIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton size="small" title="Hapus landmark" onClick={(e) => { e.stopPropagation(); removePlace(p.uid); }}>
                <DeleteOutlineOutlinedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          ))}
        </Stack>
      )}

      {places.length === 0 && (
        <Typography variant="caption" sx={{ display: "block", mt: 1.5, color: "#94A3B8" }}>
          Belum ada landmark — klik <strong>Generate Otomatis</strong> untuk mengambil dari peta, atau{" "}
          <strong>Tambah Manual</strong>.
        </Typography>
      )}

      {hasCoords && (
        <Box sx={{ mt: 2, borderRadius: 1, overflow: "hidden", border: "1px solid #E2E8F0" }}>
          <LandmarkEditorMap
            propertyLat={lat}
            propertyLng={lng}
            places={displayPlaces}
            selectedUid={selectedUid}
            onMove={(targetUid, newLat, newLng) => updatePlace(targetUid, { lat: newLat, lng: newLng })}
            onMapClick={handleMapClick}
          />
        </Box>
      )}

      {selectedUid && (
        <Typography variant="caption" sx={{ display: "block", mt: 0.75, color: "#1D4ED8" }}>
          Pin terpilih aktif — klik peta untuk memindahkan, atau geser langsung pin-nya.
        </Typography>
      )}

      {/* ikut ter-submit saat admin melakukan edit manual — server skip auto-fetch */}
      {dirty && (
        <>
          <input type="hidden" name="landmarksEdited" value="1" />
          <input
            type="hidden"
            name="nearbyPlacesJson"
            value={JSON.stringify(displayPlaces.map(({ uid: _uid, ...rest }) => rest))}
          />
        </>
      )}
    </Box>
  );
}
