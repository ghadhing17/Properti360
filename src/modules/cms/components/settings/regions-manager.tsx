"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Alert from "@mui/material/Alert";
import Collapse from "@mui/material/Collapse";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import InputAdornment from "@mui/material/InputAdornment";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import MapIcon from "@mui/icons-material/Map";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { updateActiveRegions } from "@/modules/cms/actions/settings";
import type { WilayahRow } from "@/modules/cms/queries/settings";
import { inputSx, saveButtonSx, SectionCard } from "./settings-ui";

type Props = {
  provinces: WilayahRow[];
  regencies: WilayahRow[];
  initialProvinces: string[];
  initialRegencies: string[];
};

function sortedCodes(s: Set<string>): string {
  return [...s].sort().join(",");
}

export function RegionsManager({ provinces, regencies, initialProvinces, initialRegencies }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [activeProvinces, setActiveProvinces] = useState<Set<string>>(new Set(initialProvinces));
  const [activeRegencies, setActiveRegencies] = useState<Set<string>>(new Set(initialRegencies));

  const initialKey = useMemo(
    () => `${sortedCodes(new Set(initialProvinces))}|${sortedCodes(new Set(initialRegencies))}`,
    [initialProvinces, initialRegencies]
  );
  const currentKey = `${sortedCodes(activeProvinces)}|${sortedCodes(activeRegencies)}`;
  const isDirty = currentKey !== initialKey;

  // Regencies dikelompokkan per provinsi (prefix kode)
  const regenciesByProvince = useMemo(() => {
    const map = new Map<string, WilayahRow[]>();
    for (const r of regencies) {
      const prov = r.code.slice(0, 2);
      const list = map.get(prov);
      if (list) list.push(r);
      else map.set(prov, [r]);
    }
    return map;
  }, [regencies]);

  const q = search.trim().toLowerCase();
  const visibleProvinces = q
    ? provinces.filter(
        (p) => p.name.toLowerCase().includes(q) || p.code.includes(q) ||
          (regenciesByProvince.get(p.code) ?? []).some((r) => r.name.toLowerCase().includes(q))
      )
    : provinces;

  function toggleRegency(code: string) {
    setError(null);
    setSuccess(null);
    const provCode = code.slice(0, 2);
    setActiveRegencies((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
    // Konsistensi: provinsi aktif jika punya ≥1 kota aktif
    setActiveProvinces((prev) => {
      const next = new Set(prev);
      const siblings = regenciesByProvince.get(provCode) ?? [];
      const anyActiveAfterToggle =
        siblings.some((r) => (r.code === code ? !activeRegencies.has(code) : activeRegencies.has(r.code)));
      if (anyActiveAfterToggle) next.add(provCode);
      else next.delete(provCode);
      return next;
    });
  }

  function toggleProvince(provCode: string, regList: WilayahRow[]) {
    setError(null);
    setSuccess(null);
    const allActive = regList.length > 0 && regList.every((r) => activeRegencies.has(r.code));
    setActiveRegencies((prev) => {
      const next = new Set(prev);
      for (const r of regList) {
        if (allActive) next.delete(r.code);
        else next.add(r.code);
      }
      return next;
    });
    setActiveProvinces((prev) => {
      const next = new Set(prev);
      if (allActive) next.delete(provCode);
      else next.add(provCode);
      return next;
    });
  }

  /** Matikan provinsi + seluruh kota/kab di bawahnya. */
  function clearProvince(provCode: string, regList: WilayahRow[]) {
    setError(null);
    setSuccess(null);
    setActiveRegencies((prev) => {
      const next = new Set(prev);
      for (const r of regList) next.delete(r.code);
      return next;
    });
    setActiveProvinces((prev) => {
      const next = new Set(prev);
      next.delete(provCode);
      return next;
    });
  }

  function toggleExpand(code: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function handleSave() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set(
        "payload",
        JSON.stringify({ provinces: [...activeProvinces], regencies: [...activeRegencies] })
      );
      const res = await updateActiveRegions({}, formData);
      if (res.error) {
        setError(res.error);
        return;
      }
      setSuccess(
        `Tersimpan: ${res.data?.provinces ?? 0} provinsi, ${res.data?.regencies ?? 0} kota/kab aktif.`
      );
      router.refresh();
    });
  }

  const totalActiveRegencies = activeRegencies.size;

  return (
    <SectionCard
      icon={<MapIcon sx={{ fontSize: 20, color: "#1D4ED8" }} />}
      title="Cakupan Wilayah"
      description="Provinsi & kota/kab yang aktif hanya ini yang muncul di dropdown form listing dan form kontak. Kecamatan/desa mengikuti kota induknya."
      action={
        <Chip
          label={`${activeProvinces.size} provinsi · ${totalActiveRegencies} kota`}
          size="small"
          sx={{ height: 24, fontSize: "0.7rem", bgcolor: "rgba(29,78,216,0.08)", color: "#1D4ED8" }}
        />
      }
    >
      {/* Pencarian */}
      <TextField
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari provinsi / kota..."
        size="small"
        fullWidth
        sx={{ ...inputSx, mb: 2 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: "#94A3B8" }} />
              </InputAdornment>
            ),
          },
        }}
      />

      {error ? (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 1, fontSize: "0.8rem" }}>
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 1, fontSize: "0.8rem" }}>
          {success}
        </Alert>
      ) : null}

      {/* Daftar provinsi */}
      <Box sx={{ border: "1px solid #E2E8F0", borderRadius: 1, overflow: "hidden" }}>
        {visibleProvinces.length === 0 ? (
          <Box sx={{ py: 5, textAlign: "center" }}>
            <SearchIcon sx={{ fontSize: 30, color: "#CBD5E1", mb: 1 }} />
            <Typography variant="body2" sx={{ color: "#94A3B8" }}>
              Tidak ada wilayah yang cocok dengan &ldquo;{search}&rdquo;.
            </Typography>
          </Box>
        ) : (
          visibleProvinces.map((prov, idx) => {
            const regList = regenciesByProvince.get(prov.code) ?? [];
            const activeCount = regList.filter((r) => activeRegencies.has(r.code)).length;
            const allChecked = regList.length > 0 && activeCount === regList.length;
            const isOpen = expanded.has(prov.code);
            return (
              <Box key={prov.code} sx={{ ...(idx > 0 ? { borderTop: "1px solid #F1F5F9" } : {}) }}>
                {/* Baris provinsi */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.75, "&:hover": { bgcolor: "#F8FAFC" } }}>
                  <Checkbox
                    checked={allChecked}
                    indeterminate={activeCount > 0 && !allChecked}
                    onChange={() => toggleProvince(prov.code, regList)}
                    disabled={pending || regList.length === 0}
                    size="small"
                    sx={{ p: 0.5, color: "#94A3B8", "&.Mui-checked, &.MuiCheckbox-indeterminate": { color: "#1D4ED8" } }}
                  />
                  <Box
                    sx={{ flex: 1, minWidth: 0, cursor: "pointer", py: 0.5 }}
                    onClick={() => toggleExpand(prov.code)}
                  >
                    <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: "#0F172A" }}>
                      {prov.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748B" }}>
                      {activeCount}/{regList.length} kota/kab aktif · kode {prov.code}
                    </Typography>
                  </Box>
                  {activeCount > 0 ? (
                    <Chip
                      label={allChecked ? "Aktif semua" : "Sebagian"}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "0.64rem",
                        bgcolor: allChecked ? "rgba(22,163,74,0.1)" : "rgba(217,119,6,0.12)",
                        color: allChecked ? "#16A34A" : "#D97706",
                        flexShrink: 0,
                      }}
                    />
                  ) : null}
                  <Tooltip title={isOpen ? "Tutup" : "Lihat kota/kab"}>
                    <IconButton size="small" onClick={() => toggleExpand(prov.code)} sx={{ color: "#64748B" }}>
                      {isOpen ? <ExpandLessIcon sx={{ fontSize: 20 }} /> : <ExpandMoreIcon sx={{ fontSize: 20 }} />}
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* Daftar kota/kab */}
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  <Box sx={{ bgcolor: "#F8FAFC", borderTop: "1px solid #F1F5F9", px: 2, py: 1.5 }}>
                    {regList.length === 0 ? (
                      <Typography variant="caption" sx={{ color: "#94A3B8" }}>
                        Tidak ada data kota/kab.
                      </Typography>
                    ) : (
                      <>
                        <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                          <Button
                            size="small"
                            onClick={() => toggleProvince(prov.code, regList)}
                            disabled={pending || allChecked}
                            sx={{ fontSize: "0.7rem", textTransform: "none", color: "#1D4ED8", minWidth: 0, px: 0.5 }}
                          >
                            Pilih semua
                          </Button>
                          <Button
                            size="small"
                            onClick={() => clearProvince(prov.code, regList)}
                            disabled={pending || activeCount === 0}
                            sx={{ fontSize: "0.7rem", textTransform: "none", color: "#DC2626", minWidth: 0, px: 0.5 }}
                          >
                            Hapus semua
                          </Button>
                        </Stack>
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 0.25 }}>
                          {regList.map((r) => (
                            <Box
                              key={r.code}
                              onClick={() => toggleRegency(r.code)}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                px: 0.75,
                                py: 0.25,
                                borderRadius: 1,
                                cursor: "pointer",
                                "&:hover": { bgcolor: "rgba(29,78,216,0.05)" },
                              }}
                            >
                              <Checkbox
                                checked={activeRegencies.has(r.code)}
                                onChange={() => toggleRegency(r.code)}
                                disabled={pending}
                                size="small"
                                sx={{ p: 0.5, color: "#94A3B8", "&.Mui-checked": { color: "#1D4ED8" } }}
                              />
                              <Typography sx={{ fontSize: "0.78rem", color: activeRegencies.has(r.code) ? "#0F172A" : "#64748B" }} noWrap>
                                {r.name}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </>
                    )}
                  </Box>
                </Collapse>
              </Box>
            );
          })
        )}
      </Box>

      {/* Footer simpan */}
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mt: 2.5, flexWrap: "wrap", gap: 1 }}>
        <Typography variant="caption" sx={{ color: isDirty ? "#D97706" : "#94A3B8", fontSize: "0.72rem" }}>
          {isDirty
            ? "Ada perubahan yang belum disimpan."
            : "Perubahan langsung berlaku di semua form setelah disimpan."}
        </Typography>
        <Button
          variant="contained"
          startIcon={<SaveIcon sx={{ fontSize: 18 }} />}
          onClick={handleSave}
          disabled={pending || !isDirty}
          sx={saveButtonSx}
        >
          {pending ? "Menyimpan..." : "Simpan Wilayah Aktif"}
        </Button>
      </Stack>
    </SectionCard>
  );
}
