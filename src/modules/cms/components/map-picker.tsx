"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";
import SearchIcon from "@mui/icons-material/Search";
import { searchPlaces, type PlaceResult } from "@/modules/cms/actions/wilayah";

const DEFAULT_CENTER: [number, number] = [-6.2088, 106.8456];

// Pin CSS murni — hindari masalah default marker icon Leaflet pada bundler
const pinIcon = L.divIcon({
  className: "",
  html: '<div style="width:16px;height:16px;border-radius:50% 50% 50% 0;background:#1D4ED8;border:2px solid #fff;box-shadow:0 1px 4px rgba(15,23,42,0.5);transform:rotate(-45deg);box-sizing:border-box"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 16],
});

function parseCoord(v: string): number | null {
  if (!v || !v.trim()) return null;
  const n = Number(v.replace(/,/g, "."));
  return Number.isFinite(n) ? n : null;
}

const fmt = (n: number) => n.toFixed(6);

function ClickToPlace({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function Recenter({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat === null || lng === null) return;
    const c = map.getCenter();
    if (Math.abs(c.lat - lat) > 1e-6 || Math.abs(c.lng - lng) > 1e-6) {
      map.setView([lat, lng], Math.max(map.getZoom(), 15));
    }
  }, [lat, lng, map]);
  return null;
}

// Peta ter-mount saat tab masih display:none → ukuran 0. ResizeObserver memaksa
// Leaflet menghitung ulang ukuran saat tab dibuka.
function InvalidateOnResize() {
  const map = useMap();
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
  return null;
}

export function MapPicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: string;
  longitude: string;
  onChange: (lat: string, lng: string) => void;
}) {
  const lat = parseCoord(latitude);
  const lng = parseCoord(longitude);
  const hasPoint = lat !== null && lng !== null;

  const [q, setQ] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);

  async function runSearch() {
    const query = q.trim();
    if (query.length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      setResults(await searchPlaces(query));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function pickResult(r: PlaceResult) {
    const la = parseCoord(r.lat);
    const lo = parseCoord(r.lon);
    if (la !== null && lo !== null) onChange(fmt(la), fmt(lo));
    setResults([]);
  }

  return (
    <Box>
      <Box sx={{ position: "relative", zIndex: 1100, mb: 1 }}>
        <TextField
          size="small"
          fullWidth
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void runSearch();
            }
            if (e.key === "Escape") setResults([]);
          }}
          placeholder="Cari lokasi... (min. 3 karakter, tekan Enter)"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: "#94A3B8" }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => void runSearch()} disabled={searching || q.trim().length < 3}>
                    {searching ? <CircularProgress size={16} /> : <SearchIcon sx={{ fontSize: 18 }} />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": { bgcolor: "white", borderRadius: 1, fontSize: "0.8rem" },
            "& .MuiInputBase-input": { fontSize: "0.8rem", py: 1 },
          }}
        />
        {results.length > 0 && (
          <Paper
            elevation={8}
            sx={{ position: "absolute", top: "100%", left: 0, right: 0, maxHeight: 220, overflowY: "auto", zIndex: 1200 }}
          >
            {results.map((r, i) => (
              <Box
                key={`${r.lat}-${r.lon}-${i}`}
                onClick={() => pickResult(r)}
                sx={{
                  px: 1.5, py: 1, cursor: "pointer", fontSize: "0.75rem", color: "#0F172A",
                  borderBottom: "1px solid #F1F5F9", "&:hover": { bgcolor: "#EFF6FF" },
                }}
              >
                {r.label}
              </Box>
            ))}
          </Paper>
        )}
      </Box>

      <Box sx={{ height: 320, borderRadius: 1, overflow: "hidden", border: "1px solid #E2E8F0", position: "relative" }}>
        <MapContainer
          center={hasPoint ? [lat, lng] : DEFAULT_CENTER}
          zoom={hasPoint ? 16 : 10}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <ClickToPlace onSelect={(la, lo) => onChange(fmt(la), fmt(lo))} />
          <Recenter lat={lat} lng={lng} />
          <InvalidateOnResize />
          {hasPoint && (
            <Marker
              position={[lat, lng]}
              icon={pinIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const p = (e.target as L.Marker).getLatLng();
                  onChange(fmt(p.lat), fmt(p.lng));
                },
              }}
            />
          )}
        </MapContainer>
        {!hasPoint && (
          <Typography
            variant="caption"
            sx={{
              position: "absolute", bottom: 8, left: 8, zIndex: 1000,
              bgcolor: "rgba(255,255,255,0.9)", px: 1, py: 0.25, borderRadius: 0.5,
              color: "#64748B", pointerEvents: "none",
            }}
          >
            Klik peta untuk menandai lokasi, lalu geser pin untuk menyesuaikan
          </Typography>
        )}
      </Box>
    </Box>
  );
}
