import Chip from "@mui/material/Chip";
import { bookingStatusLabels } from "@/shared/lib/validations/booking";
import type { BookingStatus } from "@prisma/client";

const chipColorMap: Record<BookingStatus, "warning" | "info" | "success" | "error"> = {
  PENDING: "warning",
  CONTACTED: "info",
  DONE: "success",
  CANCELLED: "error",
};

export function BookingStatusChip({ status }: { status: BookingStatus }) {
  return (
    <Chip
      label={bookingStatusLabels[status]}
      size="small"
      color={chipColorMap[status]}
      variant="filled"
      sx={{
        borderRadius: "9999px",
        fontWeight: 600,
        fontSize: "0.72rem",
        ...(status === "PENDING"
          ? { bgcolor: "rgba(245,158,11,0.12)", color: "#D97706", borderColor: "rgba(245,158,11,0.2)" }
          : {}),
        ...(status === "CONTACTED"
          ? { bgcolor: "rgba(8,145,178,0.1)", color: "#0891B2", borderColor: "rgba(8,145,178,0.2)" }
          : {}),
        ...(status === "DONE"
          ? { bgcolor: "rgba(22,163,74,0.1)", color: "#16A34A", borderColor: "rgba(22,163,74,0.2)" }
          : {}),
        ...(status === "CANCELLED"
          ? { bgcolor: "rgba(220,38,38,0.1)", color: "#DC2626", borderColor: "rgba(220,38,38,0.2)" }
          : {}),
      }}
    />
  );
}