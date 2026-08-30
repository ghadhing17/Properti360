/**
 * Building blocks bersama untuk komponen form di /admin/settings.
 * Client components di folder ini meng-import langsung — TIDAK diekspor
 * lewat barrel modul (aturan AGENTS.md #1: jangan tarik client ke bundle page).
 */
import type { SxProps, Theme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

export const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 1,
    bgcolor: "white",
    "& fieldset": { borderColor: "#E2E8F0" },
    "&:hover fieldset": { borderColor: "#CBD5E1" },
    "&.Mui-focused fieldset": { borderColor: "#1D4ED8", borderWidth: 2 },
  },
  "& .MuiInputLabel-root": { fontSize: "0.85rem" },
  "& .MuiInputBase-input": { fontSize: "0.875rem" },
} as const;

export const saveButtonSx = {
  bgcolor: "#1D4ED8",
  "&:hover": { bgcolor: "#1E3A8A" },
  borderRadius: 1,
  fontWeight: 600,
} as const;

export const cardSx = {
  border: "1px solid #E2E8F0",
  borderRadius: 1,
  p: { xs: 2.5, md: 3 },
} as const;

type SectionCardProps = {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  sx?: SxProps<Theme>;
};

/** Kartu section: icon + judul + deskripsi + konten form. */
export function SectionCard({ icon, title, description, children, action, sx }: SectionCardProps) {
  return (
    <Paper elevation={0} sx={[cardSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1,
              bgcolor: "rgba(29,78,216,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "#0F172A" }}>{title}</Typography>
            {description ? (
              <Typography variant="caption" sx={{ color: "#64748B", display: "block", mt: 0.25, lineHeight: 1.5 }}>
                {description}
              </Typography>
            ) : null}
          </Box>
        </Box>
        {action}
      </Box>
      {children}
    </Paper>
  );
}
