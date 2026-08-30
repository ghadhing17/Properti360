import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/shared/auth/session";
import { StatCard } from "@/shared/ui/stat-card";
import { Badge } from "@/shared/ui/badge";
import { getOwnedListing } from "@/modules/dashboard/queries/listings";
import { CustomerEditForm } from "@/modules/dashboard/components/customer-edit-form";
import { QrCode } from "@/modules/dashboard/components/qr-code";
import { CopyLinkButton } from "@/modules/dashboard/components/copy-link-button";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import VisibilityIcon from "@mui/icons-material/Visibility";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import ContactsIcon from "@mui/icons-material/Contacts";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function CustomerListingDetailPage({ params }: Props) {
  const user = await requireRole(["ADMIN", "CUSTOMER"]);
  const { id } = await params;

  const listing = await getOwnedListing(id);
  if (!listing) notFound();
  // Customer hanya boleh melihat listing miliknya sendiri
  if (user.role !== "ADMIN" && listing.ownerId !== user.id) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const publicUrl = siteUrl ? `${siteUrl}/listing/${listing.slug}` : `/listing/${listing.slug}`;

  const cover = listing.media.find((m) => m.thumbnailUrl)?.thumbnailUrl ?? listing.media.find((m) => m.url)?.url ?? null;

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0F172A" }}>
              {listing.title}
            </Typography>
            <Badge variant={listing.status === "PUBLISHED" ? "published" : "draft"}>
              {listing.status === "PUBLISHED" ? "Published" : "Draft"}
            </Badge>
            {listing.category && <Chip label={listing.category.name} size="small" variant="outlined" sx={{ borderRadius: 1, fontSize: "0.72rem" }} />}
          </Box>
          <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>
            {listing.address} — {listing.regionPath ?? listing.city}
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/customer/listings"
          variant="outlined"
          size="small"
          sx={{ borderColor: "#E2E8F0", color: "#64748B", borderRadius: 1, "&:hover": { bgcolor: "#F8FAFC" } }}
        >
          Kembali
        </Button>
      </Box>

      {/* Stats */}
      <Grid spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label="Total Views" value={listing.viewCount.toLocaleString("id-ID")} icon={<VisibilityIcon sx={{ fontSize: 20 }} />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label="Leads Masuk" value={listing._count.leads} icon={<ContactsIcon sx={{ fontSize: 20 }} />} color="#16A34A" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            label="Status"
            value={listing.status === "PUBLISHED" ? "Online" : "Draft"}
            sublabel={listing.status === "PUBLISHED" ? "Tampil di halaman publik" : "Belum dipublikasikan"}
            icon={<HomeWorkIcon sx={{ fontSize: 20 }} />}
            color={listing.status === "PUBLISHED" ? "#16A34A" : "#F59E0B"}
          />
        </Grid>
      </Grid>

      <Grid spacing={3}>
        {/* Edit form */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={0} sx={{ borderRadius: 1, border: "1px solid #E2E8F0", p: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0F172A", mb: 0.5 }}>
              Kelola Listing
            </Typography>
            <Typography variant="caption" sx={{ color: "#94A3B8", display: "block", mb: 2 }}>
              Anda bisa mengubah deskripsi, harga, dan info kontak. Perubahan langsung tampil di halaman publik.
            </Typography>
            {cover && (
              <Box sx={{ mb: 2, borderRadius: 1, overflow: "hidden", border: "1px solid #E2E8F0" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cover} alt={listing.title} style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
              </Box>
            )}
            <CustomerEditForm
              listingId={listing.id}
              initial={{
                description: listing.description,
                price: listing.price,
                contactPhone: listing.owner?.phone ?? null,
                contactName: listing.owner?.name ?? null,
              }}
            />
          </Paper>
        </Grid>

        {/* Share & QR */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={0} sx={{ borderRadius: 1, border: "1px solid #E2E8F0", p: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0F172A" }}>
              Bagikan Listing
            </Typography>
            <Typography variant="caption" sx={{ color: "#94A3B8", display: "block", mb: 2 }}>
              Gunakan link atau QR code untuk mempromosikan virtual tour Anda.
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
              <CopyLinkButton url={publicUrl} />
              <Button
                component={Link}
                href={`/listing/${listing.slug}`}
                target="_blank"
                size="small"
                variant="outlined"
                startIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                sx={{ borderColor: "#E2E8F0", color: "#64748B", borderRadius: 1, "&:hover": { bgcolor: "#F8FAFC" } }}
              >
                Lihat Halaman Publik
              </Button>
            </Box>
            <Divider sx={{ borderColor: "#F1F5F9", mb: 2 }} />
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <QrCode url={publicUrl} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}
