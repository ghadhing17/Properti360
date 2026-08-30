"use client";

import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MuiSelect from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

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

export function BookingSortSelect({ value, q, status }: { value: string; q?: string; status?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(next: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (next && next !== "newest") params.set("sort", next);
    const s = params.toString();
    router.push(pathname + (s ? `?${s}` : ""));
  }

  return (
    <FormControl size="small" sx={{ minWidth: 160, ...inputSx }}>
      <InputLabel>Urutkan</InputLabel>
      <MuiSelect
        value={value}
        label="Urutkan"
        onChange={(e) => handleChange(e.target.value as string)}
      >
        <MenuItem value="newest">Terbaru</MenuItem>
        <MenuItem value="oldest">Terlama</MenuItem>
        <MenuItem value="date">Tgl Preferensi</MenuItem>
      </MuiSelect>
    </FormControl>
  );
}