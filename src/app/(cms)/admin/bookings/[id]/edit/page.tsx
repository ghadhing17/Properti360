import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/shared/auth/session";
import { BookingForm } from "@/modules/cms/components/booking-form";
import { getBookingById, getActiveProducts } from "@/modules/cms";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditBookingPage({ params }: Props) {
  await requireRole("ADMIN");
  const { id } = await params;

  const [booking, products] = await Promise.all([getBookingById(id), getActiveProducts()]);
  if (!booking) notFound();

  return (
    <Stack spacing={3}>
      <Breadcrumbs separator={<NavigateNextIcon sx={{ fontSize: 14 }} />} sx={{ fontSize: "0.8rem" }}>
        <Typography component={Link} href="/admin/bookings" variant="caption"
          sx={{ color: "#64748B", textDecoration: "none", "&:hover": { color: "#1D4ED8" } }}>
          Bookings
        </Typography>
        <Typography component={Link} href={`/admin/bookings/${booking.id}`} variant="caption"
          sx={{ color: "#64748B", textDecoration: "none", "&:hover": { color: "#1D4ED8" } }}>
          {booking.name}
        </Typography>
        <Typography variant="caption" sx={{ color: "#0F172A", fontWeight: 600 }}>
          Edit
        </Typography>
      </Breadcrumbs>

      <Paper elevation={0} sx={{ borderRadius: 1, border: "1px solid #E2E8F0", p: 3 }}>
        <BookingForm mode="edit" booking={booking} products={products} />
      </Paper>
    </Stack>
  );
}
