"use client";

import { useState, useEffect, useCallback } from "react";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Rating from "@mui/material/Rating";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";

const TESTIMONIALS = [
  {
    name: "Ibu Sari — Agen Properti Semarang",
    role: "Mitra sejak 2024",
    quote: "Listing Properti360 langsung naik di halaman 1 Google. Banyak leads masuk cuma dari share link 360° ke grup WhatsApp.",
    avatar: "https://picsum.photos/seed/testi1/80/80",
    rating: 5,
  },
  {
    name: "Pak Andi — Pemilik Kost Elite Tembalang",
    role: "Paket Pro • 15 scene",
    quote: "Proses cepat, hasil foto 360° tajam. Calon penyewa langsung yakin tanpa survei — occupancy kost naik 30%.",
    avatar: "https://picsum.photos/seed/testi2/80/80",
    rating: 5,
  },
  {
    name: "Hotel Boutique Kota Lama",
    role: "Paket Premium • Drone + Video",
    quote: "Virtual tour jadi pembeda kami di OTA. Occupancy naik 18% setelah pakai Properti360, tamu suka preview kamar 360°.",
    avatar: "https://picsum.photos/seed/testi3/80/80",
    rating: 5,
  },
  {
    name: "Mas Reza — Developer BSB City",
    role: "12 listing aktif",
    quote: "Admin super cepat, dari sesi foto ke listing live cuma 10 menit. Share link + QR memudahkan marketing offline juga.",
    avatar: "https://picsum.photos/seed/testi4/80/80",
    rating: 5,
  },
  {
    name: "Kak Nadia — Marketing Ruko Gajah Mada",
    role: "Paket Basic → Pro",
    quote: "Awalnya coba Basic, langsung upgrade ke Pro karena hasilnya bagus. Harga transparan, nggak ada biaya tersembunyi.",
    avatar: "https://picsum.photos/seed/testi5/80/80",
    rating: 5,
  },
];

export function TestimonialCarousel() {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => setIndex((i) => (i + 1) % TESTIMONIALS.length), []);
  const prev = useCallback(() => setIndex((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length), []);

  useEffect(() => {
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [next]);

  const t = TESTIMONIALS[index];

  return (
    <Box sx={{ maxWidth: 720, mx: "auto" }}>
      <Card
        key={index}
        sx={{
          position: "relative",
          p: { xs: 3.5, md: 5 },
          bgcolor: "#0F172A",
          color: "white",
          border: "none",
          overflow: "hidden",
          animation: "fadeSlide 0.4s ease",
          "@keyframes fadeSlide": {
            from: { opacity: 0, transform: "translateY(8px)" },
            to: { opacity: 1, transform: "translateY(0)" },
          },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -30,
            right: -20,
            fontSize: 180,
            lineHeight: 1,
            color: "rgba(96,165,250,0.12)",
            fontFamily: "Georgia, serif",
            pointerEvents: "none",
          }}
        >
          &rdquo;
        </Box>
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #60A5FA, #1D4ED8)",
          }}
        />
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Rating value={t.rating} readOnly sx={{ color: "#FBBF24" }} size="small" />
          <FormatQuoteIcon sx={{ color: "rgba(255,255,255,0.2)", fontSize: 28 }} />
        </Box>
        <Typography
          component="blockquote"
          sx={{
            mt: 2.5,
            fontSize: { xs: "1.05rem", md: "1.2rem" },
            lineHeight: 1.7,
            fontWeight: 500,
            color: "rgba(255,255,255,0.92)",
          }}
        >
          “{t.quote}”
        </Typography>
        <Stack direction="row" spacing={1.5} sx={{ mt: 4, alignItems: "center" }}>
          <Avatar
            src={t.avatar}
            alt={t.name}
            sx={{
              width: 50,
              height: 50,
              border: "2px solid rgba(96,165,250,0.4)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
          />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "white" }}>
              {t.name}
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
              {t.role}
            </Typography>
          </Box>
        </Stack>
      </Card>

      <Stack direction="row" sx={{ mt: 3.5, alignItems: "center", justifyContent: "center", gap: 2 }}>
        <IconButton
          onClick={prev}
          aria-label="Sebelumnya"
          sx={{
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            "&:hover": { bgcolor: "rgba(29,78,216,0.06)", borderColor: "primary.main" },
          }}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
          {TESTIMONIALS.map((_, i) => (
            <Box
              key={i}
              component="button"
              onClick={() => setIndex(i)}
              aria-label={`Ke testimoni ${i + 1}`}
              sx={{
                width: i === index ? 26 : 8,
                height: 8,
                border: "none",
                p: 0,
                borderRadius: 99,
                cursor: "pointer",
                bgcolor: i === index ? "primary.main" : "#E2E8F0",
                transition: "all 0.25s",
              }}
            />
          ))}
        </Stack>
        <IconButton
          onClick={next}
          aria-label="Selanjutnya"
          sx={{
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            "&:hover": { bgcolor: "rgba(29,78,216,0.06)", borderColor: "primary.main" },
          }}
        >
          <ArrowForwardIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  );
}