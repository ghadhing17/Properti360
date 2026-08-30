"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCategory, updateCategory, deleteCategory } from "@/modules/cms/actions/categories";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import CategoryIcon from "@mui/icons-material/Category";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";

type Category = {
  id: string;
  name: string;
  slug: string;
  _count: { listings: number };
  createdAt: Date;
};

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 1,
    bgcolor: "white",
    "& fieldset": { borderColor: "#E2E8F0" },
    "&:hover fieldset": { borderColor: "#CBD5E1" },
    "&.Mui-focused fieldset": { borderColor: "#1D4ED8", borderWidth: 2 },
  },
  "& .MuiInputLabel-root": { fontSize: "0.85rem" },
  "& .MuiInputBase-input": { fontSize: "0.875rem" },
};

// ── Tambah Kategori Baru ──────────────────────────────────────────────────────
function AddCategoryForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await createCategory(formData);
      if (res.error) { setError(res.error); return; }
      setOpen(false);
      (e.target as HTMLFormElement).reset();
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button
        startIcon={<AddIcon />}
        variant="contained"
        size="small"
        onClick={() => setOpen(true)}
        sx={{ bgcolor: "#1D4ED8", "&:hover": { bgcolor: "#1E3A8A" }, borderRadius: 1, fontWeight: 600, fontSize: "0.8rem" }}
      >
        Tambah Kategori
      </Button>
    );
  }

  return (
    <Paper elevation={0} sx={{ border: "1px solid #1D4ED8", borderRadius: 1, p: 2, bgcolor: "rgba(239,246,255,0.6)" }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1D4ED8", mb: 1.5, fontSize: "0.85rem" }}>
        Kategori Baru
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <Box sx={{ display: "flex", flexDirection: "row", gap: 1, alignItems: "flex-start" }}>
          <TextField
            name="name"
            label="Nama Kategori"
            size="small"
            required
            autoFocus
            placeholder="Contoh: Virtual Tour Premium"
            sx={{ ...inputSx, flex: 1 }}
            slotProps={{ htmlInput: { maxLength: 60 } }}
          />
          <Tooltip title="Simpan">
            <span>
              <IconButton type="submit" disabled={pending} size="small"
                sx={{ bgcolor: "#1D4ED8", color: "white", borderRadius: 1, "&:hover": { bgcolor: "#1E3A8A" }, "&:disabled": { bgcolor: "#CBD5E1" } }}>
                <CheckIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Batal">
            <IconButton size="small" onClick={() => { setOpen(false); setError(null); }}
              sx={{ border: "1px solid #E2E8F0", borderRadius: 1, "&:hover": { bgcolor: "#F8FAFC" } }}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
        {error && <Alert severity="error" sx={{ mt: 1, borderRadius: 1, py: 0, fontSize: "0.78rem" }}>{error}</Alert>}
      </Box>
    </Paper>
  );
}

