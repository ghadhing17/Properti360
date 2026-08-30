"use client";

import { cn } from "@/shared/lib/utils";
import MuiCard from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

export function StatCard({
  label,
  value,
  sublabel,
  icon,
  trend,
  trendUp,
  color = "#1D4ED8",
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: string;
}) {
  const iconBg = `${color}18`;

  return (
    <MuiCard
      elevation={0}
      sx={{
        borderRadius: 1,
        border: "1px solid #E2E8F0",
        boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
        "&:hover": {
          boxShadow: "0 4px 16px rgba(15,23,42,0.10)",
          transform: "translateY(-1px)",
        },
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                letterSpacing: 0.6,
                color: "#94A3B8",
                textTransform: "uppercase",
                fontSize: "0.67rem",
                display: "block",
              }}
            >
              {label}
            </Typography>
            <Typography
              variant="h5"
              sx={{ mt: 0.75, fontWeight: 700, color: "#0F172A", lineHeight: 1.2 }}
            >
              {value}
            </Typography>
            {sublabel && (
              <Typography variant="caption" sx={{ color: "#94A3B8", mt: 0.25, display: "block" }}>
                {sublabel}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
        borderRadius: 1,
        bgcolor: iconBg,
                color: color,
                flexShrink: 0,
                ml: 1,
              }}
            >
              {icon}
            </Box>
          )}
        </Box>

        {trend && (
          <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 0.5 }}>
            {trendUp !== undefined && (
              trendUp
                ? <TrendingUpIcon sx={{ fontSize: 14, color: "#16A34A" }} />
                : <TrendingDownIcon sx={{ fontSize: 14, color: "#DC2626" }} />
            )}
            <Typography
              variant="caption"
              sx={{
                color: trendUp === undefined ? "#64748B" : trendUp ? "#16A34A" : "#DC2626",
                fontWeight: 500,
                fontSize: "0.75rem",
              }}
            >
              {trend}
            </Typography>
          </Box>
        )}
      </CardContent>
    </MuiCard>
  );
}

export function ChartCard({
  title,
  subtitle,
  children,
  className,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <MuiCard
      elevation={0}
      className={cn(className)}
      sx={{
        borderRadius: 1,
        border: "1px solid #E2E8F0",
        boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
      }}
    >
      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0F172A" }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: "#94A3B8", mt: 0.25, display: "block" }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {action && <Box>{action}</Box>}
        </Box>
        {children}
      </CardContent>
    </MuiCard>
  );
}
