import { requireRole } from "@/shared/auth/session";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import NewspaperIcon from "@mui/icons-material/Newspaper";
import ConstructionIcon from "@mui/icons-material/Construction";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  await requireRole("ADMIN");
  return (
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
        <NewspaperIcon sx={{ fontSize: 32, color: "#1D4ED8" }} />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 700, color: "#0F172A" }}>
        Blog
      </Typography>
      <Typography variant="body2" sx={{ color: "#64748B", mt: 1, maxWidth: 420, mx: "auto" }}>
        Kelola artikel blog &mdash; coming soon. Model BlogPost sudah ada di Prisma.
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75, mt: 2 }}>
        <ConstructionIcon sx={{ fontSize: 14, color: "#94A3B8" }} />
        <Typography variant="caption" sx={{ color: "#94A3B8" }}>
          Sedang dalam pengembangan
        </Typography>
      </Box>
    </Paper>
  );
}
