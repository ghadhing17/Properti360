"use client";

import { useRef } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import InfoIcon from "@mui/icons-material/Info";
import Box from "@mui/material/Box";

export type ConfirmDialogVariant = "delete" | "save" | "warning" | "info";

type Props = {
  open: boolean;
  variant?: ConfirmDialogVariant;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

const variantConfig: Record<
  ConfirmDialogVariant,
  { icon: React.ReactNode; confirmColor: "error" | "primary" | "warning" | "info"; confirmBg?: string }
> = {
  delete:  { icon: <DeleteIcon sx={{ color: "#DC2626", fontSize: 28 }} />,        confirmColor: "error"   },
  save:    { icon: <SaveIcon   sx={{ color: "#1D4ED8", fontSize: 28 }} />,         confirmColor: "primary" },
  warning: { icon: <WarningAmberIcon sx={{ color: "#D97706", fontSize: 28 }} />,   confirmColor: "warning" },
  info:    { icon: <InfoIcon   sx={{ color: "#0891B2", fontSize: 28 }} />,         confirmColor: "info"    },
};

export function ConfirmDialog({
  open,
  variant = "info",
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel  = "Batal",
  onConfirm,
  onCancel,
  loading = false,
}: Props) {
  const { icon, confirmColor } = variantConfig[variant];

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 2, p: 0.5 } } }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
        {icon}
        <Box component="span" sx={{ fontWeight: 700, fontSize: "1rem", color: "#0F172A" }}>
          {title}
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        <DialogContentText sx={{ fontSize: "0.875rem", color: "#475569", whiteSpace: "pre-line" }}>
          {description}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button
          onClick={onCancel}
          disabled={loading}
          variant="outlined"
          size="small"
          sx={{ borderColor: "#E2E8F0", color: "#64748B", borderRadius: 1 }}
        >
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          size="small"
          color={confirmColor}
          sx={{ borderRadius: 1, fontWeight: 600 }}
        >
          {loading ? "Memproses..." : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
