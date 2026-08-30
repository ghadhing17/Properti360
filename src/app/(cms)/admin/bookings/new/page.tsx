import Link from "next/link";
import { requireRole } from "@/shared/auth/session";
import { getActiveProducts } from "@/modules/cms";
import { prisma } from "@/shared/lib/db";
import { BookingForm } from "@/modules/cms/components/booking-form";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

export const dynamic = "force-dynamic";

export default async function NewBookingPage() {
  await requireRole("ADMIN");

  const products = await getActiveProducts();

  return (
    <Stack spacing={3}>
      <Breadcrumbs separator={<NavigateNextIcon sx={{ fontSize: 14 }} />} sx={{ fontSize: "0.8rem" }}>
        <Typography component={Link} href="/admin/bookings" variant="caption"
          sx={{ color: "#64748B", textDecoration: "none", "&:hover": { color: "#1D4ED8" } }}>
          Bookings
        </Typography>
        <Typography variant="caption" sx={{ color: "#0F172A", fontWeight: 600 }}>
          Tambah Booking Baru
        </Typography>
      </Breadcrumbs>

      <Paper elevation={0} sx={{ borderRadius: 1, border: "1px solid #E2E8F0", p: 3 }}>
        <BookingForm mode="create" products={products} />
      </Paper>
    </Stack>
  );
}