// ── Row Edit Inline ────────────────────────────────────────────────────────────
function CategoryRow({ category }: { category: Category }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pendingEdit, startEdit] = useTransition();
  const [pendingDelete, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startEdit(async () => {
      const res = await updateCategory(category.id, formData);
      if (res.error) { setError(res.error); return; }
      setEditing(false);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm(`Hapus kategori "${category.name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setError(null);
    startDelete(async () => {
      const res = await deleteCategory(category.id);
      if (res.error) { setError(res.error); return; }
      router.refresh();
    });
  }

  return (
    <Box>
      {editing ? (
        <Box component="form" onSubmit={handleEdit} sx={{ py: 1.5, px: 2, bgcolor: "rgba(239,246,255,0.6)", border: "1px solid #1D4ED8", borderRadius: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "row", gap: 1, alignItems: "flex-start" }}>
            <TextField
              name="name"
              size="small"
              defaultValue={category.name}
              required
              autoFocus
              sx={{ ...inputSx, flex: 1 }}
              slotProps={{ htmlInput: { maxLength: 60 } }}
            />
            <Tooltip title="Simpan">
              <span>
                <IconButton type="submit" disabled={pendingEdit} size="small"
                  sx={{ bgcolor: "#1D4ED8", color: "white", borderRadius: 1, "&:hover": { bgcolor: "#1E3A8A" }, "&:disabled": { bgcolor: "#CBD5E1" } }}>
                  <CheckIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Batal">
              <IconButton size="small" onClick={() => { setEditing(false); setError(null); }}
                sx={{ border: "1px solid #E2E8F0", borderRadius: 1, "&:hover": { bgcolor: "#F8FAFC" } }}>
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
          {error && <Alert severity="error" sx={{ mt: 1, borderRadius: 1, py: 0, fontSize: "0.78rem" }}>{error}</Alert>}
        </Box>
      ) : (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.5, px: 2, "&:hover": { bgcolor: "#F8FAFC" }, borderRadius: 1, gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
            <CategoryIcon sx={{ fontSize: 16, color: "#94A3B8", flexShrink: 0 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#0F172A", lineHeight: 1.3 }}>
                {category.name}
              </Typography>
              <Typography variant="caption" sx={{ color: "#94A3B8", fontFamily: "monospace" }}>
                /{category.slug}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
            <Chip
              icon={<FormatListBulletedIcon sx={{ fontSize: "12px !important" }} />}
              label={`${category._count.listings} listing`}
              size="small"
              variant="outlined"
              sx={{ fontSize: "0.72rem", borderColor: "#E2E8F0", color: "#64748B", borderRadius: 1 }}
            />
            {error && (
              <Tooltip title={error}>
                <Alert severity="error" sx={{ py: 0, px: 1, borderRadius: 1, fontSize: "0.72rem", lineHeight: 1.2 }}>
                  {error.length > 40 ? error.slice(0, 40) + "..." : error}
                </Alert>
              </Tooltip>
            )}
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => { setEditing(true); setError(null); }}
                sx={{ border: "1px solid #E2E8F0", borderRadius: 1, "&:hover": { bgcolor: "#EFF6FF", borderColor: "#1D4ED8", color: "#1D4ED8" } }}>
                <EditIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={category._count.listings > 0 ? `Tidak bisa hapus — dipakai ${category._count.listings} listing` : "Hapus"}>
              <span>
                <IconButton size="small" onClick={handleDelete} disabled={pendingDelete || category._count.listings > 0}
                  sx={{ border: "1px solid #E2E8F0", borderRadius: 1, "&:hover": { bgcolor: "#FEF2F2", borderColor: "#DC2626", color: "#DC2626" }, "&:disabled": { opacity: 0.4 } }}>
                  <DeleteIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ── Main Export ────────────────────────────────────────────────────────────────
export function CategoryCrud({ categories }: { categories: Category[] }) {
  return (
    <Stack spacing={3}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#0F172A" }}>Kategori</Typography>
          <Typography variant="caption" sx={{ color: "#94A3B8" }}>
            {categories.length} kategori terdaftar — slug otomatis dari nama
          </Typography>
        </Box>
        <AddCategoryForm />
      </Box>

      {/* List */}
      <Paper elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 1, overflow: "hidden" }}>
        {categories.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <CategoryIcon sx={{ fontSize: 36, color: "#CBD5E1", mb: 1 }} />
            <Typography variant="body2" sx={{ color: "#94A3B8" }}>
              Belum ada kategori. Tambah kategori pertama kamu.
            </Typography>
          </Box>
        ) : (
          <Stack divider={<Divider sx={{ borderColor: "#F1F5F9" }} />}>
            {categories.map((cat) => (
              <CategoryRow key={cat.id} category={cat} />
            ))}
          </Stack>
        )}
      </Paper>

      {/* Info */}
      <Alert severity="info" sx={{ borderRadius: 1, fontSize: "0.78rem" }}>
        Kategori tidak bisa dihapus jika masih dipakai oleh listing. Pindahkan listing ke kategori lain dulu sebelum menghapus.
      </Alert>
    </Stack>
  );
}
