import { getCurrentUser } from "@/shared/auth/session";
import { SignOutButton } from "@/shared/ui/sign-out-button";
import { DashboardSidebar } from "@/shared/ui/sidebar";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";

const drawerWidth = 260;

/**
 * Shell layout bersama untuk group (dashboard) dan (cms).
 * Render murni — proteksi role dilakukan di masing-masing page (requireRole).
 */
export async function DashboardShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const role = user?.role ?? "CUSTOMER";

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#F1F5F9" }}>
      <DashboardSidebar role={role} />

      <Box
        component="div"
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: "100vh",
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: "white",
            borderBottom: "1px solid #E2E8F0",
            color: "#0F172A",
            zIndex: 1199,
          }}
        >
          <Toolbar sx={{ minHeight: 56, px: { xs: 2, md: 3 }, gap: 2 }}>
            {/* Spacer for mobile hamburger button */}
            <Box sx={{ width: { xs: 40, md: 0 }, flexShrink: 0 }} />

            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, color: "#0F172A", flexGrow: 1 }}
            >
              {role === "ADMIN" ? "Admin Dashboard" : "Customer Dashboard"}
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {user && (
                <Chip
                  label={`${user.name ?? user.email} · ${user.role}`}
                  size="small"
                  sx={{
                    display: { xs: "none", sm: "flex" },
                    bgcolor: "#F1F5F9",
                    color: "#64748B",
                    fontWeight: 500,
                    fontSize: "0.72rem",
                    border: "1px solid #E2E8F0",
                  }}
                />
              )}
              {user ? (
                <SignOutButton />
              ) : (
                <a
                  href="/login"
                  style={{
                    borderRadius: 4,
                    background: "#1D4ED8",
                    padding: "6px 14px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "white",
                    textDecoration: "none",
                  }}
                >
                  Login
                </a>
              )}
            </Box>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
