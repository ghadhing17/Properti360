import { requireRole } from "@/shared/auth/session";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import SettingsIcon from "@mui/icons-material/Settings";
import ConstructionIcon from "@mui/icons-material/Construction";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireRole("ADMIN");
  return (
    <Stack spacing={3} sx={{ maxWidth: 600 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 1,
          border: "1px solid #E2E8F0",
          p: { xs: 4, md: 6 },
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: 1,
            bgcolor: "rgba(29,78,216,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2,
          }}
        >
          <SettingsIcon sx={{ fontSize: 32, color: "#1D4ED8" }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#0F172A" }}>
          Settings
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748B", mt: 1, maxWidth: 360, mx: "auto" }}>
          Pengaturan admin &mdash; coming soon.
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75, mt: 2 }}>
          <ConstructionIcon sx={{ fontSize: 14, color: "#94A3B8" }} />
          <Typography variant="caption" sx={{ color: "#94A3B8" }}>
            Sedang dalam pengembangan
          </Typography>
        </Box>
      </Paper>
    </Stack>
  );
}
