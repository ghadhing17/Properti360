"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PersonIcon from "@mui/icons-material/Person";
import LockResetIcon from "@mui/icons-material/LockReset";
import SaveIcon from "@mui/icons-material/Save";
import { updateAdminProfile, changeAdminPassword } from "@/modules/cms/actions/settings";
import { inputSx, saveButtonSx, SectionCard } from "./settings-ui";

type ProfileValues = { name: string; email: string; phone: string; joinedAt: string };

export function ProfileForm({ values }: { values: ProfileValues }) {
  const router = useRouter();
  const [profileState, profileAction, profilePending] = useActionState(updateAdminProfile, {});
  const [passwordState, passwordAction, passwordPending] = useActionState(changeAdminPassword, {});
  const passwordFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (profileState.success) router.refresh();
  }, [profileState, router]);

  useEffect(() => {
    if (passwordState.success) passwordFormRef.current?.reset();
  }, [passwordState]);

  return (
    <Stack spacing={3}>
      <SectionCard
        icon={<PersonIcon sx={{ fontSize: 20, color: "#1D4ED8" }} />}
        title="Profil Admin"
        description={`Akun: ${values.email} · Bergabung ${values.joinedAt}`}
      >
        <Box component="form" action={profileAction} noValidate>
          {profileState.error ? (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 1, fontSize: "0.8rem" }}>
              {profileState.error}
            </Alert>
          ) : null}
          {profileState.success ? (
            <Alert
              severity="success"
              icon={<CheckCircleIcon fontSize="small" />}
              sx={{ mb: 2, borderRadius: 1, fontSize: "0.8rem" }}
            >
              Profil berhasil diperbarui.
            </Alert>
          ) : null}

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                name="name"
                label="Nama Lengkap"
                defaultValue={values.name}
                required
                fullWidth
                size="small"
                sx={inputSx}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                name="phone"
                label="No. HP"
                defaultValue={values.phone}
                fullWidth
                size="small"
                sx={inputSx}
                placeholder="mis. 0812-3456-7890"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Email"
                value={values.email}
                fullWidth
                size="small"
                disabled
                sx={inputSx}
                helperText="Email tidak bisa diubah."
              />
            </Grid>
          </Grid>

          <Stack direction="row" sx={{ justifyContent: "flex-end", mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon sx={{ fontSize: 18 }} />}
              disabled={profilePending}
              sx={saveButtonSx}
            >
              {profilePending ? "Menyimpan..." : "Simpan Profil"}
            </Button>
          </Stack>
        </Box>
      </SectionCard>

      <SectionCard
        icon={<LockResetIcon sx={{ fontSize: 20, color: "#1D4ED8" }} />}
        title="Ganti Password"
        description="Password minimal 8 karakter. Kamu tetap login setelah mengganti password."
      >
        <Box component="form" action={passwordAction} noValidate ref={passwordFormRef}>
          {passwordState.error ? (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 1, fontSize: "0.8rem" }}>
              {passwordState.error}
            </Alert>
          ) : null}
          {passwordState.success ? (
            <Alert
              severity="success"
              icon={<CheckCircleIcon fontSize="small" />}
              sx={{ mb: 2, borderRadius: 1, fontSize: "0.8rem" }}
            >
              Password berhasil diganti.
            </Alert>
          ) : null}

          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                name="currentPassword"
                label="Password Saat Ini"
                type="password"
                required
                fullWidth
                size="small"
                sx={inputSx}
                error={Boolean(passwordState.fieldErrors?.currentPassword)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                name="newPassword"
                label="Password Baru"
                type="password"
                required
                fullWidth
                size="small"
                sx={inputSx}
                error={Boolean(passwordState.fieldErrors?.newPassword)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                name="confirmPassword"
                label="Konfirmasi Password Baru"
                type="password"
                required
                fullWidth
                size="small"
                sx={inputSx}
                error={Boolean(passwordState.fieldErrors?.confirmPassword)}
              />
            </Grid>
          </Grid>

          <Stack direction="row" sx={{ justifyContent: "flex-end", mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon sx={{ fontSize: 18 }} />}
              disabled={passwordPending}
              sx={saveButtonSx}
            >
              {passwordPending ? "Menyimpan..." : "Ganti Password"}
            </Button>
          </Stack>
        </Box>
      </SectionCard>
    </Stack>
  );
}
