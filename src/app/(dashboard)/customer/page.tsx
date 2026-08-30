import Link from "next/link";
import { requireRole } from "@/shared/auth/session";
import { StatCard } from "@/shared/ui/stat-card";
import { getMyListingOverview, getMyListings } from "@/modules/dashboard/queries/listings";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import VisibilityIcon from "@mui/icons-material/Visibility";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import ContactsIcon from "@mui/icons-material/Contacts";
import BarChartIcon from "@mui/icons-material/BarChart";
import AddIcon from "@mui/icons-material/Add";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import EditIcon from "@mui/icons-material/Edit";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";

export const dynamic = "force-dynamic";

export default async function CustomerPage() {
  const user = await requireRole(["ADMIN", "CUSTOMER"]);

  const [totalListings, totalViewsAgg, leadsWeek] = await getMyListingOverview(user.id);
  const listings = await getMyListings(user.id);

  const totalViews = totalViewsAgg._sum.viewCount ?? 0;
  const avgViews = totalListings ? Math.round(totalViews / totalListings) : 0;

  return (
    <Stack spacing={3}>
      {/* Welcome banner */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 1,
          border: "1px solid #E2E8F0",
          p: 3,
          background: "linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 100%)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: "#1D4ED8",
                fontWeight: 700,
                fontSize: "1.1rem",
              }}
            >
              {(user.name ?? user.email ?? "?").slice(0, 2).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#0F172A", lineHeight: 1.3 }}>
                {user.role === "ADMIN" ? "Customer View (sebagai ADMIN)" : `Halo, ${user.name}`}
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748B", mt: 0.25 }}>
                {user.role === "CUSTOMER"
                  ? "Pantau performa listing milik Anda & lihat leads yang masuk."
                  : "Anda melihat listing milik Anda sendiri (filter ownerId = session.user.id)."}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            href="/customer/listings/new"
            sx={{ bgcolor: "#1D4ED8", "&:hover": { bgcolor: "#1E3A8A" }, borderRadius: 1 }}
          >
            Tambah Listing
          </Button>
        </Box>
      </Paper>

      {/* Stat cards */}
      <Grid spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Total Views"
            value={totalViews.toLocaleString("id-ID")}
            sublabel="Milik Anda"
            icon={<VisibilityIcon sx={{ fontSize: 20 }} />}
            color="#1D4ED8"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Total Listings"
            value={totalListings}
            sublabel="Milik saya"
            icon={<HomeWorkIcon sx={{ fontSize: 20 }} />}
            color="#7C3AED"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="New Leads (7 hari)"
            value={leadsWeek}
            sublabel="Via form Hubungi"
            icon={<ContactsIcon sx={{ fontSize: 20 }} />}
            color="#0891B2"
            trendUp={leadsWeek > 0}
            trend={leadsWeek > 0 ? `${leadsWeek} leads minggu ini` : "Belum ada leads"}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Avg Views"
            value={avgViews}
            sublabel="Per listing"
            icon={<BarChartIcon sx={{ fontSize: 20 }} />}
            color="#16A34A"
          />
        </Grid>
      </Grid>

      {/* Listing grid */}
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0F172A" }}>
            Listing Saya ({listings.length})
          </Typography>
        </Box>

        {listings.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 1,
              border: "1px solid #E2E8F0",
              p: 6,
              textAlign: "center",
            }}
          >
            <HomeWorkIcon sx={{ fontSize: 48, color: "#CBD5E1", mb: 2 }} />
            <Typography variant="body1" sx={{ fontWeight: 600, color: "#64748B" }}>
              Belum ada listing
            </Typography>
            <Typography variant="body2" sx={{ color: "#94A3B8", mt: 0.5 }}>
              Mulai tambahkan listing properti pertama Anda.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={Link}
              href="/customer/listings/new"
              sx={{ mt: 3, bgcolor: "#1D4ED8", "&:hover": { bgcolor: "#1E3A8A" }, borderRadius: 1 }}
            >
              Tambah Listing
            </Button>
          </Paper>
        ) : (
          <Grid spacing={2}>
            {listings.map((l) => {
              const thumb = l.media[0]?.url ?? null;
              const isPublished = l.status === "PUBLISHED";

              return (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={l.id}>
                  <Paper
                    elevation={0}
                    sx={{
                      borderRadius: 1,
                      border: "1px solid #E2E8F0",
                      overflow: "hidden",
                      transition: "box-shadow 0.2s ease, transform 0.2s ease",
                      "&:hover": {
                        boxShadow: "0 4px 16px rgba(15,23,42,0.10)",
                        transform: "translateY(-1px)",
                      },
                    }}
                  >
                    {/* Thumbnail */}
                    <Box
                      sx={{
                        height: 160,
                        bgcolor: "#F1F5F9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt={l.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <ImageNotSupportedIcon sx={{ fontSize: 40, color: "#CBD5E1" }} />
                      )}
                      <Box sx={{ position: "absolute", top: 10, right: 10 }}>
                        <Chip
                          label={isPublished ? "Published" : "Draft"}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.7rem",
                            bgcolor: isPublished ? "rgba(22,163,74,0.9)" : "rgba(245,158,11,0.9)",
                            color: "white",
                            backdropFilter: "blur(4px)",
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Content */}
                    <Box sx={{ p: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 700,
                          color: "#0F172A",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {l.title}
                      </Typography>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.75 }}>
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
      </Box>
    </Stack>
  );
}
