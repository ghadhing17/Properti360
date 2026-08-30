"use client";

import Link from "next/link";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

// Vistura 360 color tokens
const C = {
  primaryContainer: "#1D4ED8",
  onPrimary: "#ffffff",
  surfaceBright: "#faf8ff",
  surfaceContainerLow: "#f2f3ff",
  surfaceContainerHigh: "#e2e7ff",
  outlineVariant: "#c4c5d7",
  onBackground: "#131b2e",
  onSurfaceVariant: "#434655",
};

type Props = {
  slug: string;
  title: string;
  city: string;
  price?: number | null;
  thumbnail?: string | null;
};

function formatPrice(price?: number | null) {
  if (price == null) return null;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}

export function ListingCard({ slug, title, city, price, thumbnail }: Props) {
  const priceLabel = formatPrice(price);

  return (
    <Card
      component={Link}
      href={`/listing/${slug}`}
      elevation={0}
      sx={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        height: "100%",
        textDecoration: "none",
        bgcolor: C.surfaceBright,
        border: `1px solid ${C.outlineVariant}4d`,
        borderRadius: 2,
        transition: "transform 0.25s, box-shadow 0.25s, border-color 0.25s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0px 12px 24px rgba(15,23,42,0.08)",
          borderColor: `${C.primaryContainer}4d`,
        },
        "&:hover .listing-img": { transform: "scale(1.04)" },
      }}
    >
      {/* Thumbnail */}
      <Box sx={{ position: "relative", aspectRatio: "4/3", overflow: "hidden", bgcolor: C.surfaceContainerHigh }}>
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt={title}
            loading="lazy"
            className="listing-img"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.4s ease",
            }}
          />
        ) : (
          <Box
            sx={{
              display: "flex",
              height: "100%",
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
              color: C.onSurfaceVariant,
              fontSize: "0.75rem",
            }}
          >
            No image
          </Box>
        )}

        {/* Subtle dark overlay at bottom */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(19,27,46,0.5) 0%, transparent 40%)",
            pointerEvents: "none",
          }}
        />

        {/* 360° badge */}
        <Box
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 36,
            height: 36,
            borderRadius: "50%",
            bgcolor: C.primaryContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(29,78,216,0.4)",
          }}
        >
          <Typography sx={{ fontSize: "0.55rem", fontWeight: 900, color: C.onPrimary, letterSpacing: "-0.02em" }}>
            360°
          </Typography>
        </Box>

        {/* City chip */}
        <Chip
          icon={<LocationOnIcon sx={{ fontSize: 11, color: `${C.primaryContainer} !important` }} />}
          label={city}
          size="small"
          sx={{
            position: "absolute",
            bottom: 10,
            left: 10,
            height: 22,
            fontSize: "0.68rem",
            fontWeight: 600,
            bgcolor: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(8px)",
            color: C.onBackground,
            border: "none",
            "& .MuiChip-icon": { ml: 0.5 },
          }}
        />
      </Box>

      {/* Card content */}
      <CardContent
        sx={{
          p: 2.5,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 0.75,
          "&:last-child": { pb: 2.5 },
        }}
      >
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: "0.9rem",
            color: C.onBackground,
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </Typography>

        {priceLabel ? (
          <Typography sx={{ fontWeight: 700, color: C.primaryContainer, fontSize: "0.9rem", letterSpacing: "-0.01em" }}>
            {priceLabel}
          </Typography>
        ) : (
          <Typography sx={{ fontSize: "0.78rem", color: C.onSurfaceVariant, fontWeight: 500 }}>
            Hubungi untuk harga
          </Typography>
        )}

        <Button
          variant="text"
          size="small"
          endIcon={<ArrowForwardIcon sx={{ fontSize: "14px !important" }} />}
          sx={{
            mt: "auto",
            pt: 1,
            alignSelf: "flex-start",
            color: C.primaryContainer,
            fontSize: "0.78rem",
            fontWeight: 600,
            p: 0,
            minWidth: 0,
            textTransform: "none",
            "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
          }}
        >
          Lihat Tour 360°
        </Button>
      </CardContent>
    </Card>
  );
}
