import Link from "next/link";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import { FaqAccordion } from "@/modules/landing/components/faq-accordion";
import { ListingCard } from "@/modules/landing/components/listing-card";
import { HeroSection, ValuesSection, StepsSection, TestimonialsSection, PricingFeatureRow } from "@/modules/landing/components/marketing-sections";
import { getPortfolioListings, getActiveServiceProducts } from "@/modules/landing/queries/landing";

export const revalidate = 60;

// ─── Color tokens (matches Vistura 360 Stitch design system) ─────────────────
const C = {
  primary: "#0037b0",
  primaryContainer: "#1D4ED8",
  onPrimary: "#ffffff",
  surfaceBright: "#faf8ff",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f2f3ff",
  surfaceContainer: "#eaedff",
  surfaceContainerHigh: "#e2e7ff",
  onBackground: "#131b2e",
  onSurfaceVariant: "#434655",
  outlineVariant: "#c4c5d7",
};

async function getPortfolio() {
  return getPortfolioListings();
}

async function getProducts() {
  return getActiveServiceProducts();
}

const MOCK_PORTFOLIO = [
  { slug: "rumah-2-lantai-semarang-tembalang", title: "Rumah 2 Lantai Minimalis Tembalang", city: "Semarang", price: 1850000000, thumbnail: "https://picsum.photos/seed/prop1/600/400" },
  { slug: "apartemen-marina-view", title: "Apartemen Marina View 2BR Full Furnished", city: "Semarang", price: 950000000, thumbnail: "https://picsum.photos/seed/prop2/600/400" },
  { slug: "ruko-gajah-mada-strategis", title: "Ruko Gajah Mada Strategis — Siap Usaha", city: "Semarang", price: 3200000000, thumbnail: "https://picsum.photos/seed/prop3/600/400" },
  { slug: "venue-gedung-pernikahan-elite", title: "Venue Gedung Pernikahan Elite 800 Pax", city: "Semarang", price: null, thumbnail: "https://picsum.photos/seed/prop4/600/400" },
  { slug: "hotel-boutique-kota-lama", title: "Hotel Boutique Kota Lama — 24 Kamar", city: "Semarang", price: null, thumbnail: "https://picsum.photos/seed/prop5/600/400" },
  { slug: "rumah-cluster-bsb-city", title: "Rumah Cluster BSB City — Hook 2 Lantai", city: "Semarang", price: 2400000000, thumbnail: "https://picsum.photos/seed/prop6/600/400" },
];

