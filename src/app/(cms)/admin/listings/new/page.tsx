import Link from "next/link";
import { requireRole } from "@/shared/auth/session";
import { ListingForm } from "@/modules/cms/components/listing-form";
import { getListingFormData } from "@/modules/cms";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Alert from "@mui/material/Alert";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  await requireRole("ADMIN");

  const [categories, customers] = await getListingFormData();

  return (
    <Stack spacing={3}>
      {/* Breadcrumb */}
      <Breadcrumbs separator={<NavigateNextIcon sx={{ fontSize: 14 }} />} sx={{ fontSize: "0.8rem" }}>
        <Typography
          component={Link}
          href="/admin/listings"
          variant="caption"
          sx={{ color: "#64748B", textDecoration: "none", "&:hover": { color: "#1D4ED8" } }}
        >
          Listings
        </Typography>
        <Typography variant="caption" sx={{ color: "#0F172A", fontWeight: 600 }}>
          Tambah Listing Baru
        </Typography>
      </Breadcrumbs>

      {/* Warning jika belum ada kategori */}
      {categories.length === 0 && (
        <Alert
          severity="warning"
          icon={<WarningAmberIcon sx={{ fontSize: 18 }} />}
          sx={{ borderRadius: 1, border: "1px solid rgba(245,158,11,0.3)" }}
        >
          Belum ada kategori. Buat kategori dulu di database sebelum menambah listing.
        </Alert>
      )}

      <Paper elevation={0} sx={{ borderRadius: 1, border: "1px solid #E2E8F0", p: 3 }}>
        <ListingForm mode="create" categories={categories} customers={customers} />
      </Paper>
    </Stack>
  );
}
