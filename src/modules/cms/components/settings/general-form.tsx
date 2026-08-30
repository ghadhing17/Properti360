"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import StorefrontIcon from "@mui/icons-material/Storefront";
import SaveIcon from "@mui/icons-material/Save";
import { updateGeneralSettings } from "@/modules/cms/actions/settings";
import { inputSx, saveButtonSx, SectionCard } from "./settings-ui";

export type SiteSettingsValues = {
  siteName: string;
  tagline: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  whatsapp: string;
  address: string;
  instagramUrl: string;
  facebookUrl: string;
};

type Props = { values: SiteSettingsValues };

export function GeneralSettingsForm({ values }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateGeneralSettings, {});

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <SectionCard
      icon={<StorefrontIcon sx={{ fontSize: 20, color: "#1D4ED8" }} />}
      title="Profil Bisnis"
      description="Informasi dasar bisnis yang dipakai di seluruh situs dan metadata."
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
            Pengaturan profil bisnis berhasil disimpan.
          </Alert>
        ) : null}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 7 }}>
            <TextField
              name="siteName"
              label="Nama Situs / Bisnis"
              defaultValue={values.siteName}
              required
              fullWidth
              size="small"
              sx={inputSx}
              helperText="Dipakai di title tab browser, metadata, dan branding."
            />
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              name="tagline"
              label="Tagline"
              defaultValue={values.tagline}
              fullWidth
              size="small"
              sx={inputSx}
              placeholder="mis. Virtual Tour 360° Properti"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              name="description"
              label="Deskripsi Singkat Bisnis"
              defaultValue={values.description}
              fullWidth
              size="small"
              multiline
              minRows={2}
              sx={inputSx}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              name="contactEmail"
              label="Email Kontak"
              type="email"
              defaultValue={values.contactEmail}
              fullWidth
              size="small"
              sx={inputSx}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              name="contactPhone"
              label="No. Telepon"
              defaultValue={values.contactPhone}
              fullWidth
              size="small"
              sx={inputSx}
              placeholder="mis. 0812-3456-7890"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              name="whatsapp"
              label="No. WhatsApp"
              defaultValue={values.whatsapp}
              fullWidth
              size="small"
              sx={inputSx}
              placeholder="mis. 6281234567890"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              name="instagramUrl"
              label="URL Instagram"
              defaultValue={values.instagramUrl}
              fullWidth
              size="small"
              sx={inputSx}
              placeholder="https://instagram.com/..."
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              name="facebookUrl"
              label="URL Facebook"
              defaultValue={values.facebookUrl}
              fullWidth
              size="small"
              sx={inputSx}
              placeholder="https://facebook.com/..."
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              name="address"
              label="Alamat"
              defaultValue={values.address}
              fullWidth
              size="small"
              multiline
              minRows={2}
              sx={inputSx}
            />
          </Grid>
        </Grid>

        <Stack direction="row" sx={{ justifyContent: "flex-end", mt: 3 }}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon sx={{ fontSize: 18 }} />}
            disabled={pending}
            sx={saveButtonSx}
          >
            {pending ? "Menyimpan..." : "Simpan Profil Bisnis"}
          </Button>
        </Stack>
      </Box>
    </SectionCard>
  );
}
