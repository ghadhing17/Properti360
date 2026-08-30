"use client";

import * as React from "react";
import MuiButton, { ButtonProps as MuiButtonProps } from "@mui/material/Button";
import { cn } from "@/shared/lib/utils";

type Variant = "primary" | "outline" | "ghost";

export interface ButtonProps extends Omit<MuiButtonProps, "variant" | "color"> {
  variant?: Variant;
}

const muiVariant: Record<Variant, MuiButtonProps["variant"]> = {
  primary: "contained",
  outline: "outlined",
  ghost: "text",
};

export function Button({ variant = "primary", className, children, ...props }: ButtonProps) {
  // keep Tailwind fallback via className but delegate visual to MUI theme (palette primary #1D4ED8)
  return (
    <MuiButton variant={muiVariant[variant]} color={variant === "ghost" ? "inherit" : "primary"} className={cn(className)} {...props}>
      {children}
    </MuiButton>
  );
}

// Tailwind fallback for places that still use class-based button (e.g. <a> styled as button)
export const buttonTailwind = {
  primary: "bg-primary text-white hover:bg-primary-dark",
  outline: "border border-primary/20 text-primary hover:bg-primary/5",
  ghost: "text-foreground hover:bg-foreground/5",
};
