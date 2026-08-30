"use client";

import Chip from "@mui/material/Chip";
import { cn } from "@/shared/lib/utils";

type BadgeVariant = "published" | "draft" | "neutral" | "success" | "warning";

const muiColor: Record<BadgeVariant, "success" | "warning" | "default" | "primary"> = {
  published: "success",
  success: "success",
  draft: "warning",
  warning: "warning",
  neutral: "default",
};

// Tailwind fallback styles (keep for non-MUI contexts, e.g. server tables)
const variantStyles: Record<BadgeVariant, string> = {
  published: "bg-success/10 text-success border-success/20",
  draft: "bg-warning/10 text-warning border-warning/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  neutral: "bg-[var(--color-border)]/60 text-muted border-border",
};

export function Badge({
  variant = "neutral",
  className,
  children,
}: { variant?: BadgeVariant; className?: string; children: React.ReactNode }) {
  // Use MUI Chip for consistent theming (MUI theme palette success #16A34A, warning #F59E0B)
  return (
    <Chip
      label={children as string}
      size="small"
      color={muiColor[variant]}
      variant={variant === "neutral" ? "outlined" : "filled"}
      sx={{
        borderRadius: "9999px",
        fontWeight: 500,
        fontSize: "0.75rem",
        ...(variant === "published" || variant === "success"
          ? { bgcolor: "rgba(22,163,74,0.1)", color: "#16A34A", borderColor: "rgba(22,163,74,0.2)" }
          : {}),
        ...(variant === "draft" || variant === "warning"
          ? { bgcolor: "rgba(245,158,11,0.12)", color: "#F59E0B", borderColor: "rgba(245,158,11,0.2)" }
          : {}),
      }}
      className={cn(className)}
    />
  );
}

// Export tailwind variant for server components that still render <span>
export function BadgeTailwind({
  variant = "neutral",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", variantStyles[variant], className)} {...props}>
      {children}
    </span>
  );
}
