import { requireRole } from "@/shared/auth/session";
import { getCustomerProfile } from "@/modules/dashboard/queries/listings";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BadgeIcon from "@mui/icons-material/Badge";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export const dynamic = "force-dynamic";

export default async function CustomerSettingsPage() {
  const user = await requireRole(["ADMIN", "CUSTOMER"]);
  const dbUser = await getCustomerProfile(user.id);

  const rows = [
    { icon: <PersonIcon sx={{ fontSize: 16 }} />, label: "Nama", value: dbUser?.name ?? user.name ?? "—" },
    { icon: <EmailIcon sx={{ fontSize: 16 }} />, label: "Email", value: dbUser?.email ?? user.email ?? "—" },
    { icon: <PhoneIcon sx={{ fontSize: 16 }} />, label: "No HP", value: dbUser?.phone ?? "—" },
    { icon: <BadgeIcon sx={{ fontSize: 16 }} />, label: "Role", value: dbUser?.role ?? user.role ?? "—" },
    {
      icon: <CalendarTodayIcon sx={{ fontSize: 16 }} />,
      label: "Bergabung",
      value: dbUser?.createdAt
        ? new Date(dbUser.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
        : "—",
    },
  ];

  const initials = (dbUser?.name ?? user.name ?? user.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <Stack spacing={3} sx={{ maxWidth: 600 }}>
      {/* Profile card */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 1,
          border: "1px solid #E2E8F0",
          overflow: "hidden",
        }}
      >
        {/* Banner */}
        <Box sx={{ height: 80, background: "linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%)" }} />

        {/* Avatar + name */}
        <Box sx={{ px: 3, pb: 3, mt: -4 }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: "white",
              color: "#1D4ED8",
              fontWeight: 700,
              fontSize: "1.2rem",
              border: "3px solid white",
              boxShadow: "0 2px 8px rgba(15,23,42,0.12)",
            }}
          >
            {initials}
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#0F172A", mt: 1.5 }}>
            {dbUser?.name ?? user.name ?? "Pengguna"}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
            <Typography variant="body2" sx={{ color: "#64748B" }}>
              {dbUser?.email ?? user.email}
            </Typography>
            <Chip
              label={dbUser?.role ?? user.role}
              size="small"
              sx={{
                bgcolor: dbUser?.role === "ADMIN" ? "rgba(29,78,216,0.1)" : "rgba(22,163,74,0.1)",
                color: dbUser?.role === "ADMIN" ? "#1D4ED8" : "#16A34A",
                fontWeight: 600,
                fontSize: "0.7rem",
                height: 20,
              }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Info rows */}
      <Paper elevation={0} sx={{ borderRadius: 1, border: "1px solid #E2E8F0" }}>
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #F1F5F9" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0F172A" }}>
            Informasi Akun
          </Typography>
        </Box>
        <Box sx={{ px: 3, py: 1 }}>
          {rows.map((row, i) => (
            <Box key={row.label}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.75 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "#94A3B8" }}>
                  {row.icon}
                  <Typography variant="body2" sx={{ color: "#64748B" }}>
                    {row.label}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#0F172A" }}>
                  {row.value}
                </Typography>
              </Box>
              {i < rows.length - 1 && <Divider sx={{ borderColor: "#F1F5F9" }} />}
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Info note */}
      <Box sx={{ display: "flex", gap: 1.5, p: 2, borderRadius: 1, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
        <InfoOutlinedIcon sx={{ fontSize: 18, color: "#94A3B8", flexShrink: 0, mt: 0.1 }} />
        <Typography variant="caption" sx={{ color: "#64748B", lineHeight: 1.6 }}>
          Untuk ganti password atau info kontak, hubungi admin. Info kontak listing bisa diubah per-listing via halaman Kelola.
        </Typography>
      </Box>
    </Stack>
  );
}
