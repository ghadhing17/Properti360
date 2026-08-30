"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Tooltip from "@mui/material/Tooltip";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import RepeatIcon from "@mui/icons-material/Repeat";
import { addHoliday, deleteHoliday } from "@/modules/cms/actions/settings";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { inputSx, saveButtonSx, SectionCard } from "./settings-ui";

export type HolidayRow = {
  id: string;
  date: string; // "YYYY-MM-DD"
  name: string;
  isRecurring: boolean;
};

export function HolidaysManager({ holidays }: { holidays: HolidayRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<HolidayRow | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await addHoliday(formData);
      if (res.error) {
        setError(res.error);
        return;
      }
      setSuccess("Hari libur ditambahkan.");
      (e.target as HTMLFormElement).reset();
      router.refresh();
    });
  }

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await deleteHoliday(target.id);
      if (res.error) {
        setError(res.error);
        return;
      }
      setSuccess(`"${target.name}" dihapus.`);
      router.refresh();
    });
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today
    .getDate()
    .toString()
    .padStart(2, "0")}`;
  const upcoming = holidays.filter((h) => h.date >= todayStr);
  const past = holidays.filter((h) => h.date < todayStr).reverse();

  function formatDate(dateStr: string): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <SectionCard
      icon={<EventBusyIcon sx={{ fontSize: 20, color: "#1D4ED8" }} />}
      title="Hari Libur"
      description="Tanggal libur nasional / acara — slot booking otomatis ditutup pada tanggal ini."
    >
      {/* Form tambah */}
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" }, flexWrap: "wrap" }}>
          <TextField
            name="date"
            label="Tanggal"
            type="date"
            required
            size="small"
            sx={{ ...inputSx, width: { xs: "100%", sm: 170 } }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            name="name"
            label="Nama Libur"
            placeholder="mis. Idul Fitri 1447 H"
            required
            size="small"
            sx={{ ...inputSx, flex: 1, minWidth: 180 }}
          />
          <FormControlLabel
            control={<Checkbox name="isRecurring" size="small" sx={{ color: "#94A3B8", "&.Mui-checked": { color: "#1D4ED8" } }} />}
            label={
              <Typography variant="caption" sx={{ fontSize: "0.75rem", color: "#64748B" }}>
                Berulang tiap tahun
              </Typography>
            }
            sx={{ m: 0 }}
          />
          <Button
            type="submit"
            variant="contained"
            size="small"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            disabled={pending}
            sx={{ ...saveButtonSx, flexShrink: 0 }}
          >
            Tambah
          </Button>
        </Stack>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mt: 2, borderRadius: 1, fontSize: "0.8rem" }}>
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert severity="success" sx={{ mt: 2, borderRadius: 1, fontSize: "0.8rem" }}>
          {success}
        </Alert>
      ) : null}

      {/* Daftar mendatang */}
      <Box sx={{ mt: 3 }}>
        <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: "#475569", mb: 1, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Mendatang ({upcoming.length})
        </Typography>
        {upcoming.length === 0 ? (
          <Typography variant="body2" sx={{ color: "#94A3B8", py: 2, textAlign: "center" }}>
            Belum ada hari libur terjadwal.
          </Typography>
        ) : (
          <Stack divider={<Box sx={{ borderTop: "1px solid #F1F5F9" }} />}>
            {upcoming.map((h) => (
              <HolidayItem key={h.id} holiday={h} formatDate={formatDate} onDelete={() => setDeleting(h)} disabled={pending} />
            ))}
          </Stack>
        )}
      </Box>

      {/* Daftar lewat */}
      {past.length > 0 ? (
        <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid #F1F5F9" }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: "#94A3B8", mb: 1, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Sudah lewat ({past.length})
          </Typography>
          <Stack divider={<Box sx={{ borderTop: "1px solid #F8FAFC" }} />}>
            {past.map((h) => (
              <HolidayItem key={h.id} holiday={h} formatDate={formatDate} onDelete={() => setDeleting(h)} disabled={pending} muted />
            ))}
          </Stack>
        </Box>
      ) : null}

      <ConfirmDialog
        open={deleting !== null}
        variant="delete"
        title="Hapus hari libur?"
        description={deleting ? `Tanggal "${deleting.name}" akan dihapus dan slot booking pada tanggal tersebut otomatis terbuka kembali.` : ""}
        confirmLabel="Hapus"
        loading={pending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </SectionCard>
  );
}

function HolidayItem({
  holiday,
  formatDate,
  onDelete,
  disabled,
  muted = false,
}: {
  holiday: HolidayRow;
  formatDate: (d: string) => string;
  onDelete: () => void;
  disabled: boolean;
  muted?: boolean;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.25 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: muted ? "#94A3B8" : "#0F172A" }}>
            {holiday.name}
          </Typography>
          {holiday.isRecurring ? (
            <Tooltip title="Berulang setiap tahun pada tanggal yang sama">
              <Chip
                icon={<RepeatIcon sx={{ fontSize: 12 }} />}
                label="Tahunan"
                size="small"
                sx={{ height: 20, fontSize: "0.68rem", bgcolor: "rgba(29,78,216,0.08)", color: "#1D4ED8", "& .MuiChip-icon": { color: "#1D4ED8" } }}
              />
            </Tooltip>
          ) : null}
        </Box>
        <Typography variant="caption" sx={{ color: muted ? "#CBD5E1" : "#64748B" }}>
          {formatDate(holiday.date)}
        </Typography>
      </Box>
      <Tooltip title="Hapus">
        <IconButton size="small" onClick={onDelete} disabled={disabled} sx={{ color: "#DC2626", "&:hover": { bgcolor: "rgba(220,38,38,0.06)" } }}>
          <DeleteIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
