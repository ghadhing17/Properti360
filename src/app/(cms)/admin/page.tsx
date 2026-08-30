import Link from "next/link";
import { requireRole } from "@/shared/auth/session";
import { getAdminOverview } from "@/modules/cms";
import { StatCard, ChartCard } from "@/shared/ui/stat-card";
import { Badge } from "@/shared/ui/badge";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
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
import Button from "@mui/material/Button";
import VisibilityIcon from "@mui/icons-material/Visibility";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import ContactsIcon from "@mui/icons-material/Contacts";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AddIcon from "@mui/icons-material/Add";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

export const dynamic = "force-dynamic";

// SVG line chart — no external lib
function LineChart({ data }: { data: { label: string; date: string; value: number }[] }) {
  const width = 640;
  const height = 140;
  const padding = { top: 16, right: 16, bottom: 28, left: 32 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const max = Math.max(...data.map((d) => d.value), 1);
  const yMax = Math.max(4, Math.ceil(max / 5) * 5);
  const stepX = data.length > 1 ? chartW / (data.length - 1) : chartW;

  const points = data.map((d, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + chartH - (d.value / yMax) * chartH;
    return { x, y, v: d.value };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  const yTicks = [0, 1, 2, 3, 4].map((i) => {
    const v = Math.round((yMax * i) / 4);
    const y = padding.top + chartH - (v / yMax) * chartH;
    return { v, y };
  });

  return (
    <Box sx={{ width: "100%", overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ height: 180, width: "100%", minWidth: 520 }}
        role="img"
        aria-label="Views 30 hari terakhir"
      >
        {yTicks.map((t) => (
          <g key={t.v}>
            <line
              x1={padding.left} x2={width - padding.right}
              y1={t.y} y2={t.y}
              stroke="#E2E8F0" strokeWidth={1}
              strokeDasharray={t.v === 0 ? "0" : "3 4"}
            />
            <text x={padding.left - 8} y={t.y + 3} textAnchor="end" fontSize="10" fill="#94A3B8">
              {t.v}
            </text>
          </g>
        ))}
        <path d={areaD} fill="rgba(29,78,216,0.07)" stroke="none" />
        <path d={pathD} fill="none" stroke="#1D4ED8" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={data.length <= 14 ? 3.5 : 2.5} fill="white" stroke="#1D4ED8" strokeWidth={1.8} />
          </g>
        ))}
        {/* X axis labels — show every nth */}
        {data.map((d, i) => {
          const show = data.length <= 10 || i % Math.ceil(data.length / 8) === 0 || i === data.length - 1;
          if (!show) return null;
          const x = padding.left + i * stepX;
          return (
            <text key={i} x={x} y={height - 4} textAnchor="middle" fontSize="9" fill="#94A3B8">
              {d.label}
            </text>
          );
        })}
      </svg>
    </Box>
  );
}

