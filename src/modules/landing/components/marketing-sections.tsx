"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Link from "next/link";

// Icons
import HdIcon from "@mui/icons-material/Hd";
import LanguageIcon from "@mui/icons-material/Language";
import TimerIcon from "@mui/icons-material/Timer";
import PaymentsIcon from "@mui/icons-material/Payments";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import SendIcon from "@mui/icons-material/Send";
import StarIcon from "@mui/icons-material/Star";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

const C = {
  primary: "#0037b0",
  primaryContainer: "#1D4ED8",
  onPrimary: "#ffffff",
  surfaceBright: "#faf8ff",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f2f3ff",
  surfaceContainer: "#eaedff",
  surfaceContainerHigh: "#e2e7ff",
  surfaceContainerHighest: "#dae2fd",
  surfaceVariant: "#dae2fd",
  onBackground: "#131b2e",
  onSurfaceVariant: "#434655",
  outlineVariant: "#c4c5d7",
  secondaryContainer: "#8fa7fe",
};



// ─── Hero Section ─────────────────────────────────────────────────────────────
export function HeroSection() {
  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        minHeight: { xs: "auto", md: "92vh" },
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <Box sx={{ position: "absolute", inset: 0, zIndex: 0, opacity: 0.4, backgroundImage: "url('https://picsum.photos/seed/arch-bg/1600/900')", backgroundSize: "cover", backgroundPosition: "center" }} />
      <Box sx={{ position: "absolute", inset: 0, zIndex: 0, background: `linear-gradient(to right, ${C.surfaceBright}f5 0%, ${C.surfaceBright}cc 50%, transparent 100%)` }} />

      <Container maxWidth="xl" sx={{ py: { xs: 10, md: 14 }, position: "relative", zIndex: 1 }}>
        <Grid container spacing={6} sx={{ alignItems: "center" }}>
          {/* Left: Copy */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, px: 2, py: 0.75, mb: 3, borderRadius: 99, bgcolor: C.surfaceContainerHigh, border: `1px solid ${C.outlineVariant}80` }}>
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: C.primary, letterSpacing: "0.05em" }}>
                Platform Tur Virtual Generasi Baru
              </Typography>
            </Box>

            <Typography component="h1" sx={{ fontSize: { xs: "2rem", sm: "2.75rem", md: "3.25rem" }, fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", color: C.onBackground, mb: 3 }}>
              Revolusi Cara Anda Menampilkan Properti dengan{" "}
              <Box component="span" sx={{ color: C.primaryContainer }}>Tur Virtual 360°</Box>
            </Typography>

            <Typography sx={{ fontSize: { xs: "1rem", md: "1.1rem" }, lineHeight: 1.75, color: C.onSurfaceVariant, maxWidth: 520, mb: 4 }}>
              Berikan pengalaman imersif yang meningkatkan kepercayaan pembeli dan mempercepat penjualan. Termasuk listing properti gratis yang dioptimasi SEO untuk setiap proyek.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 5 }}>
              <Button
                component={Link}
                href="#contact"
                variant="contained"
                size="large"
                sx={{ px: 4, py: 1.75, fontWeight: 600, fontSize: "0.9rem", borderRadius: 2, bgcolor: C.primaryContainer, color: C.onPrimary, boxShadow: "0px 12px 24px rgba(15,23,42,0.08)", "&:hover": { bgcolor: C.primary }, textTransform: "none", letterSpacing: "0.05em" }}
              >
                Mulai Proyek Anda
              </Button>
              <Button
                component={Link}
                href="#portofolio"
                variant="outlined"
                size="large"
                startIcon={<PlayCircleIcon />}
                sx={{ px: 4, py: 1.75, fontWeight: 600, fontSize: "0.9rem", borderRadius: 2, color: C.primaryContainer, borderColor: C.primaryContainer, borderWidth: 2, bgcolor: C.surfaceBright, "&:hover": { bgcolor: C.surfaceContainer }, textTransform: "none", letterSpacing: "0.05em" }}
              >
                Lihat Demo
              </Button>
            </Stack>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ display: "flex" }}>
                {[1, 2, 3].map((i) => (
                  <Box key={i} sx={{ width: 40, height: 40, borderRadius: "50%", border: `2px solid ${C.surfaceBright}`, overflow: "hidden", ml: i > 1 ? -1.5 : 0, zIndex: 4 - i, bgcolor: C.surfaceContainerHigh }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://picsum.photos/seed/face${i}/40/40`} alt="klien" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </Box>
                ))}
              </Box>
              <Typography sx={{ fontSize: "0.875rem", color: C.onSurfaceVariant }}>
                <Box component="span" sx={{ fontWeight: 700, color: C.onBackground }}>500+</Box> agen properti telah bergabung
              </Typography>
            </Box>
          </Grid>

          {/* Right: Mockup */}
          <Grid size={{ xs: 12, lg: 6 }} sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Box sx={{ position: "relative", width: "100%", maxWidth: 560 }}>
              <Box sx={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", bgcolor: `${C.secondaryContainer}33`, filter: "blur(48px)", zIndex: 0 }} />
              <Box sx={{ position: "absolute", bottom: -40, left: -40, width: 240, height: 240, borderRadius: "50%", bgcolor: `${C.primaryContainer}1a`, filter: "blur(48px)", zIndex: 0 }} />

              <Box sx={{ position: "relative", zIndex: 2, borderRadius: "2rem", border: `12px solid ${C.surfaceContainerHighest}`, bgcolor: C.surfaceContainer, boxShadow: "0px 20px 40px rgba(15,23,42,0.12)", overflow: "hidden", transform: "rotate(-2deg)", transition: "transform 0.7s ease", "&:hover": { transform: "rotate(0deg)" } }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://picsum.photos/seed/tour360/800/600" alt="Virtual Tour Preview" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }} />
                <Box sx={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 1.5, px: 2, py: 1, borderRadius: 99, bgcolor: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", border: `1px solid ${C.outlineVariant}80` }}>
                  {["⊕", "360", "⛶"].map((icon) => (
                    <Box key={icon} sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.primaryContainer, fontSize: "0.9rem" }}>
                      {icon}
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Floating card */}
              <Box
                sx={{
                  position: "absolute", right: -32, bottom: 80, zIndex: 3,
                  bgcolor: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)",
                  border: `1px solid ${C.outlineVariant}80`, borderRadius: 3,
                  px: 2, py: 1.5, boxShadow: "0px 12px 24px rgba(15,23,42,0.08)",
                  display: "flex", alignItems: "center", gap: 1.5,
                  animation: "floatBounce 3s ease-in-out infinite",
                  "@keyframes floatBounce": {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-8px)" },
                  },
                }}
              >
                <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: C.surfaceContainer, display: "flex", alignItems: "center", justifyContent: "center", color: C.primary }}>
                  <VisibilityIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: "0.7rem", color: C.onSurfaceVariant, fontWeight: 500 }}>Peningkatan Engagement</Typography>
                  <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: C.onBackground }}>+300%</Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

