"use client";

import { createTheme } from "@mui/material/styles";

export const muiTheme = createTheme({
  palette: {
    primary: { main: "#1D4ED8", dark: "#1E3A8A", light: "#60A5FA", contrastText: "#FFFFFF" },
    secondary: { main: "#60A5FA", contrastText: "#0F172A" },
    background: { default: "#F8FAFC", paper: "#FFFFFF" },
    text: { primary: "#0F172A", secondary: "#64748B" },
    success: { main: "#16A34A" },
    warning: { main: "#F59E0B" },
    error: { main: "#DC2626" },
    divider: "#E2E8F0",
  },
  typography: {
    fontFamily: "var(--font-geist-sans, Inter), ui-sans-serif, system-ui, sans-serif",
    h1: { fontWeight: 800, color: "#0F172A", lineHeight: 1.1, letterSpacing: "-0.03em" },
    h2: { fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em" },
    h3: { fontWeight: 600, color: "#0F172A" },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: "10px 22px",
          boxShadow: "none",
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.875rem",
          "&:hover": { boxShadow: "0 4px 14px rgba(29,78,216,0.25)" },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
          transition: "box-shadow 0.25s, transform 0.25s",
          "&:hover": { boxShadow: "0 8px 25px rgba(15,23,42,0.08)" },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 500, fontSize: "0.75rem", height: 26 },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 10,
            "& fieldset": { borderColor: "#E2E8F0" },
            "&:hover fieldset": { borderColor: "#CBD5E1" },
            "&.Mui-focused fieldset": { borderColor: "#1D4ED8", borderWidth: 2 },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: "none", borderBottom: "1px solid #E2E8F0" },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: "1px solid #E2E8F0",
          boxShadow: "none",
          "&:before": { display: "none" },
          "&.Mui-expanded": { margin: 0, boxShadow: "0 2px 8px rgba(15,23,42,0.06)" },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
  },
});