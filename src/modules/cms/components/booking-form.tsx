"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBooking, updateBooking } from "@/modules/cms/actions/admin-bookings";
import { propertyTypeValues, propertyTypeLabels, bookingStatusValues, bookingStatusLabels } from "@/shared/lib/validations/booking";
import { TIME_SLOTS, toDateString, toTimeString } from "@/shared/lib/booking-schedule";
import { formatPrice } from "@/shared/lib/validations/product";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import MuiSelect from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import CircularProgress from "@mui/material/CircularProgress";
import SaveIcon from "@mui/icons-material/Save";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import type { BookingRequest } from "@prisma/client";
import type { ProductForBooking } from "@/shared/lib/validations/product";

const initialState = {
  success: false,
  error: undefined as string | undefined,
  fieldErrors: undefined as Record<string, string[]> | undefined,
};

type ConflictEntry = { id: string; name: string; formattedDate: string };

type Props = {
  mode: "create" | "edit";
  booking?: BookingRequest & { productId?: string | null };
  products?: ProductForBooking[];
};

export function BookingForm({ mode, booking, products = [] }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const skipConfirmRef = useRef(false);
  const action = mode === "create" ? createBooking : updateBooking.bind(null, booking!.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  // ── Date / Time state for live conflict check ───────────────────────────
  const [selectedDate, setSelectedDate] = useState<string>(
    booking?.preferredDate ? toDateString(new Date(booking.preferredDate)) : ""
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    booking?.preferredDate ? toTimeString(new Date(booking.preferredDate)) : "09:00"
  );

  // ── Live conflict check ─────────────────────────────────────────────────
  const [conflicts, setConflicts]           = useState<ConflictEntry[]>([]);
  const [conflictLoading, setConflictLoading] = useState(false);
  const conflictTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const checkConflicts = useCallback(async (date: string, time: string) => {
    if (!date || !time) { setConflicts([]); return; }
    setConflictLoading(true);
    try {
      const params = new URLSearchParams({ date, time });
      if (mode === "edit" && booking?.id) params.set("excludeId", booking.id);
      const res = await fetch(`/api/bookings/conflicts?${params}`);
      const json = await res.json() as { conflicts: ConflictEntry[] };
      setConflicts(json.conflicts ?? []);
    } catch {
      setConflicts([]);
    } finally {
      setConflictLoading(false);
    }
  }, [mode, booking?.id]);

  useEffect(() => {
    clearTimeout(conflictTimer.current);
    conflictTimer.current = setTimeout(() => checkConflicts(selectedDate, selectedTime), 400);
    return () => clearTimeout(conflictTimer.current);
  }, [selectedDate, selectedTime, checkConflicts]);

  // ── Confirm dialog ───────────────────────────────────────────────────────
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    if (skipConfirmRef.current) {
      skipConfirmRef.current = false;
      return; // allow native form submission
    }
    e.preventDefault();
    setConfirmOpen(true);
  }

  function handleConfirmSave() {
    setConfirmOpen(false);
    skipConfirmRef.current = true;
    formRef.current?.requestSubmit();
  }

  const confirmDesc = mode === "create"
    ? `Simpan booking baru untuk ${formRef.current?.querySelector<HTMLInputElement>('[name="name"]')?.value || "customer ini"}?`
    : `Simpan perubahan booking untuk ${booking?.name}?\n\nPastikan semua informasi sudah benar sebelum menyimpan.`;

  return (
    <>
      <Box
        component="form"
        ref={formRef}
        action={formAction}
        onSubmit={handleSubmit}
        sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
      >
        {/* Server error / conflict warning */}
        {state.error && (
          <Alert severity={state.error.includes("bertabrakan") || state.error.includes("operasional") ? "warning" : "error"}
            icon={<WarningAmberIcon />}
            sx={{ borderRadius: 1, fontSize: "0.82rem", whiteSpace: "pre-line" }}>
            <AlertTitle sx={{ fontWeight: 700, fontSize: "0.82rem" }}>
              {state.error.includes("bertabrakan") ? "Jadwal Bertabrakan" : state.error.includes("operasional") ? "Di Luar Jam Operasional" : "Error"}
            </AlertTitle>
            {state.error}
          </Alert>
        )}

        {/* Live conflict warning */}
        {conflicts.length > 0 && (
          <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ borderRadius: 1, fontSize: "0.82rem" }}>
            <AlertTitle sx={{ fontWeight: 700, fontSize: "0.82rem" }}>Potensi Tabrakan Jadwal</AlertTitle>
            Jadwal ini bertabrakan dengan booking yang sudah ada (jendela ±4 jam):
            <ul style={{ margin: "6px 0 0", paddingLeft: 16 }}>
              {conflicts.map((c) => (
                <li key={c.id}><strong>{c.name}</strong> — {c.formattedDate}</li>
              ))}
            </ul>
          </Alert>
        )}

        <TextField name="name" label="Nama Lengkap" defaultValue={booking?.name ?? ""}
          required fullWidth size="small"
          error={!!state.fieldErrors?.name} helperText={state.fieldErrors?.name?.[0]}
          sx={inputSx} />

        <TextField name="phone" label="No HP" defaultValue={booking?.phone ?? ""}
          required fullWidth size="small"
          error={!!state.fieldErrors?.phone} helperText={state.fieldErrors?.phone?.[0]}
          sx={inputSx} />

        <TextField name="address" label="Alamat Properti" defaultValue={booking?.address ?? ""}
          required fullWidth size="small" multiline minRows={2} maxRows={4}
          error={!!state.fieldErrors?.address} helperText={state.fieldErrors?.address?.[0]}
          sx={inputSx} />

        <FormControl fullWidth size="small" sx={inputSx}>
          <InputLabel>Tipe Properti</InputLabel>
          <MuiSelect name="propertyType" label="Tipe Properti" defaultValue={booking?.propertyType ?? "RUMAH"}>
            {propertyTypeValues.map((v) => (
              <MenuItem key={v} value={v}>{propertyTypeLabels[v]}</MenuItem>
            ))}
          </MuiSelect>
        </FormControl>

        {products.length > 0 && (
          <FormControl fullWidth size="small" sx={inputSx}>
            <InputLabel>Paket Layanan</InputLabel>
            <MuiSelect name="productId" label="Paket Layanan" defaultValue={booking?.productId ?? ""}>
              <MenuItem value=""><em>— Tidak dipilih —</em></MenuItem>
              {products.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}{p.isPopular ? " ★" : ""} — {formatPrice(p.price)}
                </MenuItem>
              ))}
            </MuiSelect>
          </FormControl>
        )}

        {/* Date + Time side by side */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 7 }}>
            <TextField
              name="preferredDate"
              label="Tanggal Preferensi"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              fullWidth size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              helperText="Format: YYYY-MM-DD"
              sx={inputSx}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 5 }}>
            <FormControl fullWidth size="small" sx={inputSx}>
              <InputLabel shrink>Jam Mulai</InputLabel>
              <MuiSelect
                name="preferredTime"
                label="Jam Mulai"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value as string)}
                notched
              >
                {TIME_SLOTS.map((t) => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </MuiSelect>
              <FormHelperText>
                {conflictLoading
                  ? "Memeriksa jadwal…"
                  : "Ops: 09:00–16:00, blokir 4 jam"}
              </FormHelperText>
            </FormControl>
          </Grid>
        </Grid>

        <FormControl fullWidth size="small" sx={inputSx}>
          <InputLabel>Status</InputLabel>
          <MuiSelect name="status" label="Status" defaultValue={booking?.status ?? "PENDING"}>
            {bookingStatusValues.map((v) => (
              <MenuItem key={v} value={v}>{bookingStatusLabels[v]}</MenuItem>
            ))}
          </MuiSelect>
          {state.fieldErrors?.status && <FormHelperText>{state.fieldErrors.status[0]}</FormHelperText>}
        </FormControl>

        <Box sx={{ display: "flex", gap: 1.5, pt: 1 }}>
          <Button type="submit" variant="contained" disabled={pending}
            startIcon={pending ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            sx={{ bgcolor: "#1D4ED8", "&:hover": { bgcolor: "#1E3A8A" }, borderRadius: 1, fontWeight: 600 }}>
            {pending ? "Menyimpan..." : mode === "create" ? "Buat Booking" : "Simpan Perubahan"}
          </Button>
          <Button type="button" variant="outlined" onClick={() => router.push("/admin/bookings")}
            sx={{ borderColor: "#E2E8F0", color: "#64748B", borderRadius: 1 }}>
            Batal
          </Button>
        </Box>
      </Box>

      <ConfirmDialog
        open={confirmOpen}
        variant={mode === "edit" ? "save" : "info"}
        title={mode === "create" ? "Buat Booking Baru?" : "Simpan Perubahan?"}
        description={confirmDesc}
        confirmLabel={mode === "create" ? "Ya, Buat Booking" : "Ya, Simpan"}
        onConfirm={handleConfirmSave}
        onCancel={() => setConfirmOpen(false)}
        loading={pending}
      />
    </>
  );
}

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 1, bgcolor: "white",
    "& fieldset": { borderColor: "#E2E8F0" },
    "&:hover fieldset": { borderColor: "#CBD5E1" },
    "&.Mui-focused fieldset": { borderColor: "#1D4ED8", borderWidth: 2 },
  },
  "& .MuiInputLabel-root": { fontSize: "0.85rem" },
  "& .MuiInputBase-input": { fontSize: "0.875rem" },
};
