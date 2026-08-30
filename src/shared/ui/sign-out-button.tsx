"use client";

import { signOut } from "next-auth/react";
import Button from "@mui/material/Button";
import LogoutIcon from "@mui/icons-material/Logout";

export function SignOutButton() {
  return (
    <Button variant="outlined" size="small" startIcon={<LogoutIcon sx={{ fontSize: 16 }} />} onClick={() => signOut({ callbackUrl: "/login" })} sx={{ borderColor: "#E2E8F0", color: "#0F172A", bgcolor: "white", "&:hover": { bgcolor: "#F8FAFC" } }}>
      Logout
    </Button>
  );
}
