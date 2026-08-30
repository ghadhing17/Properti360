"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableContainer from "@mui/material/TableContainer";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip";
import Switch from "@mui/material/Switch";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import MuiSelect from "@mui/material/Select";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import LockResetIcon from "@mui/icons-material/LockReset";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { createStaffUser, updateUserRole, toggleUserActive, deleteUser, resetUserPassword } from "@/modules/cms/actions/users";
import type { AdminUserRow } from "@/modules/cms/queries/settings";
import { inputSx, saveButtonSx, SectionCard } from "./settings-ui";

type Props = { users: AdminUserRow[]; currentUserId: string };

const ROLE_LABEL: Record<string, string> = { ADMIN: "Admin", CUSTOMER: "Customer" };

export function UsersManager({ users, currentUserId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleting, setDeleting] = useState<AdminUserRow | null>(null);
  const [tempPassword, setTempPassword] = useState<{ user: string; password: string } | null>(null);

  function run(fn: () => Promise<{ error?: string }>, okMsg?: string) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await fn();
      if (res.error) {
        setError(res.error);
        return;
      }
      if (okMsg) setSuccess(okMsg);
      router.refresh();
    });
  }

  return (
    <SectionCard
      icon={<ManageAccountsIcon sx={{ fontSize: 20, color: "#1D4ED8" }} />}
      title="Kelola Pengguna"
      description="Kontrol akun admin/staff dan customer: role, status aktif, reset password, hapus akun."
      action={
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon sx={{ fontSize: 16 }} />}
          onClick={() => setAddOpen(true)}
          sx={{ ...saveButtonSx, fontSize: "0.75rem" }}
        >
          Tambah Akun
        </Button>
      }
    >
      {error ? (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 1, fontSize: "0.8rem" }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 1, fontSize: "0.8rem" }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      ) : null}

      <TableContainer sx={{ border: "1px solid #E2E8F0", borderRadius: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#F8FAFC" }}>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem", color: "#64748B" }}>Pengguna</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem", color: "#64748B" }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem", color: "#64748B" }}>Listing</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem", color: "#64748B" }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.72rem", color: "#64748B" }}>Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              return (
                <TableRow key={u.id} sx={{ "&:hover": { bgcolor: "#F8FAFC" } }}>
                  <TableCell>
                    <Typography component="span" sx={{ fontWeight: 600, fontSize: "0.8rem", color: "#0F172A", display: "block" }}>
                      {u.name} {isSelf ? <Chip label="Kamu" size="small" sx={{ height: 18, fontSize: "0.62rem", bgcolor: "rgba(29,78,216,0.1)", color: "#1D4ED8" }} /> : null}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748B" }}>
                      {u.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {isSelf ? (
                      <Chip label={ROLE_LABEL[u.role]} size="small" sx={{ height: 22, fontSize: "0.7rem", bgcolor: "rgba(29,78,216,0.08)", color: "#1D4ED8" }} />
                    ) : (
                      <MuiSelect
                        size="small"
                        value={u.role}
                        disabled={pending}
                        onChange={(e) => run(() => updateUserRole(u.id, String(e.target.value)), `Role ${u.name} diubah menjadi ${ROLE_LABEL[String(e.target.value)]}.`)}
                        sx={{
                          height: 30,
                          fontSize: "0.75rem",
                          minWidth: 108,
                          borderRadius: 1,
                          bgcolor: "white",
                          "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E2E8F0" },
                        }}
                      >
                        <MenuItem value="ADMIN">Admin</MenuItem>
                        <MenuItem value="CUSTOMER">Customer</MenuItem>
                      </MuiSelect>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.78rem", color: "#475569" }}>{u.listingCount}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <Switch
                        size="small"
                        checked={u.isActive}
                        disabled={pending || isSelf}
                        onChange={(e) => run(() => toggleUserActive(u.id, e.target.checked), `Akun ${u.name} ${e.target.checked ? "diaktifkan" : "dinonaktifkan"}.`)}
                        sx={{ "&.Mui-checked": { color: "#1D4ED8" } }}
                      />
                      <Chip
                        label={u.isActive ? "Aktif" : "Nonaktif"}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.66rem",
                          bgcolor: u.isActive ? "rgba(22,163,74,0.1)" : "rgba(148,163,184,0.18)",
                          color: u.isActive ? "#16A34A" : "#64748B",
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: "inline-flex", gap: 0.5 }}>
                      <Tooltip title="Reset password (hasilkan password sementara)">
                        <IconButton
                          size="small"
                          disabled={pending}
                          onClick={() => run(async () => {
                            const res = await resetUserPassword(u.id);
                            if (res.success && res.data?.tempPassword) {
                              setTempPassword({ user: u.name, password: String(res.data.tempPassword) });
                            }
                            return res;
                          })}
                          sx={{ color: "#D97706", "&:hover": { bgcolor: "rgba(217,119,6,0.08)" } }}
                        >
                          <LockResetIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={isSelf ? "Tidak bisa menghapus akun sendiri" : "Hapus akun"}>
                        <span>
                          <IconButton
                            size="small"
                            disabled={pending || isSelf}
                            onClick={() => setDeleting(u)}
                            sx={{ color: "#DC2626", "&:hover": { bgcolor: "rgba(220,38,38,0.06)" } }}
                          >
                            <DeleteIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Alert severity="info" sx={{ mt: 2, borderRadius: 1, fontSize: "0.75rem" }}>
        Akun yang dinonaktifkan tidak bisa login lagi. Menghapus akun tidak menghapus listing — pindahkan listing ke akun lain dulu jika perlu.
      </Alert>

      <AddUserDialog open={addOpen} onClose={() => setAddOpen(false)} onCreated={() => router.refresh()} />

      <ConfirmDialog
        open={deleting !== null}
        variant="delete"
        title="Hapus akun?"
        description={
          deleting
            ? `Akun "${deleting.name}" (${deleting.email}) akan dihapus permanen. Akun dengan listing aktif tidak bisa dihapus.`
            : ""
        }
        confirmLabel="Hapus"
        loading={pending}
        onConfirm={() => {
          const target = deleting;
          setDeleting(null);
          if (target) run(() => deleteUser(target.id), `Akun ${target.name} dihapus.`);
        }}
        onCancel={() => setDeleting(null)}
      />

      {/* Dialog hasil reset password */}
      <Dialog open={tempPassword !== null} onClose={() => setTempPassword(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", color: "#0F172A" }}>
          Password sementara dibuat
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 1, fontSize: "0.78rem" }}>
            Catat sekarang — password hanya ditampilkan sekali.
          </Alert>
          <Typography sx={{ fontSize: "0.82rem", color: "#475569", mb: 1 }}>
            Bagikan password berikut ke <strong>{tempPassword?.user}</strong>:
          </Typography>
          <Box
            sx={{
              fontFamily: "monospace",
              fontSize: "1rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textAlign: "center",
              bgcolor: "#F8FAFC",
              border: "1px dashed #CBD5E1",
              borderRadius: 1,
              py: 1.5,
              color: "#1D4ED8",
              userSelect: "all",
            }}
          >
            {tempPassword?.password}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="contained" onClick={() => setTempPassword(null)} sx={saveButtonSx}>
            Selesai
          </Button>
        </DialogActions>
      </Dialog>
    </SectionCard>
  );
}