export default async function AdminDashboardPage() {
  await requireRole("ADMIN");

  const [
    totalListings,
    publishedListings,
    totalViewsAgg,
    totalLeads,
    newLeadsWeek,
    recentListings,
    recentLeads,
    viewsRaw,
    totalBookings,
    pendingBookings,
  ] = await getAdminOverview();

  const totalViews = totalViewsAgg._sum.viewCount ?? 0;

  // Build daily view data for chart
  const dayMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 3600 * 1000);
    const key = d.toISOString().slice(0, 10);
    dayMap[key] = 0;
  }
  viewsRaw.forEach((l) => {
    const key = l.createdAt.toISOString().slice(0, 10);
    if (key in dayMap) dayMap[key] += l.viewCount ?? 0;
  });
  const chartData = Object.entries(dayMap).map(([date, value]) => ({
    date,
    value,
    label: date.slice(5),
  }));

  const statusColor: Record<string, "success" | "warning" | "default"> = {
    PUBLISHED: "success",
    DRAFT: "warning",
  };

  return (
    <Stack spacing={3}>
      {/* Page header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#0F172A" }}>
            Overview
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748B", mt: 0.25 }}>
            Ringkasan performa properti &amp; leads hari ini.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          href="/admin/listings/new"
          sx={{ bgcolor: "#1D4ED8", "&:hover": { bgcolor: "#1E3A8A" }, borderRadius: 1 }}
        >
          Tambah Listing
        </Button>
      </Box>

      {/* Stat cards */}
      <Grid spacing={2}>
        {[
          {
            label: "Total Views",
            value: totalViews.toLocaleString("id-ID"),
            sublabel: "Semua listing",
            icon: <VisibilityIcon sx={{ fontSize: 20 }} />,
            color: "#1D4ED8",
            trend: "30 hari terakhir",
          },
          {
            label: "Total Listings",
            value: totalListings,
            sublabel: `${publishedListings} published`,
            icon: <HomeWorkIcon sx={{ fontSize: 20 }} />,
            color: "#7C3AED",
            trend: `${totalListings - publishedListings} draft`,
          },
          {
            label: "Total Leads",
            value: totalLeads,
            sublabel: "Semua waktu",
            icon: <ContactsIcon sx={{ fontSize: 20 }} />,
            color: "#0891B2",
            trend: `+${newLeadsWeek} minggu ini`,
            trendUp: newLeadsWeek > 0,
          },
          {
            label: "Published",
            value: publishedListings,
            sublabel: `dari ${totalListings} listing`,
            icon: <TrendingUpIcon sx={{ fontSize: 20 }} />,
            color: "#16A34A",
            trend: totalListings ? `${Math.round((publishedListings / totalListings) * 100)}% aktif` : "—",
          },
          {
            label: "Total Booking",
            value: totalBookings,
            sublabel: `${pendingBookings} pending`,
            icon: <CalendarMonthIcon sx={{ fontSize: 20 }} />,
            color: "#D97706",
            trend: pendingBookings > 0 ? `${pendingBookings} menunggu tindakan` : "tidak ada pending",
            trendUp: pendingBookings > 0,
          },
        ].map((s) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={s.label}>
            <StatCard
              label={s.label}
              value={s.value}
              sublabel={s.sublabel}
              icon={s.icon}
              color={s.color}
              trend={s.trend}
              trendUp={s.trendUp}
            />
          </Grid>
        ))}
      </Grid>

      {/* Chart + Recent Leads */}
      <Grid spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <ChartCard
            title="Listing Baru (30 hari)"
            subtitle="Jumlah listing dibuat per hari"
          >
            <LineChart data={chartData} />
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper
            elevation={0}
            sx={{ borderRadius: 1, border: "1px solid #E2E8F0", p: 3, height: "100%", boxSizing: "border-box" }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0F172A" }}>
                Leads Terbaru
              </Typography>
              <Button
                component={Link}
                href="/admin/leads"
                size="small"
                endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                sx={{ color: "#1D4ED8", fontSize: "0.75rem", p: 0, minWidth: 0, "&:hover": { bgcolor: "transparent" } }}
              >
                Lihat semua
              </Button>
            </Box>
            {recentLeads.length === 0 ? (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: "#94A3B8" }}>
                  Belum ada leads.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {recentLeads.map((l) => (
                  <Box
                    key={l.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: "#F8FAFC",
                      border: "1px solid #F1F5F9",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: "#EFF6FF", color: "#1D4ED8", fontSize: "0.7rem", fontWeight: 700 }}>
                          {l.name.slice(0, 2).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: "#0F172A", display: "block" }}>
                            {l.name}
                          </Typography>
                          <Typography
                            component="a"
                            href={`tel:${l.phone}`}
                            variant="caption"
                            sx={{ color: "#1D4ED8", fontSize: "0.7rem" }}
                          >
                            {l.phone}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: "0.68rem", flexShrink: 0 }}>
                        {new Date(l.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        mt: 0.75,
                        display: "block",
                        color: "#475569",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: "0.72rem",
                      }}
                    >
                      {l.message}
                    </Typography>
                    <Typography variant="caption" sx={{ mt: 0.5, display: "block", color: "#94A3B8", fontSize: "0.68rem" }}>
                      {l.listing.title}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Recent listings table */}
      <Paper elevation={0} sx={{ borderRadius: 1, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        <Box sx={{ px: 3, py: 2, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F1F5F9" }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0F172A" }}>
              Listing Terbaru
            </Typography>
            <Typography variant="caption" sx={{ color: "#94A3B8" }}>
              5 listing paling baru ditambahkan
            </Typography>
          </Box>
          <Button
            component={Link}
            href="/admin/listings"
            size="small"
            endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
            sx={{ color: "#1D4ED8", fontSize: "0.75rem" }}
          >
            Semua listing
          </Button>
        </Box>
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                {["Judul", "Kategori", "Status", "Views", "Leads", "Dibuat"].map((h) => (
                  <TableCell
                    key={h}
                    sx={{ fontWeight: 600, fontSize: "0.72rem", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.5, py: 1.5 }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {recentListings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: "center", py: 4, color: "#94A3B8" }}>
                    Belum ada listing.
                  </TableCell>
                </TableRow>
              ) : (
                recentListings.map((l) => (
                  <TableRow
                    key={l.id}
                    sx={{ "&:hover": { bgcolor: "#F8FAFC" }, "&:last-child td": { border: 0 } }}
                  >
                    <TableCell sx={{ py: 1.75 }}>
                      <Typography
                        component={Link}
                        href={`/admin/listings/${l.id}`}
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "#0F172A",
                          textDecoration: "none",
                          "&:hover": { color: "#1D4ED8" },
                          display: "block",
                          maxWidth: 260,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {l.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: "#64748B" }}>
                        {l.category?.name ?? "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Badge variant={l.status === "PUBLISHED" ? "published" : "draft"}>
                        {l.status === "PUBLISHED" ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: "#0F172A", fontWeight: 500 }}>
                        {(l.viewCount ?? 0).toLocaleString("id-ID")}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={l._count.leads}
                        size="small"
                        sx={{ bgcolor: l._count.leads > 0 ? "#EFF6FF" : "#F8FAFC", color: l._count.leads > 0 ? "#1D4ED8" : "#94A3B8", fontWeight: 600, fontSize: "0.72rem", height: 22 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: "#94A3B8" }}>
                        {new Date(l.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Stack>
  );
}
