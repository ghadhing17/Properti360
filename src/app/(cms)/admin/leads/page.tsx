import Link from "next/link";
import { requireRole } from "@/shared/auth/session";
import { getRecentLeads } from "@/modules/cms";
import { prisma } from "@/shared/lib/db";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import ContactsIcon from "@mui/icons-material/Contacts";
import PhoneIcon from "@mui/icons-material/Phone";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  await requireRole("ADMIN");
  const leads = await getRecentLeads();

  return (
    <Stack spacing={3}>
      {/* Page header */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 1,
          border: "1px solid #E2E8F0",
          p: 3,
          background: "linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 100%)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1,
              bgcolor: "rgba(29,78,216,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ContactsIcon sx={{ fontSize: 22, color: "#1D4ED8" }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0F172A" }}>
              Leads
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B", mt: 0.25 }}>
              Semua inquiry dari form Hubungi Pemilik &mdash;{" "}
              <strong>{leads.length}</strong> terbaru.
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Table */}
      <Paper elevation={0} sx={{ borderRadius: 1, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        {leads.length === 0 ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <ContactsIcon sx={{ fontSize: 48, color: "#CBD5E1", mb: 2 }} />
            <Typography variant="body1" sx={{ fontWeight: 600, color: "#64748B" }}>
              Belum ada leads
            </Typography>
            <Typography variant="body2" sx={{ color: "#94A3B8", mt: 0.5 }}>
              Leads akan muncul saat pengunjung mengisi form Hubungi Pemilik.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                  {["Pengirim", "Telepon", "Listing", "Pesan", "Tanggal"].map((h) => (
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
                {leads.map((l) => (
                  <TableRow
                    key={l.id}
                    sx={{ "&:hover": { bgcolor: "#F8FAFC" }, "&:last-child td": { border: 0 } }}
                  >
                    {/* Pengirim */}
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: "#EFF6FF",
                            color: "#1D4ED8",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                          }}
                        >
                          {l.name.slice(0, 2).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "#0F172A" }}>
                          {l.name}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Telepon */}
                    <TableCell>
                      <Chip
                        icon={<PhoneIcon sx={{ fontSize: "14px !important" }} />}
                        label={l.phone}
                        size="small"
                        component="a"
                        href={`tel:${l.phone}`}
                        clickable
                        sx={{
                          bgcolor: "#F0FDF4",
                          color: "#16A34A",
                          fontWeight: 500,
                          fontSize: "0.75rem",
                          border: "1px solid rgba(22,163,74,0.2)",
                          "& .MuiChip-icon": { color: "#16A34A" },
                        }}
                      />
                    </TableCell>

                    {/* Listing */}
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Typography
                        component={Link}
                        href={`/listing/${l.listing.slug}`}
                        target="_blank"
                        variant="body2"
                        sx={{
                          color: "#1D4ED8",
                          textDecoration: "none",
                          fontWeight: 500,
                          "&:hover": { textDecoration: "underline" },
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          display: "block",
                        }}
                      >
                        {l.listing.title}
                      </Typography>
                    </TableCell>

                    {/* Pesan */}
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#64748B",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {l.message}
                      </Typography>
                    </TableCell>

                    {/* Tanggal */}
                    <TableCell>
                      <Typography variant="caption" sx={{ color: "#94A3B8", whiteSpace: "nowrap" }}>
                        {new Date(l.createdAt).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
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
