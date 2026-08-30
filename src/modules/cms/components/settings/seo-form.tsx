"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import FormHelperText from "@mui/material/FormHelperText";
import CircularProgress from "@mui/material/CircularProgress";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SaveIcon from "@mui/icons-material/Save";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import { updateSeoSettings, uploadOgImage, removeOgImage } from "@/modules/cms/actions/settings";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { inputSx, saveButtonSx, SectionCard } from "./settings-ui";

type Props = {
  values: {
    metaTitle: string;
    metaDescription: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
  };
};

function FeedbackAlert({ error, success, successText }: { error?: string; success?: boolean; successText: string }) {
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2, borderRadius: 1, fontSize: "0.8rem" }}>
        {error}
      </Alert>
    );
  }
  if (success) {
    return (
      <Alert
        severity="success"
        icon={<CheckCircleIcon fontSize="small" />}
        sx={{ mb: 2, borderRadius: 1, fontSize: "0.8rem" }}
      >
        {successText}
      </Alert>
    );
  }
  return null;
}

export function SeoSettingsForm({ values }: Props) {
  const router = useRouter();
  const [textState, textAction, textPending] = useActionState(updateSeoSettings, {});
  const [imageState, imageAction, imagePending] = useActionState(uploadOgImage, {});
  const [preview, setPreview] = useState<string | null>(values.ogImage || null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (imageState.success && imageState.data?.ogImageUrl) {
      setPreview(String(imageState.data.ogImageUrl));
      router.refresh();
    }
  }, [imageState, router]);

  useEffect(() => {
    if (textState.success) router.refresh();
  }, [textState, router]);

  function handleRemove() {
    setRemoving(true);
    void (async () => {
      try {
        const res = await removeOgImage();
        if (res.error) {
          console.error("[removeOgImage]", res.error);
        } else {
          setPreview(null);
          setConfirmRemove(false);
          router.refresh();
        }
      } finally {
        setRemoving(false);
      }
    })();
  }

  return (
    <Stack spacing={3}>
      {/* Meta & OG text */}
      <SectionCard
        icon={<ManageSearchIcon sx={{ fontSize: 20, color: "#1D4ED8" }} />}
        title="Meta Tags & Open Graph"
        description="Default SEO situs + tampilan saat link dibagikan ke WhatsApp/Facebook/X."
      >
        <Box component="form" action={textAction} noValidate>
          <FeedbackAlert
            error={textState.error}
            success={textState.success}
            successText="Pengaturan SEO & OG berhasil disimpan."
          />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                name="metaTitle"
                label="Meta Title"
                defaultValue={values.metaTitle}
                fullWidth
                size="small"
                sx={inputSx}
                placeholder="mis. Properti 360 — Jasa Virtual Tour 360° Properti"
                helperText="Maksimal 70 karakter. Kosong = fallback otomatis dari nama situs."
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                name="ogTitle"
                label="OG Title"
                defaultValue={values.ogTitle}
                fullWidth
                size="small"
                sx={inputSx}
                helperText="Judul saat link dibagikan. Kosong = pakai meta title."
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                name="metaDescription"
                label="Meta Description"
                defaultValue={values.metaDescription}
                fullWidth
                size="small"
                multiline
                minRows={3}
                sx={inputSx}
                helperText="Maksimal 200 karakter, tampil di hasil pencarian Google."
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                name="ogDescription"
                label="OG Description"
                defaultValue={values.ogDescription}
                fullWidth
                size="small"
                multiline
                minRows={3}
                sx={inputSx}
                helperText="Maksimal 220 karakter. Kosong = pakai meta description."
              />
            </Grid>
          </Grid>

          <Stack direction="row" sx={{ justifyContent: "flex-end", mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon sx={{ fontSize: 18 }} />}
              disabled={textPending}
              sx={saveButtonSx}
            >
              {textPending ? "Menyimpan..." : "Simpan SEO & OG"}
            </Button>
          </Stack>
        </Box>
      </SectionCard>

      {/* OG Image */}
      <SectionCard
        icon={<UploadFileIcon sx={{ fontSize: 20, color: "#1D4ED8" }} />}
        title="OG Image"
        description="Gambar yang tampil saat link situs dibagikan ke media sosial / WhatsApp."
        action={
          preview ? (
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
              onClick={() => setConfirmRemove(true)}
              disabled={removing}
              sx={{ borderColor: "rgba(220,38,38,0.3)", color: "#DC2626", borderRadius: 1, fontSize: "0.72rem" }}
            >
              Hapus
            </Button>
          ) : undefined
        }
      >
        <Box component="form" action={imageAction} noValidate>
          <FeedbackAlert
            error={imageState.error}
            success={imageState.success}
            successText="Gambar OG berhasil diperbarui."
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} sx={{ alignItems: { sm: "flex-start" } }}>
            <Box
              sx={{
                width: { xs: "100%", sm: 240 },
                aspectRatio: "1.91 / 1",
                borderRadius: 1,
                border: "1px dashed #CBD5E1",
                bgcolor: "#F8FAFC",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Preview OG image"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <Box sx={{ textAlign: "center", px: 1 }}>
                  <UploadFileIcon sx={{ fontSize: 28, color: "#CBD5E1" }} />
                  <FormHelperText sx={{ textAlign: "center", fontSize: "0.7rem", color: "#94A3B8", m: 0 }}>
                    Belum ada gambar
                  </FormHelperText>
                </Box>
              )}
            </Box>

            <Box sx={{ flex: 1 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={
                  imagePending ? <CircularProgress size={16} sx={{ color: "#1D4ED8" }} /> : <UploadFileIcon sx={{ fontSize: 18 }} />
                }
                disabled={imagePending}
                sx={{ borderColor: "rgba(29,78,216,0.3)", color: "#1D4ED8", borderRadius: 1 }}
              >
                {imagePending ? "Mengunggah..." : "Pilih Gambar"}
                <input
                  type="file"
                  name="ogImage"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Preview lokal instan; upload asli lewat form action di atas
                      setPreview(URL.createObjectURL(file));
                      e.currentTarget.form?.requestSubmit();
                      e.target.value = "";
                    }
                  }}
                />
              </Button>
              <FormHelperText sx={{ fontSize: "0.72rem", color: "#64748B", mt: 1, maxWidth: 420 }}>
                JPG/PNG/WebP, maksimal 5MB. Ukuran ideal 1200×630 px (rasio 1.91:1) agar tampil
                penuh di preview WhatsApp &amp; Facebook. Gambar langsung ter-upload saat dipilih.
              </FormHelperText>
            </Box>
          </Stack>
        </Box>
      </SectionCard>

      <ConfirmDialog
        open={confirmRemove}
        variant="delete"
        title="Hapus OG Image?"
        description="Gambar OG akan dihapus dari penyimpanan dan situs kembali tanpa gambar OG kustom."
        confirmLabel="Hapus"
        loading={removing}
        onConfirm={handleRemove}
        onCancel={() => setConfirmRemove(false)}
      />
    </Stack>
  );
}
