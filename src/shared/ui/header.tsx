"use client";

import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

// Vistura 360 color tokens
const C = {
  primary: "#0037b0",
  primaryContainer: "#1D4ED8",
  onPrimary: "#ffffff",
  surfaceBright: "#faf8ff",
  surfaceContainerLow: "#f2f3ff",
  outlineVariant: "#c4c5d7",
  onBackground: "#131b2e",
  onSurfaceVariant: "#434655",
};

const NAV_LINKS = [
  { href: "#services", label: "Layanan" },
  { href: "#portofolio", label: "Portfolio" },
  { href: "#harga", label: "Harga" },
  { href: "#faq", label: "FAQ" },
];

function Logo() {
  return (
    <Link href="/" underline="none" sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
      <Box
        sx={{
          display: "flex",
          height: 36,
          width: 36,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 1.5,
          background: `linear-gradient(135deg, ${C.primaryContainer} 0%, #3B82F6 100%)`,
          color: C.onPrimary,
          fontWeight: 900,
          fontSize: "0.72rem",
          letterSpacing: "-0.03em",
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(29,78,216,0.25)",
        }}
      >
        360
      </Box>
      <Typography
        sx={{
          fontWeight: 700,
          color: C.onBackground,
          letterSpacing: "-0.02em",
          fontSize: "1.1rem",
          lineHeight: 1,
        }}
      >
        Vistura <Box component="span" sx={{ color: C.primaryContainer }}>360</Box>
      </Typography>
    </Link>
  );
}

export function MarketingHeader() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AppBar
      id="mainNav"
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: scrolled ? "rgba(250,248,255,0.92)" : "rgba(250,248,255,0.85)",
        backdropFilter: "blur(16px) saturate(180%)",
        borderBottom: `1px solid ${C.outlineVariant}4d`,
        boxShadow: scrolled ? "0 2px 12px rgba(15,23,42,0.06)" : "none",
        transition: "all 0.3s ease",
      }}
    >
      <Container maxWidth="xl">
        <Toolbar
          disableGutters
          sx={{ justifyContent: "space-between", gap: 2, minHeight: { xs: 64, md: 72 } }}
        >
          <Logo />

          {/* Desktop nav */}
          <Box
            component="nav"
            sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 0.5 }}
          >
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                underline="none"
                sx={{
                  px: 1.75,
                  py: 1,
                  borderRadius: 1.5,
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: C.onSurfaceVariant,
                  letterSpacing: "0.01em",
                  transition: "all 0.15s",
                  "&:hover": { color: C.primaryContainer, bgcolor: `${C.primaryContainer}0d` },
                }}
              >
                {l.label}
              </Link>
            ))}
          </Box>

          {/* Desktop CTAs */}
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1.5 }}>
            <Button
              component="a"
              href="/login"
              sx={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: C.onSurfaceVariant,
                px: 2,
                borderRadius: 1.5,
                textTransform: "none",
                "&:hover": { color: C.primaryContainer, bgcolor: `${C.primaryContainer}0d` },
              }}
            >
              Masuk
            </Button>
            <Button
              component="a"
              href="#contact"
              variant="contained"
              sx={{
                px: 3,
                py: 1,
                fontWeight: 600,
                fontSize: "0.875rem",
                borderRadius: 1.5,
                bgcolor: C.primaryContainer,
                color: C.onPrimary,
                textTransform: "none",
                letterSpacing: "0.02em",
                boxShadow: "0 2px 8px rgba(29,78,216,0.25)",
                "&:hover": {
                  bgcolor: C.primary,
                  boxShadow: "0 4px 16px rgba(29,78,216,0.35)",
                },
                transition: "all 0.2s",
              }}
            >
              Mulai Sekarang
            </Button>
          </Box>

          {/* Mobile menu button */}
          <IconButton
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: "none" }, color: C.onBackground }}
            aria-label="Buka menu"
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </Container>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: 280,
              bgcolor: C.surfaceBright,
              borderLeft: `1px solid ${C.outlineVariant}4d`,
            },
          },
        }}
      >
        <Box sx={{ p: 2.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Logo />
            <IconButton
              onClick={() => setMobileOpen(false)}
              sx={{ color: C.onSurfaceVariant }}
              aria-label="Tutup menu"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Divider sx={{ borderColor: `${C.outlineVariant}4d` }} />

        <List sx={{ px: 2, pt: 2 }}>
          {NAV_LINKS.map((l) => (
            <ListItem key={l.label} disablePadding sx={{ mb: 0.25 }}>
              <Button
                component="a"
                href={l.href}
                onClick={() => setMobileOpen(false)}
                fullWidth
                sx={{
                  justifyContent: "flex-start",
                  color: C.onSurfaceVariant,
                  fontWeight: 600,
                  borderRadius: 1.5,
                  py: 1.25,
                  px: 2,
                  fontSize: "0.9rem",
                  textTransform: "none",
                  "&:hover": { color: C.primaryContainer, bgcolor: `${C.primaryContainer}0d` },
                }}
              >
                {l.label}
              </Button>
            </ListItem>
          ))}
          <ListItem disablePadding sx={{ mb: 0.25 }}>
            <Button
              component="a"
              href="/login"
              onClick={() => setMobileOpen(false)}
              fullWidth
              sx={{
                justifyContent: "flex-start",
                color: C.onSurfaceVariant,
                fontWeight: 600,
                borderRadius: 1.5,
                py: 1.25,
                px: 2,
                fontSize: "0.9rem",
                textTransform: "none",
                "&:hover": { color: C.primaryContainer, bgcolor: `${C.primaryContainer}0d` },
              }}
            >
              Masuk
            </Button>
          </ListItem>
        </List>

        <Box sx={{ px: 2, pt: 1 }}>
          <Button
            component="a"
            href="#contact"
            variant="contained"
            fullWidth
            onClick={() => setMobileOpen(false)}
            sx={{
              py: 1.5,
              fontWeight: 600,
              borderRadius: 1.5,
              bgcolor: C.primaryContainer,
              color: C.onPrimary,
              textTransform: "none",
              "&:hover": { bgcolor: C.primary },
            }}
          >
            Mulai Sekarang
          </Button>
        </Box>
      </Drawer>
    </AppBar>
  );
}
