"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  LANDMARK_META,
  formatLandmarkDistance,
  type NearbyPlace,
} from "@/shared/lib/landmarks";

export type AccessMapProps = {
  latitude: number;
  longitude: number;
  places: NearbyPlace[];
};

function dropPin(color: string, size: number, ring = false): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(15,23,42,0.5);transform:rotate(-45deg);box-sizing:border-box${ring ? ";outline:3px solid rgba(29,78,216,0.25)" : ""}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function FitAll({ points }: { points: [number, number][] }) {
  const map = useMap();
  const key = useMemo(() => JSON.stringify(points), [points]);
  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds.pad(0.18), { maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

function ResizeFix() {
  const map = useMap();
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
  return null;
}

// Zoom hanya saat Ctrl+scroll (desktop) supaya scroll halaman tidak terjajah;
// pinch zoom sudah aktif bawaan Leaflet (touchZoom default true) untuk mobile.
function CtrlWheelZoom() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      e.stopPropagation();
      map.setZoom(map.getZoom() + (e.deltaY < 0 ? 1 : -1));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [map]);
  return null;
}

const propertyPin = dropPin("#1D4ED8", 22, true);

export function AccessMap({ latitude, longitude, places }: AccessMapProps) {
  const points = useMemo<[number, number][]>(
    () => [[latitude, longitude], ...places.map((p) => [p.lat, p.lng] as [number, number])],
    [latitude, longitude, places]
  );

  return (
    <div style={{ height: 320 }}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitAll points={points} />
        <ResizeFix />
        <CtrlWheelZoom />
        <Marker position={[latitude, longitude]} icon={propertyPin}>
          <Popup>
            <strong>Lokasi Properti</strong>
          </Popup>
        </Marker>
        {places.map((p, i) => (
          <Marker
            key={`${p.category}-${p.name}-${i}`}
            position={[p.lat, p.lng]}
            icon={dropPin(LANDMARK_META[p.category].color, 16)}
          >
            <Popup>
              <div style={{ minWidth: 140 }}>
                <strong>{p.name}</strong>
                <br />
                <span style={{ color: LANDMARK_META[p.category].color, fontWeight: 600 }}>
                  {LANDMARK_META[p.category].label}
                </span>
                <br />
                {formatLandmarkDistance(p.distanceKm)} &middot; &asymp; {p.minutes} menit
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