// ─── Value Props Section ───────────────────────────────────────────────────────
export function ValuesSection() {
  const values = [
    { icon: <HdIcon sx={{ fontSize: 28 }} />, title: "Foto Resolusi 4K HDR", desc: "Kualitas gambar ultra-tajam yang menampilkan setiap detail properti dengan pencahayaan sempurna di setiap ruangan." },
    { icon: <LanguageIcon sx={{ fontSize: 28 }} />, title: "Listing Web Gratis", desc: "Setiap tur dilengkapi halaman web khusus berdesain premium yang dioptimasi penuh untuk mesin pencari (SEO)." },
    { icon: <TimerIcon sx={{ fontSize: 28 }} />, title: "Pengerjaan < 48 Jam", desc: "Proses cepat dari pengambilan gambar hingga tur virtual siap dipublikasikan, memastikan listing Anda segera tayang." },
    { icon: <PaymentsIcon sx={{ fontSize: 28 }} />, title: "Harga Kompetitif", desc: "Struktur harga yang transparan tanpa biaya tersembunyi, memberikan ROI terbaik untuk investasi pemasaran Anda." },
  ];
  return (
    <Box component="section" id="services" sx={{ py: { xs: 8, md: 12 }, bgcolor: C.surfaceContainerLowest, borderTop: `1px solid ${C.outlineVariant}33`, borderBottom: `1px solid ${C.outlineVariant}33` }}>
      <Container maxWidth="xl">
        <Box sx={{ textAlign: "center", maxWidth: 600, mx: "auto", mb: 7 }}>
          <Typography variant="h2" sx={{ fontSize: { xs: "1.75rem", md: "2.25rem" }, fontWeight: 700, color: C.onBackground, mb: 2, letterSpacing: "-0.01em" }}>
            Standar Baru dalam Pemasaran Properti
          </Typography>
          <Typography sx={{ color: C.onSurfaceVariant, lineHeight: 1.75 }}>
            Kami menggabungkan teknologi fotografi canggih dengan platform yang mudah digunakan untuk memberikan hasil maksimal bagi listing Anda.
          </Typography>
        </Box>
        <Grid container spacing={3}>
          {values.map((v) => (
            <Grid key={v.title} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card sx={{ p: 3.5, height: "100%", bgcolor: C.surfaceBright, border: `1px solid ${C.outlineVariant}4d`, boxShadow: "none", borderRadius: 2, transition: "all 0.25s", "&:hover": { boxShadow: "0px 12px 24px rgba(15,23,42,0.08)", borderColor: `${C.primaryContainer}4d`, "& .val-icon": { bgcolor: C.primaryContainer, color: C.onPrimary } } }}>
                <Box className="val-icon" sx={{ width: 56, height: 56, borderRadius: 2, bgcolor: C.surfaceContainerLow, color: C.primaryContainer, display: "flex", alignItems: "center", justifyContent: "center", mb: 3, transition: "all 0.25s" }}>
                  {v.icon}
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", color: C.onBackground, mb: 1 }}>{v.title}</Typography>
                <Typography sx={{ fontSize: "0.875rem", color: C.onSurfaceVariant, lineHeight: 1.7 }}>{v.desc}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

// ─── How It Works Section ──────────────────────────────────────────────────────
export function StepsSection() {
  const steps = [
    { n: 1, t: "Booking", d: "Pilih jadwal pemotretan yang sesuai dengan ketersediaan Anda dan properti.", icon: <CalendarMonthIcon sx={{ fontSize: 40 }} />, highlight: false },
    { n: 2, t: "Shooting", d: "Tim profesional kami akan mengambil gambar 360° dengan peralatan khusus.", icon: <CameraAltIcon sx={{ fontSize: 40 }} />, highlight: false },
    { n: 3, t: "Delivery", d: "Tur virtual dan link listing web akan dikirim dalam waktu kurang dari 48 jam.", icon: <SendIcon sx={{ fontSize: 40 }} />, highlight: true },
  ];
  return (
    <Box component="section" id="cara-kerja" sx={{ py: { xs: 8, md: 12 }, bgcolor: C.surfaceContainerLow, borderTop: `1px solid ${C.outlineVariant}33`, borderBottom: `1px solid ${C.outlineVariant}33` }}>
      <Container maxWidth="xl">
        <Box sx={{ textAlign: "center", maxWidth: 600, mx: "auto", mb: 7 }}>
          <Typography variant="h2" sx={{ fontSize: { xs: "1.75rem", md: "2.25rem" }, fontWeight: 700, color: C.onBackground, mb: 2, letterSpacing: "-0.01em" }}>
            Cara Kerja Kami
          </Typography>
          <Typography sx={{ color: C.onSurfaceVariant, lineHeight: 1.75 }}>
            Proses yang efisien dan transparan untuk menghasilkan tur virtual berkualitas tinggi.
          </Typography>
        </Box>
        <Box sx={{ position: "relative" }}>
          <Box sx={{ display: { xs: "none", md: "block" }, position: "absolute", top: 48, left: "15%", right: "15%", height: 2, bgcolor: `${C.outlineVariant}4d`, zIndex: 0 }} />
          <Grid container spacing={4}>
            {steps.map((step) => (
              <Grid key={step.n} size={{ xs: 12, md: 4 }}>
                <Box sx={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                  <Box sx={{ width: 96, height: 96, mx: "auto", borderRadius: "50%", bgcolor: step.highlight ? C.primaryContainer : C.surfaceBright, border: `4px solid ${C.surfaceContainerLow}`, display: "flex", alignItems: "center", justifyContent: "center", color: step.highlight ? C.onPrimary : C.primaryContainer, mb: 3, boxShadow: "0px 4px 12px rgba(15,23,42,0.05)" }}>
                    {step.icon}
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: "1.25rem", color: C.onBackground, mb: 1 }}>{step.n}. {step.t}</Typography>
                  <Typography sx={{ color: C.onSurfaceVariant, lineHeight: 1.7, maxWidth: 280, mx: "auto" }}>{step.d}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}

// ─── Testimonials Section ──────────────────────────────────────────────────────
type Testimonial = { name: string; role: string; text: string; avatar: string };
export function TestimonialsSection({ items }: { items: Testimonial[] }) {
  return (
    <Box component="section" sx={{ py: { xs: 8, md: 12 }, bgcolor: C.surfaceContainerLow, borderTop: `1px solid ${C.outlineVariant}33`, borderBottom: `1px solid ${C.outlineVariant}33` }}>
      <Container maxWidth="xl">
        <Box sx={{ textAlign: "center", maxWidth: 600, mx: "auto", mb: 7 }}>
          <Typography variant="h2" sx={{ fontSize: { xs: "1.75rem", md: "2.25rem" }, fontWeight: 700, color: C.onBackground, mb: 2, letterSpacing: "-0.01em" }}>
            Apa Kata Klien Kami
          </Typography>
          <Typography sx={{ color: C.onSurfaceVariant, lineHeight: 1.75 }}>
            Cerita sukses dari agen dan developer yang telah menggunakan layanan Vistura 360.
          </Typography>
        </Box>
        <Grid container spacing={3}>
          {items.map((t) => (
            <Grid key={t.name} size={{ xs: 12, md: 4 }}>
              <Card sx={{ p: 3.5, height: "100%", bgcolor: C.surfaceBright, border: `1px solid ${C.outlineVariant}4d`, boxShadow: "0px 4px 12px rgba(15,23,42,0.05)", borderRadius: 2 }}>
                <Box sx={{ display: "flex", gap: 0.25, mb: 2 }}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <StarIcon key={i} sx={{ fontSize: 18, color: "#FBBF24" }} />
                  ))}
                </Box>
                <Typography sx={{ color: C.onSurfaceVariant, lineHeight: 1.75, mb: 3, fontSize: "0.9rem" }}>
                  &ldquo;{t.text}&rdquo;
                </Typography>
                <Divider sx={{ mb: 2.5, borderColor: `${C.outlineVariant}4d` }} />
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.avatar} alt={t.name} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: C.onBackground }}>{t.name}</Typography>
                    <Typography sx={{ fontSize: "0.75rem", color: C.onSurfaceVariant }}>{t.role}</Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

// ─── Pricing Feature Row ───────────────────────────────────────────────────────
export function PricingFeatureRow({ text, included }: { text: string; included: boolean }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, opacity: included ? 1 : 0.4 }}>
      {included
        ? <CheckCircleIcon sx={{ fontSize: 20, color: C.primaryContainer, flexShrink: 0 }} />
        : <CancelIcon sx={{ fontSize: 20, color: C.onSurfaceVariant, flexShrink: 0 }} />
      }
      <Typography sx={{ fontSize: "0.875rem", color: C.onSurfaceVariant }}>{text}</Typography>
    </Box>
  );
}
