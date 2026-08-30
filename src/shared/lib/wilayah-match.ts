// Normalisasi & pencocokan nama wilayah administratif.
// Dipakai untuk sinkronisasi hasil reverse-geocode (Nominatim) dengan tabel
// Wilayah (Kepmendagri) yang format namanya berbeda, contoh:
//   Nominatim "DK Jakarta"            ↔ DB "Daerah Khusus Ibukota Jakarta"
//   Nominatim "Jakarta Pusat"         ↔ DB "Kota Administrasi Jakarta Pusat"
//   Nominatim "Genuk Barat"           ↔ DB "Genuk" (via contains)
//   Nominatim "Pakisaji"              ↔ DB "Pakis Aji" (via space-insensitive)

const PREFIX_RE =
  /^(provinsi|kabupaten administrasi|kota administrasi|kab adm|kota adm|kabupaten|kab|kota madya|kota|kecamatan|kelurahan|nagari|jorong|desa|daerah khusus ibukota|daerah istimewa|daerah otonomi khusus|dk|dki|d i|di|nanggroe)\s+/;

// Lowercase + hapus diakritik + rapikan spasi — TANPA membuang prefiks admin.
function loose(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// loose() + buang prefiks admin ("Kabupaten", "Kota", "Desa", ...) berulang kali.
function stripped(s: string): string {
  let out = loose(s);
  let prev = "";
  while (prev !== out) {
    prev = out;
    out = out.replace(PREFIX_RE, "").trim();
  }
  return out;
}

export function normalizeWilayahName(input: string): string {
  return stripped(input);
}

export type WilayahRow = { kode: string; nama: string };

// Ambil baris pertama yang cocok dengan salah satu kandidat nama.
// Pass 0: exact nama lengkap  → "Kabupaten Semarang" ≠ "Kota Semarang" (tak tertukar)
// Pass 1: exact tanpa prefiks → "Semarang" tetap bisa kena (fallback)
// Pass 2: exact anti-spasi    → "Pakisaji" == "Pakis Aji"
// Pass 3: contains dua arah, nama terpendek didahulukan → "Genuk Barat" ⇒ "Genuk"
export function pickWilayahMatch(
  candidates: (string | null | undefined)[],
  rows: WilayahRow[]
): WilayahRow | null {
  const valid = candidates.filter((c): c is string => typeof c === "string" && c.trim().length > 0);

  for (const c of valid) {
    const l = loose(c);
    if (!l) continue;
    const m = rows.find((r) => loose(r.nama) === l);
    if (m) return m;
  }
  for (const c of valid) {
    const s = stripped(c);
    if (!s) continue;
    const m = rows.find((r) => stripped(r.nama) === s);
    if (m) return m;
  }
  for (const c of valid) {
    const q = stripped(c).replace(/ /g, "");
    if (!q) continue;
    const m = rows.find((r) => stripped(r.nama).replace(/ /g, "") === q);
    if (m) return m;
  }
  const byLen = [...rows].sort((a, b) => a.nama.length - b.nama.length);
  for (const c of valid) {
    const s = stripped(c);
    if (!s || s.length < 3) continue;
    const m = byLen.find((r) => {
      const rs = stripped(r.nama);
      return rs.includes(s) || s.includes(rs);
    });
    if (m) return m;
  }
  return null;
}
