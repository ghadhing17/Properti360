import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/shared/auth/session";
import { BookingStatusChip } from "@/modules/cms/components/booking-status-chip";
import { BookingStatusActions } from "@/modules/cms/components/booking-status-actions";
import { DeleteBookingButton } from "@/modules/cms/components/delete-booking-button";
import { getBookingById } from "@/modules/cms";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import PlaceIcon from "@mui/icons-material/Place";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import EventIcon from "@mui/icons-material/Event";
import Inventory2Icon from "@mui/icons-material/Inventory2";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const propertyTypeLabels: Record<string, string> = {
  RUMAH: "Rumah",
  APARTEMEN: "Apartemen",
  HOTEL: "Hotel",
  RUKO: "Ruko",
  VENUE: "Venue",
  LAINNYA: "Lainnya",
};

export default async function BookingDetailPage({ params }: Props) {
  await requireRole("ADMIN");
  const { id } = await params;

  const booking = await getBookingById(id);
  if (!booking) notFound();

  const rows = [
    { icon: <PersonIcon sx={{ fontSize: 16 }} />, label: "Nama", value: booking.name },
    { icon: <PhoneIcon sx={{ fontSize: 16 }} />, label: "No HP", value: booking.phone },
    { icon: <PlaceIcon sx={{ fontSize: 16 }} />, label: "Alamat", value: booking.address },
    {
      icon: <HomeWorkIcon sx={{ fontSize: 16 }} />,
      label: "Tipe Properti",
      value: propertyTypeLabels[booking.propertyType] ?? booking.propertyType,
    },
    {
      icon: <EventIcon sx={{ fontSize: 16 }} />,
      label: "Jadwal Preferensi",
      value: booking.preferredDate
        ? new Date(booking.preferredDate).toLocaleString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—",
    },
    {
      icon: <Inventory2Icon sx={{ fontSize: 16 }} />,
      label: "Produk Layanan",
      value: booking.product?.name ?? "—",
    },
  ];

  return (
    <Stack spacing={3}>
      <Breadcrumbs separator={<NavigateNextIcon sx={{ fontSize: 14 }} />} sx={{ fontSize: "0.8rem" }}>
        <Typography component={Link} href="/admin/bookings" variant="caption"
          sx={{ color: "#64748B", textDecoration: "none", "&:hover": { color: "#1D4ED8" } }}>
          Bookings
        </Typography>
        <Typography variant="caption" sx={{ color: "#0F172A", fontWeight: 600 }}>
          {booking.name}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#0F172A" }}>
            Booking: {booking.name}
          </Typography>
          <BookingStatusChip status={booking.status} />
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            component={Link}
            href={`/admin/bookings/${booking.id}/edit`}
            variant="outlined"
            size="small"
            sx={{ borderColor: "#E2E8F0", color: "#64748B", borderRadius: 1, "&:hover": { bgcolor: "#F8FAFC" } }}
          >
            Edit
          </Button>
          <DeleteBookingButton id={booking.id} name={booking.name} />
        </Box>
      </Box>

      <Grid spacing={3}>
        {/* Detail */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={0} sx={{ borderRadius: 1, border: "1px solid #E2E8F0", p: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0F172A", mb: 2 }}>
              Detail Permintaan
            </Typography>
            {rows.map((row, i) => (
              <Box key={row.label}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, py: 1.25 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 160, color: "#64748B" }}>
                    {row.icon}
                    <Typography variant="body2" sx={{ color: "#64748B" }}>
                      {row.label}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#0F172A", whiteSpace: "pre-wrap" }}>
                    {row.value}
                  </Typography>
                </Box>
                {i < rows.length - 1 && <Divider sx={{ borderColor: "#F1F5F9" }} />}
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Status management */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={0} sx={{ borderRadius: 1, border: "1px solid #E2E8F0", p: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0F172A", mb: 0.5 }}>
              Status Booking
            </Typography>
            <Typography variant="caption" sx={{ color: "#94A3B8", display: "block", mb: 2 }}>
              Klik status untuk mengubah. Perubahan langsung tersimpan.
            </Typography>
            <BookingStatusActions id={booking.id} current={booking.status} />
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}
