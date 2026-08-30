import Link from "next/link";
import { requireRole } from "@/shared/auth/session";
import { getAllListingsAdmin } from "@/modules/cms";
import { prisma } from "@/shared/lib/db";
import { DeleteListingButton } from "@/modules/cms/components/delete-listing-button";
import { Badge } from "@/shared/ui/badge";
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
import AddIcon from "@mui/icons-material/Add";
import ArticleIcon from "@mui/icons-material/Article";
import EditIcon from "@mui/icons-material/Edit";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";

export const dynamic = "force-dynamic";

export default async function AdminListingsPage() {
  await requireRole("ADMIN");

  const listings = await getAllListingsAdmin();

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#0F172A" }}>
            Kelola Listing
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748B", mt: 0.25 }}>
            {listings.length} listing total
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          href="/admin/listings/new"
          sx={{ bgcolor: "#1D4ED8", "&:hover": { bgcolor: "#1E3A8A" }, borderRadius: 1 }}
        >
          Tambah Listing Baru
        </Button>
      </Box>

      {/* Table */}
      <Paper elevation={0} sx={{ borderRadius: 1, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        {listings.length === 0 ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <ArticleIcon sx={{ fontSize: 48, color: "#CBD5E1", mb: 2 }} />
            <Typography variant="body1" sx={{ fontWeight: 600, color: "#64748B" }}>
              Belum ada listing
            </Typography>
            <Button
              component={Link}
              href="/admin/listings/new"
              variant="text"
              sx={{ mt: 1, color: "#1D4ED8", fontSize: "0.85rem" }}
            >
              Buat listing pertama
            </Button>
          </Box>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                  {["Thumbnail", "Judul", "Kategori", "Kota", "Status", "Views", "Aksi"].map((h) => (
                    <TableCell
                      key={h}
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.72rem",
                        color: "#94A3B8",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        py: 1.5,
                        borderBottom: "1px solid #E2E8F0",
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {listings.map((l) => {
                  const thumb = l.media[0]?.thumbnailUrl ?? l.media[0]?.url ?? null;
                  return (
                    <TableRow
                      key={l.id}
                      sx={{ "&:hover": { bgcolor: "#F8FAFC" }, "&:last-child td": { border: 0 } }}
                    >
                      {/* Thumbnail */}
                      <TableCell sx={{ py: 1.5, width: 56 }}>
                        {thumb ? (
                          <Box
                            component="img"
                            src={thumb}
                            alt={l.title}
                            sx={{ width: 48, height: 36, objectFit: "cover", borderRadius: 1, border: "1px solid #E2E8F0" }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 48,
                              height: 36,
                              borderRadius: 1,
                              bgcolor: "#F1F5F9",
                              border: "1px solid #E2E8F0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <ImageNotSupportedIcon sx={{ fontSize: 16, color: "#CBD5E1" }} />
                          </Box>
                        )}
                      </TableCell>

                      {/* Judul */}
                      <TableCell sx={{ maxWidth: 240 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: "#0F172A",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {l.title}
                        </Typography>
                      </TableCell>

                      {/* Kategori */}
                      <TableCell>
                        <Typography variant="caption" sx={{ color: "#64748B" }}>
                          {l.category?.name ?? "—"}
                        </Typography>
                      </TableCell>

                      {/* Kota */}
                      <TableCell>
                        <Typography variant="caption" sx={{ color: "#64748B" }}>
                          {l.city ?? "—"}
                        </Typography>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge variant={l.status === "PUBLISHED" ? "published" : "draft"}>
                          {l.status === "PUBLISHED" ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>

                      {/* Views */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: "#0F172A" }}>
                          {(l.viewCount ?? 0).toLocaleString("id-ID")}
                        </Typography>
                      </TableCell>

                      {/* Aksi */}
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Button
                            component={Link}
                            href={`/admin/listings/${l.id}/edit`}
                            size="small"
                            startIcon={<EditIcon sx={{ fontSize: 14 }} />}
                            variant="outlined"
                            sx={{
                              borderColor: "rgba(29,78,216,0.3)",
                              color: "#1D4ED8",
                              borderRadius: 1,
                              fontSize: "0.72rem",
                              py: 0.5,
                              px: 1.5,
                              "&:hover": { bgcolor: "rgba(29,78,216,0.05)", borderColor: "#1D4ED8" },
                            }}
                          >
                            Edit
                          </Button>
                          <DeleteListingButton id={l.id} title={l.title} />
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>
    </Stack>
  );
}
