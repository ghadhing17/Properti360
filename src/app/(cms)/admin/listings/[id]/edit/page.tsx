import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/shared/auth/session";
import { ListingForm } from "@/modules/cms/components/listing-form";
import { getListingForEdit, getListingFormData } from "@/modules/cms";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditListingPage({ params }: Props) {
  await requireRole("ADMIN");
  const { id } = await params;

  const [listing, [categories, customers]] = await Promise.all([
    getListingForEdit(id),
    getListingFormData(),
  ]);

  if (!listing) notFound();

  const panoeeMedia = listing.media.find((m) => m.type === "PANOEE_TOUR");
  const galleryPhotos = listing.media
    .filter((m) => m.type === "PHOTO")
    .map((m) => ({
      id: m.id,
      url: m.url,
      thumbnailUrl: m.thumbnailUrl,
      altText: m.altText,
      order: m.order,
    }));

  const initial = {
    id: listing.id,
    title: listing.title,
    categoryId: listing.categoryId ?? "",
    address: listing.address,
    city: listing.city,
    price: listing.price,
    description: listing.description,
    panoeeEmbed: panoeeMedia?.panoeeEmbedUrl ?? panoeeMedia?.panoeeShortcode ?? "",
    metaTitle: listing.metaTitle ?? "",
    metaDescription: listing.metaDescription ?? "",
    ownerId: listing.ownerId ?? "",
    status: listing.status,
    propertyType: listing.propertyType,
    provinceCode: listing.provinceCode,
    regencyCode: listing.regencyCode,
    districtCode: listing.districtCode,
    villageCode: listing.villageCode,
    regionPath: listing.regionPath,
    luasTanah: listing.luasTanah,
    luasBangunan: listing.luasBangunan,
    kamarTidur: listing.kamarTidur,
    kamarMandi: listing.kamarMandi,
    lantai: listing.lantai,
    garasi: listing.garasi,
    statusProperti: listing.statusProperti,
    tahunDibangun: listing.tahunDibangun,
    sertifikat: listing.sertifikat,
    hadapRumah: listing.hadapRumah,
    dayaListrik: listing.dayaListrik,
    sumberAir: listing.sumberAir,
    fasilitas: listing.fasilitas,
  };

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
          Edit: {listing.title}
        </Typography>
      </Breadcrumbs>

      <Paper elevation={0} sx={{ borderRadius: 1, border: "1px solid #E2E8F0", p: 3 }}>
        <ListingForm
          mode="edit"
          initial={initial}
          galleryPhotos={galleryPhotos}
          categories={categories}
          customers={customers}
        />
      </Paper>
    </Stack>
  );
}
