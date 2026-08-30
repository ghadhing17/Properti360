"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import ViewInArIcon from "@mui/icons-material/ViewInAr";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";

type Props = {
  categories: { name: string; slug: string }[];
};

const QUICK_LINKS = [
  { href: "#portofolio", label: "Portfolio" },
  { href: "#harga", label: "Paket Harga" },
  { href: "#cara-kerja", label: "Cara Kerja" },
  { href: "/blog", label: "Blog" },
];

const SERVICE_LINKS = [
  { href: "/booking?product=starter", label: "Paket Starter" },
  { href: "/booking?product=professional", label: "Paket Professional" },
  { href: "/booking?product=enterprise", label: "Paket Enterprise" },
  { href: "/listing", label: "Semua Listing" },
];

export function MarketingFooter({ categories }: Props) {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "#060E1E",
        color: "white",
        mt: "auto",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 60% 40% at 80% 0%, rgba(29,78,216,0.18) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(148,163,184,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          pointerEvents: "none",
        }}
      />

      {/* Top CTA strip */}
      <Box
        sx={{
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          py: 4,
          position: "relative",
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 3,
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "1.15rem", color: "white", mb: 0.5 }}>
                Siap mulai virtual tour untuk properti Anda?
              </Typography>
              <Typography sx={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)" }}>
                Hubungi kami sekarang, respon dalam 24 jam.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5}>
              <Button
                component="a"
                href="https://wa.me/6208xxxxxxxxxx"
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<WhatsAppIcon sx={{ fontSize: 18 }} />}
                sx={{
                  px: 2.5,
                  py: 1.1,
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  borderRadius: 99,
                  bgcolor: "rgba(34,197,94,0.12)",
                  color: "#4ADE80",
                  border: "1px solid rgba(34,197,94,0.25)",
                  "&:hover": { bgcolor: "rgba(34,197,94,0.2)" },
                }}
              >
                WhatsApp
              </Button>
              <Button
                component="a"
                href="#contact"
                variant="contained"
                sx={{
                  px: 2.5,
                  py: 1.1,
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  borderRadius: 99,
                  background: "linear-gradient(135deg, #1D4ED8, #3B82F6)",
                  boxShadow: "0 4px 14px rgba(29,78,216,0.35)",
                  "&:hover": { boxShadow: "0 6px 20px rgba(29,78,216,0.5)" },
                }}
              >
                Book Sekarang
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Main footer content */}
      <Container maxWidth="lg" sx={{ py: 7, position: "relative" }}>
        <Grid container spacing={5}>
          {/* Brand column */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {/* Logo */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2.5 }}>
              <Box
                sx={{
                  display: "flex",
                  height: 36,
                  width: 36,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 2,
                  background: "linear-gradient(135deg, #1D4ED8 0%, #60A5FA 100%)",
                  color: "white",
                  fontWeight: 900,
                  fontSize: "0.72rem",
                  boxShadow: "0 4px 12px rgba(29,78,216,0.35)",
                }}
              >
                360
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.025em" }}>
                Properti<Box component="span" sx={{ color: "#60A5FA" }}>360</Box>
              </Typography>
            </Box>

            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.75, mb: 3, maxWidth: 300 }}
            >
              Jasa foto 360° profesional + virtual tour immersive + listing SEO-friendly gratis untuk setiap properti di Jawa Tengah & Jawa Timur.
            </Typography>

            {/* Contact info */}
            <Stack spacing={1.25}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <EmailIcon sx={{ fontSize: 15, color: "#60A5FA", flexShrink: 0 }} />
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}>
                  halo@properti360.id
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <WhatsAppIcon sx={{ fontSize: 15, color: "#4ADE80", flexShrink: 0 }} />
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}>
                  +62 8xx-xxxx-xxxx
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <LocationOnIcon sx={{ fontSize: 15, color: "#F472B6", flexShrink: 0, mt: 0.15 }} />
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}>
                  Semarang, Jawa Tengah
                </Typography>
              </Box>
            </Stack>
          </Grid>

          {/* Quick links */}
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "0.78rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
                mb: 2.5,
              }}
            >
              Navigasi
            </Typography>
            <Stack spacing={1.25}>
              {QUICK_LINKS.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  underline="none"
                  sx={{
                    fontSize: "0.875rem",
                    color: "rgba(255,255,255,0.55)",
                    transition: "color 0.15s",
                    "&:hover": { color: "#60A5FA" },
                  }}
                >
                  {l.label}
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* Services */}
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "0.78rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
                mb: 2.5,
              }}
            >
              Layanan
            </Typography>
            <Stack spacing={1.25}>
              {SERVICE_LINKS.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  underline="none"
                  sx={{
                    fontSize: "0.875rem",
                    color: "rgba(255,255,255,0.55)",
                    transition: "color 0.15s",
                    "&:hover": { color: "#60A5FA" },
                  }}
                >
                  {l.label}
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* Categories */}
          {categories && categories.length > 0 && (
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.35)",
                  mb: 2.5,
                }}
              >
                Kategori
              </Typography>
              <Stack spacing={1.25}>
                {categories.slice(0, 5).map((c) => (
                  <Link
                    key={c.slug}
                    href={`/listing?category=${c.slug}`}
                    underline="none"
                    sx={{
                      fontSize: "0.875rem",
                      color: "rgba(255,255,255,0.55)",
                      transition: "color 0.15s",
                      "&:hover": { color: "#60A5FA" },
                    }}
                  >
                    {c.name}
                  </Link>
                ))}
              </Stack>
            </Grid>
          )}

          {/* Stats column */}
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "0.78rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
                mb: 2.5,
              }}
            >
              Pencapaian
            </Typography>
            <Stack spacing={2}>
              {[
                { v: "150+", l: "Listing Live" },
                { v: "98%", l: "Klien Puas" },
                { v: "5 Kota", l: "Area Layanan" },
              ].map((s) => (
                <Box key={s.l}>
                  <Typography sx={{ fontWeight: 800, fontSize: "1.2rem", color: "white", lineHeight: 1 }}>
                    {s.v}
                  </Typography>
                  <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", mt: 0.25 }}>
                    {s.l}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ mt: 7, mb: 3.5, borderColor: "rgba(255,255,255,0.07)" }} />

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}>
            © {new Date().getFullYear()} Properti360 — Platform Virtual Tour 360° · Next.js 15 + MUI + Prisma
          </Typography>
          <Stack direction="row" spacing={2.5}>
            {["Kebijakan Privasi", "Syarat & Ketentuan"].map((t) => (
              <Link
                key={t}
                href="#"
                underline="none"
                sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", "&:hover": { color: "rgba(255,255,255,0.6)" } }}
              >
                {t}
              </Link>
            ))}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
