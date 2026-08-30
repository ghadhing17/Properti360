"use client";

import { cn } from "@/shared/lib/utils";
import MuiCard from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <MuiCard elevation={0} className={cn(className)} sx={{ borderRadius: 1, border: "1px solid #E2E8F0", boxShadow: "0 1px 2px rgba(15,23,42,0.05)" }}>
      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>{children}</CardContent>
    </MuiCard>
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-semibold text-foreground", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted", className)} {...props} />;
}
