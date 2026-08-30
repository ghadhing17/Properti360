"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ArticleIcon from "@mui/icons-material/Article";
import CategoryIcon from "@mui/icons-material/Category";
import ContactsIcon from "@mui/icons-material/Contacts";
import NewspaperIcon from "@mui/icons-material/Newspaper";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import HomeIcon from "@mui/icons-material/Home";
import InventoryIcon from "@mui/icons-material/Inventory";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PersonIcon from "@mui/icons-material/Person";

type Item = { href: string; label: string; icon: React.ReactNode };

const ADMIN_ITEMS: Item[] = [
  { href: "/admin", label: "Dashboard", icon: <DashboardIcon sx={{ fontSize: 20 }} /> },
  { href: "/admin/listings", label: "Listings", icon: <ArticleIcon sx={{ fontSize: 20 }} /> },
  { href: "/admin/categories", label: "Categories", icon: <CategoryIcon sx={{ fontSize: 20 }} /> },
  { href: "/admin/leads", label: "Leads", icon: <ContactsIcon sx={{ fontSize: 20 }} /> },
  { href: "/admin/bookings", label: "Booking", icon: <CalendarMonthIcon sx={{ fontSize: 20 }} /> },
  { href: "/admin/products", label: "Produk", icon: <InventoryIcon sx={{ fontSize: 20 }} /> },
  { href: "/admin/blog", label: "Blog", icon: <NewspaperIcon sx={{ fontSize: 20 }} /> },
  { href: "/admin/settings", label: "Settings", icon: <SettingsIcon sx={{ fontSize: 20 }} /> },
];

const CUSTOMER_ITEMS: Item[] = [
  { href: "/customer", label: "Dashboard", icon: <DashboardIcon sx={{ fontSize: 20 }} /> },
  { href: "/customer/listings", label: "Listing Saya", icon: <ArticleIcon sx={{ fontSize: 20 }} /> },
  { href: "/customer/settings", label: "Settings", icon: <SettingsIcon sx={{ fontSize: 20 }} /> },
];

const drawerWidth = 260;

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin" || href === "/customer") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export function DashboardSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = role === "ADMIN" ? ADMIN_ITEMS : CUSTOMER_ITEMS;
  const isAdmin = role === "ADMIN";

  const drawer = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "linear-gradient(180deg, #1E3A8A 0%, #1D4ED8 100%)",
        color: "white",
      }}
    >
      {/* Logo / Brand */}
      <Box sx={{ px: 3, py: 2.5, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1,
            bgcolor: "rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <HomeIcon sx={{ fontSize: 20, color: "white" }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "white", lineHeight: 1.2 }}>
            Properti 360
          </Typography>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.68rem" }}>
            {isAdmin ? "Admin Panel" : "Customer Portal"}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mx: 2 }} />

      {/* Role badge */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 1,
            borderRadius: 1,
            bgcolor: "rgba(255,255,255,0.08)",
          }}
        >
          <Avatar
            sx={{
              width: 28,
              height: 28,
              bgcolor: isAdmin ? "rgba(96,165,250,0.3)" : "rgba(52,211,153,0.3)",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "white",
            }}
          >
            {isAdmin ? <AdminPanelSettingsIcon sx={{ fontSize: 16 }} /> : <PersonIcon sx={{ fontSize: 16 }} />}
          </Avatar>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: "0.72rem" }}>
            {isAdmin ? "Administrator" : "Customer"}
          </Typography>
        </Box>
      </Box>

      {/* Nav label */}
      <Typography
        variant="caption"
        sx={{
          px: 3,
          pb: 0.5,
          pt: 1,
          color: "rgba(255,255,255,0.4)",
          fontWeight: 600,
          fontSize: "0.65rem",
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        Menu
      </Typography>

      {/* Nav items */}
      <List sx={{ px: 1.5, py: 0, flex: 1 }}>
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                px: 1.5,
                py: 1,
                color: active ? "white" : "rgba(255,255,255,0.65)",
                bgcolor: active ? "rgba(255,255,255,0.15)" : "transparent",
                "&:hover": {
                  bgcolor: active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)",
                  color: "white",
                },
                transition: "all 0.15s ease",
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 34,
                  color: active ? "white" : "rgba(255,255,255,0.55)",
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{ primary: { style: { fontSize: "0.85rem", fontWeight: active ? 600 : 400 } } }}
              />
              {active && (
                <Box
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    bgcolor: "white",
                    ml: 1,
                    flexShrink: 0,
                  }}
                />
              )}
            </ListItemButton>
          );
        })}
      </List>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mx: 2, mb: 1 }} />

      {/* Footer — sign out */}
      <Box sx={{ px: 1.5, pb: 2 }}>
        <Tooltip title="Keluar dari akun" placement="right">
          <ListItemButton
            onClick={() => signOut({ callbackUrl: "/login" })}
            sx={{
              borderRadius: 1,
              px: 1.5,
              py: 1,
              color: "rgba(255,255,255,0.65)",
              "&:hover": { bgcolor: "rgba(239,68,68,0.15)", color: "#FCA5A5" },
              transition: "all 0.15s ease",
            }}
          >
            <ListItemIcon sx={{ minWidth: 34, color: "inherit" }}>
              <LogoutIcon sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              slotProps={{ primary: { style: { fontSize: "0.85rem", fontWeight: 400 } } }}
            />
          </ListItemButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <IconButton
        onClick={() => setMobileOpen(!mobileOpen)}
        sx={{
          position: "fixed",
          left: 12,
          top: 10,
          zIndex: 1300,
          display: { md: "none" },
          bgcolor: "#1E3A8A",
          color: "white",
          width: 36,
          height: 36,
          "&:hover": { bgcolor: "#1D4ED8" },
          boxShadow: "0 2px 8px rgba(30,58,138,0.4)",
        }}
      >
        <MenuIcon sx={{ fontSize: 20 }} />
      </IconButton>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            border: 0,
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            border: 0,
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </>
  );
}
