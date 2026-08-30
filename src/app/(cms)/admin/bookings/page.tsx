import Link from "next/link";
import { requireRole } from "@/shared/auth/session";
import { searchBookings } from "@/modules/cms";
import type { Prisma, BookingStatus } from "@prisma/client";
import { DeleteBookingButton } from "@/modules/cms/components/delete-booking-button";
import { BookingStatusChip } from "@/modules/cms/components/booking-status-chip";
import { BookingSortSelect } from "@/modules/cms/components/booking-sort-select";
import { bookingStatusValues, bookingStatusLabels, propertyTypeLabels } from "@/shared/lib/validations/booking";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Pagination from "@mui/material/Pagination";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

type SearchParams = { q?: string; status?: string; sort?: string; page?: string };

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireRole("ADMIN");
  const sp = await searchParams;

  const q = (sp.q ?? "").trim();
  const status = sp.status && (bookingStatusValues as readonly string[]).includes(sp.status) ? sp.status : undefined;
  const sort = sp.sort ?? "newest";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.BookingRequestWhereInput = {};
  if (status) where.status = status as BookingStatus;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { address: { contains: q, mode: "insensitive" } },
    ];
  }

  const orderBy =
    sort === "oldest"
      ? { createdAt: "asc" as const }
      : sort === "date"
        ? { preferredDate: "desc" as const }
        : { createdAt: "desc" as const };

  const [total, bookings] = await searchBookings({
    where,
    orderBy,
    skip: (page - 1) * PER_PAGE,
    take: PER_PAGE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  function qs(overrides: { q?: string; status?: string | null; sort?: string; page?: string | number }) {
    const params = new URLSearchParams();
    if (overrides.q !== undefined && overrides.q !== null) {
      if (overrides.q) params.set("q", overrides.q);
    } else if (q) {
      params.set("q", q);
    }
    if (overrides.status !== undefined && overrides.status !== null) {
      if (overrides.status) params.set("status", overrides.status);
    } else if (status) {
      params.set("status", status);
    }
    if (overrides.sort !== undefined && overrides.sort !== null) {
      if (overrides.sort && overrides.sort !== "newest") params.set("sort", overrides.sort);
    } else if (sort && sort !== "newest") {
      params.set("sort", sort);
    }
    if (overrides.page) params.set("page", String(overrides.page));
    const s = params.toString();
    return s ? `?${s}` : "";
  }

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#0F172A" }}>
            Booking Request
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748B", mt: 0.25 }}>
            {total} booking total &mdash; kelola permintaan jasa foto 360° dari landing page.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          href="/admin/bookings/new"
          sx={{ bgcolor: "#1D4ED8", "&:hover": { bgcolor: "#1E3A8A" }, borderRadius: 1 }}
        >
          Tambah Booking
        </Button>
      </Box>

      {/* Filter bar */}
      <Paper elevation={0} sx={{ borderRadius: 1, border: "1px solid #E2E8F0", p: 2 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
            <Box component="form" method="get" sx={{ flex: 1, minWidth: 0, display: "flex", gap: 1.5 }}>
              <TextField
                name="q"
                defaultValue={q}
                placeholder="Cari nama, no HP, atau alamat..."
                size="small"
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ fontSize: 18, color: "#94A3B8" }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={inputSx}
              />
              {status && <input type="hidden" name="status" value={status} />}
              <Button type="submit" variant="contained" size="small" sx={{ bgcolor: "#1D4ED8", "&:hover": { bgcolor: "#1E3A8A" }, borderRadius: 1, px: 2.5 }}>
                Cari
              </Button>
            </Box>

            <BookingSortSelect value={sort} q={q || undefined} status={status} />
          </Stack>

          {/* Status filter chips */}
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
            <Chip
              label="Semua"
              component={Link}
              href={qs({ status: null, page: "1" })}
              size="small"
              clickable
              sx={{
                borderRadius: 1,
                fontWeight: 600,
                fontSize: "0.72rem",
                color: !status ? "#fff" : "#64748B",
                bgcolor: !status ? "#1D4ED8" : "#F1F5F9",
                "&:hover": { bgcolor: !status ? "#1E3A8A" : "#E2E8F0" },
              }}
            />
            {bookingStatusValues.map((s) => (
              <Chip
                key={s}
                label={bookingStatusLabels[s]}
                component={Link}
                href={qs({ status: s, page: "1" })}
                size="small"
                clickable
                sx={{
                  borderRadius: 1,
                  fontWeight: 600,
                  fontSize: "0.72rem",
                  color: status === s ? "#fff" : "#64748B",
                  bgcolor: status === s ? statusColorMap[s] : "#F1F5F9",
                  "&:hover": { bgcolor: status === s ? statusColorMap[s] : "#E2E8F0" },
                }}
              />
            ))}
          </Stack>
        </Stack>
      </Paper>

      {/* Table */}
      <Paper elevation={0} sx={{ borderRadius: 1, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        {bookings.length === 0 ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <CalendarMonthIcon sx={{ fontSize: 48, color: "#CBD5E1", mb: 2 }} />
            <Typography variant="body1" sx={{ color: "#64748B", fontWeight: 600 }}>
              Tidak ada booking ditemukan
            </Typography>
            <Typography variant="caption" sx={{ color: "#94A3B8", display: "block", mt: 0.5 }}>
              {q || status ? "Coba ubah kata kunci atau filter." : "Belum ada booking request masuk."}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                  {["Nama", "No HP", "Alamat", "Tipe", "Tgl Preferensi", "Status", "Dibuat", "Aksi"].map((h) => (
                    <TableCell key={h} sx={{ color: "#64748B", fontWeight: 600, fontSize: "0.72rem", py: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b.id} hover>
                    {/* Nama */}
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: "rgba(29,78,216,0.12)", color: "#1D4ED8", fontSize: "0.8rem", fontWeight: 700 }}>
                          {b.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "#0F172A" }}>
                          {b.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    {/* No HP */}
                    <TableCell>
                      <Typography component="a" href={`tel:${b.phone}`} variant="body2" sx={{ color: "#1D4ED8", whiteSpace: "nowrap" }}>
                        {b.phone}
                      </Typography>
                    </TableCell>
                    {/* Alamat */}
                    <TableCell>
                      <Typography variant="body2" sx={{ color: "#64748B", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {b.address}
                      </Typography>
                    </TableCell>
                    {/* Tipe */}
                    <TableCell>
                      <Chip label={propertyTypeLabels[b.propertyType]} size="small" sx={{ bgcolor: "#EFF6FF", color: "#1D4ED8", fontWeight: 600, fontSize: "0.7rem", height: 22 }} />
                    </TableCell>
                    {/* Tgl preferensi */}
                    <TableCell>
                      <Typography variant="body2" sx={{ color: "#334155", whiteSpace: "nowrap" }}>
                        {b.preferredDate
                          ? new Date(b.preferredDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
                          : <Typography component="span" variant="caption" sx={{ color: "#94A3B8" }}>Tidak diisi</Typography>}
                      </Typography>
                    </TableCell>
                    {/* Status */}
                    <TableCell>
                      <BookingStatusChip status={b.status} />
                    </TableCell>
                    {/* Dibuat */}
                    <TableCell>
                      <Typography variant="caption" sx={{ color: "#94A3B8", whiteSpace: "nowrap" }}>
                        {new Date(b.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                      </Typography>
                    </TableCell>
                    {/* Aksi */}
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.75 }}>
                        <Button
                          component={Link}
                          href={`/admin/bookings/${b.id}`}
                          size="small"
                          startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
                          variant="outlined"
                          sx={{ borderColor: "rgba(29,78,216,0.3)", color: "#1D4ED8", borderRadius: 1, fontSize: "0.72rem", py: 0.5, px: 1.2, minWidth: 0, "&:hover": { bgcolor: "rgba(29,78,216,0.05)", borderColor: "#1D4ED8" } }}
                        >
                          Detail
                        </Button>
                        <Button
                          component={Link}
                          href={`/admin/bookings/${b.id}/edit`}
                          size="small"
                          startIcon={<EditIcon sx={{ fontSize: 14 }} />}
                          variant="outlined"
                          sx={{ borderColor: "rgba(29,78,216,0.3)", color: "#1D4ED8", borderRadius: 1, fontSize: "0.72rem", py: 0.5, px: 1.2, minWidth: 0, "&:hover": { bgcolor: "rgba(29,78,216,0.05)", borderColor: "#1D4ED8" } }}
                        >
                          Edit
                        </Button>
                        <DeleteBookingButton id={b.id} name={b.name} />
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Pagination
            count={totalPages}
            page={page}
            color="primary"
            onChange={(_, value) => {
              window.location.href = `/admin/bookings${qs({ page: value })}`;
            }}
          />
        </Box>
      )}
    </Stack>
  );
}

const statusColorMap: Record<string, string> = {
  PENDING: "#D97706",
  CONTACTED: "#0891B2",
  DONE: "#16A34A",
  CANCELLED: "#DC2626",
};

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 1,
    bgcolor: "white",
    "& fieldset": { borderColor: "#E2E8F0" },
    "&:hover fieldset": { borderColor: "#CBD5E1" },
    "&.Mui-focused fieldset": { borderColor: "#1D4ED8", borderWidth: 2 },
  },
  "& .MuiInputLabel-root": { fontSize: "0.85rem" },
  "& .MuiInputBase-input": { fontSize: "0.875rem" },
};