const MOCK_PRICING = [
  {
    name: "Starter",
    price: "Rp 750.000",
    desc: "Untuk apartemen atau rumah kecil",
    feat: [
      { text: "Hingga 5 titik panorama", included: true },
      { text: "Hosting gratis 6 bulan", included: true },
      { text: "Resolusi HDR 4K", included: true },
      { text: "Landing page khusus", included: false },
    ],
    popular: false,
  },
  {
    name: "Professional",
    price: "Rp 1.500.000",
    desc: "Ideal untuk rumah standar & ruko",
    feat: [
      { text: "Hingga 15 titik panorama", included: true },
      { text: "Hosting gratis 12 bulan", included: true },
      { text: "Resolusi HDR 4K", included: true },
      { text: "Landing page khusus (SEO)", included: true },
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Hubungi Kami",
    desc: "Untuk proyek komersial & vila besar",
    feat: [
      { text: "Titik panorama tak terbatas", included: true },
      { text: "Hosting kustom", included: true },
      { text: "Resolusi HDR 8K", included: true },
      { text: "Integrasi website perusahaan", included: true },
    ],
    popular: false,
  },
];

const TESTIMONIALS = [
  { name: "Andi Pratama", role: "Real Estate Agent", text: "Tur virtual dari Vistura benar-benar mengubah cara saya berjualan. Klien dari luar kota bisa melihat properti dengan detail tanpa harus datang, penjualan saya meningkat drastis!", avatar: "https://picsum.photos/seed/ava1/48/48" },
  { name: "Siti Nurbaya", role: "Property Developer", text: "Kualitas fotonya sangat luar biasa, warnanya cerah dan sangat tajam. Proses pengerjaannya juga sangat cepat, sesuai janji kurang dari 48 jam sudah siap.", avatar: "https://picsum.photos/seed/ava2/48/48" },
  { name: "Budi Santoso", role: "Broker Independen", text: "Landing page gratisnya sangat membantu untuk SEO dan memudahkan saya membagikan link ke calon pembeli. Layanan profesional dengan harga terjangkau.", avatar: "https://picsum.photos/seed/ava3/48/48" },
];

const FAQ_ITEMS = [
  { q: "Berapa lama proses pemotretan berlangsung?", a: "Proses pemotretan untuk properti standar (paket Starter/Professional) biasanya memakan waktu sekitar 1 hingga 2 jam, tergantung dari ukuran dan kesiapan kondisi properti saat tim kami tiba di lokasi." },
  { q: "Kapan hasil tur virtual bisa saya terima?", a: "Kami menjamin hasil akhir berupa link tur virtual dan halaman web khusus akan dikirimkan kepada Anda dalam waktu maksimal 48 jam setelah proses pemotretan selesai." },
  { q: "Apakah tur virtual ini bisa dibuka di HP?", a: "Tentu. Tur virtual kami 100% responsif dan kompatibel dengan semua perangkat, termasuk smartphone (iOS & Android), tablet, maupun desktop tanpa perlu mengunduh aplikasi tambahan." },
  { q: "Bagaimana cara memasang tur ini di website saya sendiri?", a: "Kami akan memberikan kode embed (iframe) yang bisa dengan mudah disalin dan ditempel ke dalam kode HTML atau CMS website Anda (seperti WordPress, Wix, dsb)." },
  { q: "Area coverage di mana saja?", a: "Saat ini melayani Semarang, Solo, Yogyakarta, Surabaya, dan Malang. Untuk kota lain tersedia dengan biaya transportasi tambahan." },
];

export default async function MarketingPage() {
  const dbPortfolio = await getPortfolio();
  const portfolio = dbPortfolio && dbPortfolio.length > 0 ? dbPortfolio : MOCK_PORTFOLIO;
  const products = await getProducts();

  return (
    <Box sx={{ bgcolor: C.surfaceBright, color: C.onBackground }}>

      {/* HERO — Client Component (uses MUI icons) */}
      <HeroSection />

      {/* VALUE PROPS — Client Component */}
      <ValuesSection />

      {/* ═══════════════════════════════════════════════════════════
          PORTFOLIO
      ═══════════════════════════════════════════════════════════ */}
      <Box component="section" id="portofolio" sx={{ py: { xs: 8, md: 12 }, bgcolor: C.surfaceBright }}>
        <Container maxWidth="xl">
          <Box sx={{ textAlign: "center", maxWidth: 600, mx: "auto", mb: 7 }}>
            <Typography variant="h2" sx={{ fontSize: { xs: "1.75rem", md: "2.25rem" }, fontWeight: 700, color: C.onBackground, mb: 2, letterSpacing: "-0.01em" }}>
              Jelajahi Portfolio Kami
            </Typography>
            <Typography sx={{ color: C.onSurfaceVariant, lineHeight: 1.75 }}>
              Rasakan sendiri pengalaman imersif dari berbagai tipe properti yang telah kami dokumentasikan.
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {portfolio.map((p) => (
              <Grid key={p.slug} size={{ xs: 12, sm: 6, md: 4 }}>
                <ListingCard slug={p.slug} title={p.title} city={p.city} price={p.price} thumbnail={p.thumbnail} />
              </Grid>
            ))}
          </Grid>
          <Box sx={{ textAlign: "center", mt: 5 }}>
            <Button
              component={Link}
              href="/listing"
              variant="outlined"
              sx={{ px: 4, py: 1.25, borderRadius: 2, borderColor: C.primaryContainer, borderWidth: 2, color: C.primaryContainer, fontWeight: 600, textTransform: "none", "&:hover": { bgcolor: C.surfaceContainer } }}
            >
              Lihat Semua Portfolio
            </Button>
          </Box>
        </Container>
      </Box>

      {/* HOW IT WORKS — Client Component */}
      <StepsSection />

      {/* ═══════════════════════════════════════════════════════════
          PRICING — Starter / Professional / Enterprise
      ═══════════════════════════════════════════════════════════ */}
      <Box component="section" id="harga" sx={{ py: { xs: 8, md: 12 }, bgcolor: C.surfaceBright }}>
        <Container maxWidth="xl">
          <Box sx={{ textAlign: "center", maxWidth: 600, mx: "auto", mb: 7 }}>
            <Typography variant="h2" sx={{ fontSize: { xs: "1.75rem", md: "2.25rem" }, fontWeight: 700, color: C.onBackground, mb: 2, letterSpacing: "-0.01em" }}>
              Pilihan Paket Transparan
            </Typography>
            <Typography sx={{ color: C.onSurfaceVariant, lineHeight: 1.75 }}>
              Pilih paket yang paling sesuai dengan kebutuhan pemasaran properti Anda.
            </Typography>
          </Box>

          <Grid container spacing={3} sx={{ alignItems: "center", justifyContent: "center" }}>
            {(products.length > 0 ? products : MOCK_PRICING).map((pkg) => {
              const isDb = "features" in pkg;
              const name = pkg.name;
              const price = isDb
                ? (pkg as { price: number | null }).price === null
                  ? "Hubungi Kami"
                  : `Rp ${((pkg as { price: number | null }).price! / 1000).toLocaleString("id-ID")}.000`
                : (pkg as { price: string }).price;
              const feat = isDb
                ? (pkg as { features: string[] }).features.map((f: string) => ({ text: f, included: true }))
                : (pkg as { feat: { text: string; included: boolean }[] }).feat;
              const popular = isDb ? (pkg as { isPopular: boolean }).isPopular : (pkg as { popular: boolean }).popular;
              const desc = isDb ? "" : (pkg as { desc?: string }).desc ?? "";
              const productId = isDb ? (pkg as { id: string }).id : undefined;

              return (
                <Grid key={name} size={{ xs: 12, sm: 6, md: 3 }}>
                   <Card
                    sx={{
                      p: 4,
                      pt: popular ? 5 : 4,
                      textAlign: "center",
                      position: "relative",
                      overflow: "visible",
                      bgcolor: popular ? C.surfaceContainer : C.surfaceBright,
                      border: popular ? `2px solid #2952e3` : `1px solid ${C.outlineVariant}4d`,
                      borderRadius: "16px",
                      boxShadow: popular ? "0px 12px 24px rgba(15,23,42,0.08)" : "none",
                      transform: popular ? { md: "translateY(-16px)" } : "none",
                    }}
                  >
                    {popular && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          zIndex: 2,
                          background: "linear-gradient(90deg, #4f6df5, #2952e3)",
                          color: "white",
                          px: "16px",
                          py: "6px",
                          borderRadius: "999px",
                          fontWeight: 600,
                          fontSize: "14px",
                          whiteSpace: "nowrap",
                          boxShadow: "0 2px 8px rgba(41,82,227,0.35)",
                        }}
                      >
                        Paling Populer
                      </Box>
                    )}

                    <Typography sx={{ fontWeight: 700, fontSize: "1.25rem", color: C.onBackground, mb: 0.5 }}>{name}</Typography>
                    {desc && <Typography sx={{ fontSize: "0.8rem", color: C.onSurfaceVariant, mb: 3 }}>{desc}</Typography>}

                    <Typography sx={{ fontSize: "1.9rem", fontWeight: 700, color: popular ? C.primaryContainer : C.onBackground, mb: 3, letterSpacing: "-0.02em" }}>
                      {price}
                    </Typography>

                    {/* PricingFeatureRow is a Client Component — renders CheckCircle/Cancel icons */}
                    <Box sx={{ textAlign: "left", mb: 4 }}>
                      <Stack spacing={1.5}>
                        {feat.map((f: { text: string; included: boolean }) => (
                          <PricingFeatureRow key={f.text} text={f.text} included={f.included} />
                        ))}
                      </Stack>
                    </Box>

                    <Button
                      component={Link}
                      href={productId ? `/booking?product=${productId}` : "/booking"}
                      variant={popular ? "contained" : "outlined"}
                      fullWidth
                      sx={{
                        py: 1.5, fontWeight: 600, borderRadius: 2, textTransform: "none", fontSize: "0.9rem",
                        ...(popular
                          ? { bgcolor: C.primaryContainer, color: C.onPrimary, "&:hover": { bgcolor: C.primary } }
                          : { borderColor: C.primaryContainer, borderWidth: 2, color: C.primaryContainer, "&:hover": { bgcolor: C.surfaceContainer } }),
                      }}
                    >
                      {name === "Enterprise" ? "Hubungi Sales" : `Pilih ${name}`}
                    </Button>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>

      {/* TESTIMONIALS — Client Component */}
      <TestimonialsSection items={TESTIMONIALS} />

      {/* ═══════════════════════════════════════════════════════════
          FAQ
      ═══════════════════════════════════════════════════════════ */}
      <Box component="section" id="faq" sx={{ py: { xs: 8, md: 12 }, bgcolor: C.surfaceBright }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: "center", mb: 7 }}>
            <Typography variant="h2" sx={{ fontSize: { xs: "1.75rem", md: "2.25rem" }, fontWeight: 700, color: C.onBackground, mb: 2, letterSpacing: "-0.01em" }}>
              Pertanyaan Umum (FAQ)
            </Typography>
            <Typography sx={{ color: C.onSurfaceVariant, lineHeight: 1.75 }}>
              Jawaban atas pertanyaan yang sering diajukan mengenai layanan kami.
            </Typography>
          </Box>
          <FaqAccordion items={FAQ_ITEMS} />
        </Container>
      </Box>
    </Box>
  );
}
