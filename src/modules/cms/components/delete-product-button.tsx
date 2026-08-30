"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProduct, toggleProductActive } from "@/modules/cms/actions/products";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen]   = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setOpen(false);
    setError(null);
    startTransition(async () => {
      const res = await deleteProduct(id);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Button onClick={() => setOpen(true)} disabled={pending} size="small"
          variant="outlined" color="error"
          sx={{ borderRadius: 1, fontSize: "0.72rem", py: 0.5, px: 1.5, minWidth: 0 }}>
          {pending ? "Menghapus..." : "Hapus"}
        </Button>
        {error && <Typography variant="caption" sx={{ color: "#DC2626" }}>{error}</Typography>}
      </Box>

      <ConfirmDialog
        open={open}
        variant="delete"
        title="Hapus Produk?"
        description={`Produk "${name}" akan dihapus permanen.\n\nBooking yang terkait akan dilepas dari produk ini.`}
        confirmLabel="Ya, Hapus Produk"
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
        loading={pending}
      />
    </>
  );
}

export function ToggleProductActiveButton({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [active, setActive] = useState(isActive);

  function handleToggle() {
    const next = !active;
    setActive(next);
    startTransition(async () => {
      const res = await toggleProductActive(id, next);
      if (res.error) setActive(!next);
      else router.refresh();
    });
  }

  return (
    <FormControlLabel
      control={<Switch checked={active} onChange={handleToggle} disabled={pending} size="small" color="success" />}
      label={<Typography variant="caption" sx={{ color: active ? "#16A34A" : "#94A3B8", fontWeight: 600 }}>{active ? "Aktif" : "Nonaktif"}</Typography>}
      sx={{ m: 0 }}
    />
  );
}
