"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteBooking } from "@/modules/cms/actions/admin-bookings";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export function DeleteBookingButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen]   = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setOpen(false);
    setError(null);
    startTransition(async () => {
      const res = await deleteBooking(id);
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
        title="Hapus Booking?"
        description={`Booking dari "${name}" akan dihapus permanen.\n\nTindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Ya, Hapus"
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
        loading={pending}
      />
    </>
  );
}
