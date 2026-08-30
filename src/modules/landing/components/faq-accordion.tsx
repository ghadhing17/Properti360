"use client";

import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const DEFAULT_FAQS = [
  {
    q: "Berapa lama proses dari foto sampai listing live?",
    a: "Target <15 menit dari sisi admin setelah sesi foto. Upload foto & paste embed Panoee, listing langsung masuk sitemap.",
  },
  {
    q: "Apakah listing bisa muncul di Google?",
    a: "Ya. Semua halaman listing di-render SSR/SSG, punya meta title/description unik, slug bersih, dan structured data RealEstateListing.",
  },
  {
    q: "Apakah viewer 360 memperlambat website?",
    a: "Tidak. Kami pakai facade pattern: cover thumbnail dulu, iframe Panoee baru dimuat setelah klik — jadi tidak membebani LCP.",
  },
  {
    q: "Area coverage di mana saja?",
    a: "Semarang dan sekitarnya untuk MVP, ekspansi ke kota lain bertahap. Hubungi kami untuk jadwal.",
  },
  {
    q: "Bagaimana jika storage VPS penuh?",
    a: "Migrasi ke Biznet Gio Object Storage (S3-compatible) tanpa ubah kode — cukup ganti STORAGE_DRIVER via environment variable.",
  },
];

type FaqItem = { q: string; a: string };

export function FaqAccordion({ items }: { items?: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const FAQS = items && items.length > 0 ? items : DEFAULT_FAQS;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <Accordion
            key={i}
            expanded={isOpen}
            onChange={() => setOpen(isOpen ? null : i)}
            slotProps={{ transition: { timeout: 200 } }}
            sx={{
              "&.Mui-expanded": { borderColor: "rgba(29,78,216,0.4)", bgcolor: "rgba(29,78,216,0.02)" },
              "& .MuiAccordionSummary-root": { "&:hover": { bgcolor: "rgba(29,78,216,0.03)" } },
            }}
          >
            <AccordionSummary
              expandIcon={
                <Box
                  sx={{
                    display: "flex",
                    height: 26,
                    width: 26,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    bgcolor: isOpen ? "primary.main" : "rgba(29,78,216,0.08)",
                    color: isOpen ? "white" : "primary.main",
                    transition: "all 0.2s",
                  }}
                >
                  <ExpandMoreIcon fontSize="small" />
                </Box>
              }
            >
              <Typography variant="body1" sx={{ fontWeight: 500, color: "text.primary", fontSize: "0.95rem" }}>
                {item.q}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75, pl: 0.5 }}>
                {item.a}
              </Typography>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}