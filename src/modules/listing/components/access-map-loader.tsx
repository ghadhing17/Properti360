"use client";

import dynamic from "next/dynamic";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import type { AccessMapProps } from "./access-map";

// Leaflet tidak punya window saat SSR → lazy client-only, bundle peta tidak
// masuk First Load JS halaman listing.
const AccessMap = dynamic(() => import("./access-map").then((m) => m.AccessMap), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        height: 320,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#F1F5F9",
      }}
    >
      <CircularProgress size={24} sx={{ color: "#1D4ED8" }} />
    </Box>
  ),
});

export function AccessMapLoader(props: AccessMapProps) {
  return <AccessMap {...props} />;
}
