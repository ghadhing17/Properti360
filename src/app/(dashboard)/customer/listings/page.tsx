import Link from "next/link";
import { requireRole } from "@/shared/auth/session";
import { Badge } from "@/shared/ui/badge";
import { getMyListings } from "@/modules/dashboard/queries/listings";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ContactsIcon from "@mui/icons-material/Contacts";
import EditIcon from "@mui/icons-material/Edit";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export const dynamic = "force-dynamic";

export default async function CustomerListingsPage() {
  const user = await requireRole(["ADMIN", "CUSTOMER"]);

  const listings = await getMyListings(user.id);

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#0F172A" }}>
            Listing Saya
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748B", mt: 0.25 }}>
            Semua listing milik Anda — klik Kelola untuk detail &amp; edit.
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/customer"
          variant="outlined"
          startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
          size="small"
          sx={{ borderColor: "#E2E8F0", color: "#64748B", borderRadius: 1, "&:hover": { bgcolor: "#F8FAFC" } }}
        >
          Dashboard
        </Button>
      </Box>

      {/* Listing grid */}
      {listings.length === 0 ? (
        <Paper
          elevation={0}
          sx={{ borderRadius: 1, border: "1px solid #E2E8F0", py: 8, textAlign: "center" }}
        >
          <HomeWorkIcon sx={{ fontSize: 48, color: "#CBD5E1", mb: 2 }} />
          <Typography variant="body1" sx={{ fontWeight: 600, color: "#64748B" }}>
            Belum ada listing milik Anda
          </Typography>
          <Typography variant="body2" sx={{ color: "#94A3B8", mt: 0.5, maxWidth: 360, mx: "auto" }}>
            Admin akan assign listing setelah sesi foto — hubungi tim Properti360.
          </Typography>
        </Paper>
      ) : (
        <Grid spacing={2}>
          {listings.map((l) => {
            const thumb = l.media[0]?.thumbnailUrl ?? l.media[0]?.url ?? null;
            const isPublished = l.status === "PUBLISHED";
            return (
              <Grid size={{ xs: 12, sm: 6, xl: 4 }} key={l.id}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 1,
                    border: "1px solid #E2E8F0",
                    overflow: "hidden",
                    transition: "box-shadow 0.2s ease, transform 0.2s ease",
                    "&:hover": { boxShadow: "0 4px 16px rgba(15,23,42,0.10)", transform: "translateY(-1px)" },
                  }}
                >
                  {/* Thumbnail */}
                  <Box sx={{ height: 160, bgcolor: "#F1F5F9", position: "relative", overflow: "hidden" }}>
                    {thumb ? (
                      <Box
                        component="img"
                        src={thumb}
                        alt={l.title}
                        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ImageNotSupportedIcon sx={{ fontSize: 40, color: "#CBD5E1" }} />
                      </Box>
                    )}
                    <Box sx={{ position: "absolute", top: 10, left: 10 }}>
                      <Chip
                        label={isPublished ? "Published" : "Draft"}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.7rem",
                          bgcolor: isPublished ? "rgba(22,163,74,0.9)" : "rgba(245,158,11,0.9)",
                          color: "white",
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Content */}
                  <Box sx={{ p: 2 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {l.title}
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.75, flexWrap: "wrap" }}>
                      {l.category && (
                        <Chip
                          label={l.category.name}
                          size="small"
                          sx={{ bgcolor: "#EFF6FF", color: "#1D4ED8", fontWeight: 500, fontSize: "0.7rem", height: 20 }}
                        />
                      )}
                      {l.price && (
                        <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 500 }}>
                          {Number(l.price).toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}
                        </Typography>
                      )}
                    </Box>

                    <Divider sx={{ my: 1.5, borderColor: "#F1F5F9" }} />

                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box sx={{ display: "flex", gap: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <VisibilityIcon sx={{ fontSize: 14, color: "#94A3B8" }} />
                          <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 500 }}>
                            {(l.viewCount ?? 0).toLocaleString("id-ID")}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <ContactsIcon sx={{ fontSize: 14, color: "#94A3B8" }} />
                          <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 500 }}>
                            {l._count.leads}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          component={Link}
                          href={`/customer/listings/${l.id}`}
                          size="small"
                          startIcon={<EditIcon sx={{ fontSize: 14 }} />}
                          variant="contained"
                          sx={{
                            bgcolor: "#1D4ED8",
                            "&:hover": { bgcolor: "#1E3A8A" },
                            borderRadius: 1,
                            fontSize: "0.72rem",
                            py: 0.5,
                            px: 1.5,
                            minWidth: 0,
                          }}
                        >
                          Kelola
                        </Button>
                        <Button
                          component={Link}
                          href={`/listing/${l.slug}`}
                          target="_blank"
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: "#E2E8F0",
                            color: "#64748B",
                            borderRadius: 1,
                            fontSize: "0.72rem",
                            py: 0.5,
                            px: 1,
                            minWidth: 0,
                          }}
                        >
                          <OpenInNewIcon sx={{ fontSize: 14 }} />
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Stack>
  );
}
