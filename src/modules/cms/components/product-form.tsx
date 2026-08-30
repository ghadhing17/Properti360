"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct } from "@/modules/cms/actions/products";
import { formatPrice } from "@/shared/lib/validations/product";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import SaveIcon from "@mui/icons-material/Save";
import type { ServiceProduct } from "@prisma/client";

const initialState = {
  success: false,
  error: undefined as string | undefined,
  fieldErrors: undefined as Record<string, string[]> | undefined,
};

type Props = { mode: "create" | "edit"; product?: ServiceProduct };

export function ProductForm({ mode, product }: Props) {
  const router = useRouter();
  const action = mode === "create" ? createProduct : updateProduct.bind(null, product!.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Box component="form" action={formAction} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {state.error && (
        <Alert severity="error" sx={{ borderRadius: 1, fontSize: "0.82rem" }}>{state.error}</Alert>
      )}

      <TextField name="name" label="Nama Produk / Paket" defaultValue={product?.name ?? ""}
        required fullWidth size="small"
        error={!!state.fieldErrors?.name} helperText={state.fieldErrors?.name?.[0]}
        placeholder="Contoh: Virtual Tour 360° Rumah Standard"
        sx={inputSx} />

      <TextField name="description" label="Deskripsi" defaultValue={product?.description ?? ""}
        required fullWidth size="small" multiline minRows={3} maxRows={6}
        error={!!state.fieldErrors?.description} helperText={state.fieldErrors?.description?.[0]}
        placeholder="Jelaskan paket layanan ini secara singkat dan menarik..."
        sx={inputSx} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField name="price" label="Harga (Rp)" defaultValue={product?.price ?? ""}
            fullWidth size="small" type="number"
            error={!!state.fieldErrors?.price} helperText={state.fieldErrors?.price?.[0] ?? "Kosongkan untuk 'Hubungi Kami'"}
            placeholder="Contoh: 500000"
            slotProps={{ htmlInput: { min: 0 } }}
            sx={inputSx} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField name="order" label="Urutan Tampil" defaultValue={product?.order ?? 0}
            fullWidth size="small" type="number"
            helperText="Angka lebih kecil tampil lebih dulu"
            slotProps={{ htmlInput: { min: 0 } }}
            sx={inputSx} />
        </Grid>
      </Grid>

      <TextField name="features" label="Fitur-fitur (satu per baris)"
        defaultValue={product?.features?.join("\n") ?? ""}
        fullWidth size="small" multiline minRows={4} maxRows={10}
        error={!!state.fieldErrors?.features}
        helperText={state.fieldErrors?.features?.[0] ?? "Tulis setiap fitur di baris baru. Contoh: 8 scene 360°"}
        placeholder={"8 scene 360°\nGaleri 20 foto HD\nRevisi 2×\nFile siap upload"}
        sx={inputSx} />

      <Box sx={{ display: "flex", gap: 3 }}>
        <FormControlLabel
          control={<Switch name="isActive" value="true" defaultChecked={product?.isActive ?? true} color="success" />}
          label={<Typography variant="body2" sx={{ fontSize: "0.85rem" }}>Tampilkan di landing page</Typography>}
        />
        <FormControlLabel
          control={<Switch name="isPopular" value="true" defaultChecked={product?.isPopular ?? false} color="warning" />}
          label={<Typography variant="body2" sx={{ fontSize: "0.85rem" }}>Tandai sebagai Populer</Typography>}
        />
      </Box>

      <Box sx={{ display: "flex", gap: 1.5, pt: 1 }}>
        <Button type="submit" variant="contained" disabled={pending} startIcon={<SaveIcon />}
          sx={{ bgcolor: "#1D4ED8", "&:hover": { bgcolor: "#1E3A8A" }, borderRadius: 1, fontWeight: 600 }}>
          {pending ? "Menyimpan..." : mode === "create" ? "Buat Produk" : "Simpan Perubahan"}
        </Button>
        <Button type="button" variant="outlined" onClick={() => router.push("/admin/products")}
          sx={{ borderColor: "#E2E8F0", color: "#64748B", borderRadius: 1 }}>
          Batal
        </Button>
      </Box>
    </Box>
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