// ── Dialog tambah akun ───────────────────────────────────────────────────────
function AddUserDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [state, formAction, pending] = useActionState(createStaffUser, {});

  useEffect(() => {
    if (state.success) {
      onClose();
      onCreated();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog open={open} onClose={pending ? undefined : onClose} maxWidth="sm" fullWidth>
      <Box component="form" action={formAction} noValidate>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.25, fontWeight: 700, fontSize: "1rem", color: "#0F172A" }}>
          <PersonAddAlt1Icon sx={{ fontSize: 22, color: "#1D4ED8" }} />
          Tambah Akun Baru
        </DialogTitle>
        <DialogContent sx={{ pt: "8px !important" }}>
          {state.error ? (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 1, fontSize: "0.8rem" }}>
              {state.error}
            </Alert>
          ) : null}

          <Stack spacing={2}>
            <TextField name="name" label="Nama Lengkap" required fullWidth size="small" sx={inputSx} />
            <TextField
              name="email"
              label="Email"
              type="email"
              required
              fullWidth
              size="small"
              sx={inputSx}
              error={Boolean(state.fieldErrors?.email)}
            />
            <TextField
              name="phone"
              label="No. HP (opsional)"
              fullWidth
              size="small"
              sx={inputSx}
              error={Boolean(state.fieldErrors?.phone)}
            />
            <TextField
              name="password"
              label="Password"
              type="password"
              required
              fullWidth
              size="small"
              sx={inputSx}
              helperText="Minimal 8 karakter."
              error={Boolean(state.fieldErrors?.password)}
            />
            <TextField name="role" label="Role" select required defaultValue="CUSTOMER" fullWidth size="small" sx={inputSx}>
              <MenuItem value="CUSTOMER">Customer — punya listing sendiri</MenuItem>
              <MenuItem value="ADMIN">Admin — akses penuh CMS</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={onClose} disabled={pending} variant="outlined" size="small" sx={{ borderColor: "#E2E8F0", color: "#64748B", borderRadius: 1 }}>
            Batal
          </Button>
          <Button type="submit" variant="contained" disabled={pending} size="small" sx={saveButtonSx}>
            {pending ? "Menyimpan..." : "Buat Akun"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
