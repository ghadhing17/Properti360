import Link from "next/link";
import { requireRole } from "@/shared/auth/session";
import { getAllProductsAdmin } from "@/modules/cms";
import { prisma } from "@/shared/lib/db";
import { DeleteProductButton, ToggleProductActiveButton } from "@/modules/cms/components/delete-product-button";
import { formatPrice } from "@/shared/lib/validations/product";
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
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import InventoryIcon from "@mui/icons-material/Inventory";
import StarIcon from "@mui/icons-material/Star";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireRole("ADMIN");

  const products = await getAllProductsAdmin();

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#0F172A" }}>
            Produk &amp; Paket Layanan
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748B", mt: 0.25 }}>
            {products.length} produk — kelola paket jasa foto 360° yang ditampilkan di landing page dan form booking.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} component={Link} href="/admin/products/new"
          sx={{ bgcolor: "#1D4ED8", "&:hover": { bgcolor: "#1E3A8A" }, borderRadius: 1 }}>
          Tambah Produk
        </Button>
      </Box>

      {/* Table */}
      <Paper elevation={0} sx={{ borderRadius: 1, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        {products.length === 0 ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <InventoryIcon sx={{ fontSize: 48, color: "#CBD5E1", mb: 2 }} />
            <Typography variant="body1" sx={{ color: "#64748B", fontWeight: 600 }}>
              Belum ada produk
            </Typography>
            <Typography variant="caption" sx={{ color: "#94A3B8", display: "block", mt: 0.5, mb: 2 }}>
              Tambah paket layanan pertama untuk ditampilkan di landing page.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} component={Link} href="/admin/products/new"
              size="small" sx={{ bgcolor: "#1D4ED8", "&:hover": { bgcolor: "#1E3A8A" }, borderRadius: 1 }}>
              Tambah Produk
            </Button>
          </Box>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 780 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                  {["Produk", "Harga", "Fitur", "Booking", "Status", "Urutan", "Aksi"].map((h) => (
                    <TableCell key={h} sx={{ color: "#64748B", fontWeight: 600, fontSize: "0.72rem", py: 1.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id} hover>
                    {/* Produk */}
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: "rgba(29,78,216,0.1)", color: "#1D4ED8", fontSize: "0.8rem", fontWeight: 700 }}>
                          {p.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: "#0F172A" }}>
                              {p.name}
                            </Typography>
                            {p.isPopular && (
                              <Box sx={{ display: "inline-flex", alignItems: "center", px: "10px", py: "3px", borderRadius: "999px", background: "linear-gradient(90deg, #4f6df5, #2952e3)", color: "white", fontWeight: 600, fontSize: "0.62rem", whiteSpace: "nowrap", boxShadow: "0 2px 6px rgba(41,82,227,0.3)" }}>
                                Populer
                              </Box>
                            )}
                          </Box>
                          <Typography variant="caption" sx={{ color: "#94A3B8", display: "block", mt: 0.25, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.description}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    {/* Harga */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: p.price ? "#0F172A" : "#94A3B8", whiteSpace: "nowrap" }}>
                        {formatPrice(p.price)}
                      </Typography>
                    </TableCell>
                    {/* Fitur */}
                    <TableCell>
                      <Chip label={`${p.features.length} fitur`} size="small"
                        sx={{ bgcolor: "#EFF6FF", color: "#1D4ED8", fontWeight: 600, fontSize: "0.7rem", height: 22 }} />
                    </TableCell>
                    {/* Booking */}
                    <TableCell>
                      <Chip label={p._count.bookings} size="small"
                        sx={{ bgcolor: p._count.bookings > 0 ? "#F0FDF4" : "#F8FAFC", color: p._count.bookings > 0 ? "#16A34A" : "#94A3B8", fontWeight: 700, fontSize: "0.72rem", height: 22 }} />
                    </TableCell>
                    {/* Status */}
                    <TableCell>
                      <ToggleProductActiveButton id={p.id} isActive={p.isActive} />
                    </TableCell>
                    {/* Urutan */}
                    <TableCell>
                      <Typography variant="body2" sx={{ color: "#64748B", textAlign: "center" }}>
                        {p.order}
                      </Typography>
                    </TableCell>
                    {/* Aksi */}
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.75 }}>
                        <Button component={Link} href={`/admin/products/${p.id}/edit`} size="small"
                          startIcon={<EditIcon sx={{ fontSize: 14 }} />} variant="outlined"
                          sx={{ borderColor: "rgba(29,78,216,0.3)", color: "#1D4ED8", borderRadius: 1, fontSize: "0.72rem", py: 0.5, px: 1.2, minWidth: 0, "&:hover": { bgcolor: "rgba(29,78,216,0.05)", borderColor: "#1D4ED8" } }}>
                          Edit
                        </Button>
                        <DeleteProductButton id={p.id} name={p.name} />
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>
    </Stack>
  );
}
