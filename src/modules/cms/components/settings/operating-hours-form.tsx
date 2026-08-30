"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SaveIcon from "@mui/icons-material/Save";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { updateOperatingHours } from "@/modules/cms/actions/settings";
import type { DayHours } from "@/shared/lib/schedule-settings";
import { inputSx, saveButtonSx, SectionCard } from "./settings-ui";

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

export function OperatingHoursForm({ days }: { days: DayHours[] }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateOperatingHours, {});
  const [closed, setClosed] = useState<boolean[]>(days.map((d) => d.isClosed));

  useEffect(() => {
    setClosed(days.map((d) => d.isClosed));
  }, [days]);

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <SectionCard
      icon={<AccessTimeIcon sx={{ fontSize: 20, color: "#1D4ED8" }} />}
      title="Jam Operasional"
      description="Dipakai untuk membatasi slot booking publik dan menampilkan jam layanan."
    >
      <Box component="form" action={formAction} noValidate>
        {state.error ? (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 1, fontSize: "0.8rem" }}>
            {state.error}
          </Alert>
        ) : null}
        {state.success ? (
          <Alert
            severity="success"
            icon={<CheckCircleIcon fontSize="small" />}
            sx={{ mb: 2, borderRadius: 1, fontSize: "0.8rem" }}
          >
            Jam operasional berhasil disimpan.
          </Alert>
        ) : null}

        <Stack divider={<Divider sx={{ borderColor: "#F1F5F9" }} />}>
          {days.map((day, i) => (
            <Box
              key={day.dayOfWeek}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 1, sm: 2 },
                py: 1.25,
                flexWrap: { xs: "wrap", sm: "nowrap" },
              }}
            >
              <Typography sx={{ width: 64, fontWeight: 600, fontSize: "0.85rem", color: "#0F172A", flexShrink: 0 }}>
                {DAY_NAMES[i]}
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={!closed[i]}
                    onChange={(e) => {
                      setClosed((prev) => {
                        const next = [...prev];
                        next[i] = !e.target.checked;
                        return next;
                      });
                    }}
                    size="small"
                    sx={{ "&.Mui-checked": { color: "#1D4ED8" } }}
                  />
                }
                label={<Typography variant="caption" sx={{ fontSize: "0.72rem", color: "#64748B" }}>Buka</Typography>}
                sx={{ m: 0 }}
              />

              {/* Hidden input HANYA saat tutup — action mendeteksi tutup via presence key */}
              {closed[i] ? <input type="hidden" name={`day-${i}-isClosed`} value="1" /> : null}

              <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: "auto" }}>
                <TextField
                  name={`day-${i}-open`}
                  label="Buka"
                  type="time"
                  defaultValue={day.openTime}
                  disabled={closed[i]}
                  size="small"
                  sx={{ ...inputSx, width: 118 }}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <Typography sx={{ color: "#94A3B8", fontSize: "0.8rem" }}>–</Typography>
                <TextField
                  name={`day-${i}-close`}
                  label="Tutup"
                  type="time"
                  defaultValue={day.closeTime}
                  disabled={closed[i]}
                  size="small"
                  sx={{ ...inputSx, width: 118 }}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Box>
            </Box>
          ))}
        </Stack>

        <Stack direction="row" sx={{ justifyContent: "flex-end", mt: 3 }}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon sx={{ fontSize: 18 }} />}
            disabled={pending}
            sx={saveButtonSx}
          >
            {pending ? "Menyimpan..." : "Simpan Jam Operasional"}
          </Button>
        </Stack>
      </Box>
    </SectionCard>
  );
}
