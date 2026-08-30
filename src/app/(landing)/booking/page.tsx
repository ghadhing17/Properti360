import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Card from "@mui/material/Card";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import VerifiedIcon from "@mui/icons-material/Verified";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { BookingForm } from "@/modules/landing/components/booking-form";
import { getActiveServiceProducts } from "@/modules/landing/queries/landing";
import { getScheduleSettings, summarizeOperatingHours } from "@/shared/lib/schedule-settings";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Booking Sesi Foto 360° — Properti360",
  description:
    "Pesan sesi foto virtual tour 360° untuk properti Anda. Pilih tanggal, jam, dan paket layanan sesuai kebutuhan.",
};

export const revalidate = 60;

const WHY_BOOK = [
  {
    icon: <PhotoCameraIcon sx={{ fontSize: 22 }} />,
    title: "Foto 360° Profesional",
    desc: "Kamera Ricoh Theta + drone, stitching otomatis.",
  },
  {
    icon: <AccessTimeIcon sx={{ fontSize: 22 }} />,
    title: "Proses < 15 Menit Live",
    desc: "Tour langsung tayang di Panoee setelah sesi.",
  },
  {
    icon: <EventAvailableIcon sx={{ fontSize: 22 }} />,
    title: "Jadwal Fleksibel",
    desc: "Pilih slot kosong sesuai jam operasional kami.",
  },
  {
    icon: <VerifiedIcon sx={{ fontSize: 22 }} />,
    title: "Listing SEO Gratis",
    desc: "Halaman properti publik + QR code tanpa biaya.",
  },
];

interface Props {
  searchParams: Promise<{ product?: string; paket?: string }>;
}

export default async function BookingPage({ searchParams }: Props) {
  const params = await searchParams;
  const initialProductId = params.product ?? params.paket ?? undefined;

  const products = await getActiveServiceProducts();
  const schedule = await getScheduleSettings();
  const scheduleNote = `Jam operasional ${summarizeOperatingHours(schedule)}`;

  const selectedProduct = initialProductId
    ? products.find((p) => p.id === initialProductId)
    : undefined;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* ── Hero strip ── */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1D4ED8 100%)",
          py: { xs: 6, md: 8 },
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(96,165,250,0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <Container maxWidth="lg">
          <Chip
            label="Booking Sesi Foto"
            size="small"
            sx={{
              mb: 2,
              bgcolor: "rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.9)",
              fontWeight: 600,
              fontSize: "0.75rem",
            }}
          />
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "1.9rem", md: "2.75rem" },
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.2,
              maxWidth: 560,
            }}
          >
            Jadwalkan Sesi Foto{" "}
            <Box
              component="span"
              sx={{
                background: "linear-gradient(90deg,#93C5FD,#60A5FA)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              360°
            </Box>{" "}
            Anda
          </Typography>
          <Typography
            variant="body1"
            sx={{ mt: 2, color: "rgba(255,255,255,0.7)", maxWidth: 480, lineHeight: 1.7 }}
          >
            Isi form di bawah — tim kami konfirmasi via WhatsApp dalam 1×24 jam.
          </Typography>
          {selectedProduct && (
            <Chip
              icon={<EventAvailableIcon />}
              label={`Paket dipilih: ${selectedProduct.name}`}
              sx={{
                mt: 2,
                bgcolor: "rgba(29,78,216,0.6)",
                color: "#fff",
                fontWeight: 600,
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            />
          )}
        </Container>
      </Box>

      {/* ── Main content ── */}
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
        <Grid container spacing={5} sx={{ alignItems: "flex-start" }}>
          {/* Left: form */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Suspense fallback={null}>
              <BookingForm products={products} initialProductId={initialProductId} scheduleNote={scheduleNote} />
            </Suspense>
          </Grid>

          {/* Right: info panel */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", mb: 2.5 }}>
              Mengapa Properti360?
            </Typography>

            <Stack spacing={1.5} sx={{ mb: 3 }}>
              {WHY_BOOK.map((item) => (
                <Card
                  key={item.title}
                  sx={{
                    p: 2.5,
                    display: "flex",
                    gap: 2,
                    alignItems: "flex-start",
                    borderRadius: 1,
                    boxShadow: "none",
                    border: "1px solid",
                    borderColor: "divider",
                    transition: "box-shadow 0.2s",
                    "&:hover": { boxShadow: "0 2px 8px rgba(29,78,216,0.1)" },
                  }}
                >
                  <Box
                    sx={{
                      flexShrink: 0,
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      bgcolor: "rgba(29,78,216,0.08)",
                      color: "primary.main",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "text.primary" }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, lineHeight: 1.5 }}>
                      {item.desc}
                    </Typography>
                  </Box>
                </Card>
              ))}
            </Stack>

            {/* WhatsApp CTA */}
            <Card
              sx={{
                p: 3,
                borderRadius: 1,
                background: "linear-gradient(135deg, #0f172a 0%, #1D4ED8 100%)",
                color: "#fff",
              }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 1 }}>
                Lebih suka lewat WhatsApp?
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mb: 2, lineHeight: 1.6 }}>
                Chat langsung dengan tim kami untuk konsultasi gratis sebelum booking.
              </Typography>
              <Box
                component="a"
                href="https://wa.me/6281234567890?text=Halo%20Properti360%2C%20saya%20ingin%20booking%20sesi%20foto%20360%C2%B0"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  bgcolor: "#25D366",
                  color: "#fff",
                  px: 2.5,
                  py: 1,
                  borderRadius: 1,
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  textDecoration: "none",
                  transition: "opacity 0.2s",
                  "&:hover": { opacity: 0.9 },
                }}
              >
                <WhatsAppIcon sx={{ fontSize: 18 }} />
                Chat WhatsApp
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
