"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LANDMARK_META, type NearbyPlace } from "@/shared/lib/landmarks";

export type EditorPlace = NearbyPlace & { uid: string };

function dropPin(color: string, size: number, active: boolean): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(15,23,42,0.5);transform:rotate(-45deg);box-sizing:border-box${active ? `;outline:3px solid ${color}55` : ""}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

const propertyPin = dropPin("#1D4ED8", 22, false);

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyToSelected({ places, selectedUid }: { places: EditorPlace[]; selectedUid: string | null }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedUid) return;
    const p = places.find((x) => x.uid === selectedUid);
    if (p) map.setView([p.lat, p.lng], Math.max(map.getZoom(), 15));
    // sengaja hanya saat seleksi berubah — jangan ganggu posisi peta saat drag
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUid]);
  return null;
}

function FitInitial({ points }: { points: [number, number][] }) {
  const map = useMap();
  const key = useMemo(() => JSON.stringify(points.map((p) => p.map((n) => n.toFixed(4)))), [points]);
  useEffect(() => {
    if (points.length < 2) return;
    map.fitBounds(L.latLngBounds(points).pad(0.2), { maxZoom: 15 });
    // fit hanya saat jumlah titik berubah, bukan setiap drag
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

export function LandmarkEditorMap({
  propertyLat,
  propertyLng,
  places,
  selectedUid,
  onMove,
  onMapClick,
}: {
  propertyLat: number;
  propertyLng: number;
  places: EditorPlace[];
  selectedUid: string | null;
  onMove: (uid: string, lat: number, lng: number) => void;
  onMapClick: (lat: number, lng: number) => void;
}) {
  return (
    <div style={{ height: 280 }}>
      <MapContainer
        center={[propertyLat, propertyLng]}
        zoom={14}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitInitial points={places.map((p) => [p.lat, p.lng] as [number, number])} />
        <FlyToSelected places={places} selectedUid={selectedUid} />
        <ResizeFix />
        <ClickHandler onMapClick={onMapClick} />
        <Marker position={[propertyLat, propertyLng]} icon={propertyPin}>
          <Popup>
            <strong>Properti</strong>
          </Popup>
        </Marker>
        {places.map((p) => (
          <Marker
            key={p.uid}
            position={[p.lat, p.lng]}
            icon={dropPin(LANDMARK_META[p.category].color, p.uid === selectedUid ? 20 : 15, p.uid === selectedUid)}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const ll = (e.target as L.Marker).getLatLng();
                onMove(p.uid, ll.lat, ll.lng);
              },
            }}
          >
            <Popup>{p.name || "(tanpa nama)"}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
