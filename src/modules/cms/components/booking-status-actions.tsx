"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateBookingStatus } from "@/modules/cms/actions/admin-bookings";
import { bookingStatusValues, bookingStatusLabels } from "@/shared/lib/validations/booking";
import type { BookingStatus } from "@prisma/client";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";

type StatusProps = {
  id: string;
  current: BookingStatus;
  onChange?: () => void;
};

export function BookingStatusActions({ id, current, onChange }: StatusProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSet(status: string) {
    if (status === current) return;
    setError(null);
    startTransition(async () => {
      const res = await updateBookingStatus(id, status);
      if (res.error) {
        setError(res.error);
      } else {
        router.refresh();
        onChange?.();
      }
    });
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {bookingStatusValues.map((s) => {
          const active = s === current;
          return (
            <Chip
              key={s}
              label={bookingStatusLabels[s]}
              size="small"
              disabled={pending}
              onClick={() => handleSet(s)}
              clickable
              sx={{
                cursor: "pointer",
                borderRadius: 1,
                fontWeight: 600,
                fontSize: "0.72rem",
                color: active ? "#fff" : "#64748B",
                bgcolor: active ? colorMap[s] : "#F1F5F9",
                "&:hover": active
                  ? { bgcolor: colorMap[s], opacity: 0.85 }
                  : { bgcolor: "#E2E8F0" },
                ...(pending ? { opacity: 0.6 } : {}),
              }}
            />
          );
        })}
      </Box>
      {error && <Box sx={{ fontSize: "0.72rem", color: "#DC2626" }}>{error}</Box>}
    </Box>
  );
}

const colorMap: Record<BookingStatus, string> = {
  PENDING: "#D97706",
  CONTACTED: "#0891B2",
  DONE: "#16A34A",
  CANCELLED: "#DC2626",
};