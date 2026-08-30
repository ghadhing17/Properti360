import { z } from "zod";

// PropertyType sesuai prisma enum
export const propertyTypeValues = ["RUMAH", "APARTEMEN", "HOTEL", "RUKO", "VENUE", "LAINNYA"] as const;
export const listingStatusValues = ["DRAFT", "PUBLISHED"] as const;

export const facingDirectionValues = ["UTARA", "SELATAN", "TIMUR", "BARAT", "TIMUR_LAUT", "BARAT_LAUT", "TIMUR_SELATAN", "BARAT_SELATAN"] as const;
export const certificateTypeValues = ["SHM", "HGB", "SHP", "SHSRS", "GIRIK", "LAINNYA"] as const;
export const propertyStatusValues = ["DIJUAL", "DISEWA", "DIJUAL_DISEWA"] as const;
export const periodeSewaValues = ["BULANAN", "TAHUNAN", "BULANAN_DAN_TAHUNAN"] as const;
export const waterSourceValues = ["PDAM", "SUMUR", "SUMUR_BOR", "LAINNYA"] as const;

export const fasilitasValues = [
  "KOLAM_RENANG", "CCTV", "KEAMANAN_24JAM", "ONE_GATE_SYSTEM",
  "TAMAN", "BALKON", "ROOFTOP", "GUDANG",
  "DAPUR", "RUANG_KELUARGA", "RUANG_MAKAN", "RUANG_KERJA",
  "LAUNDRY_ROOM", "AC", "WATER_HEATER", "SMART_HOME",
  "INTERNET", "PLAYGROUND", "CLUBHOUSE", "JOGGING_TRACK",
  "LIFT", "BASEMENT",
] as const;

export type FasilitasValue = (typeof fasilitasValues)[number];

export type PeriodeSewaValue = (typeof periodeSewaValues)[number];

export const periodeSewaLabel: Record<PeriodeSewaValue, string> = {
  BULANAN: "Bulanan",
  TAHUNAN: "Tahunan",
  BULANAN_DAN_TAHUNAN: "Bulanan dan Tahunan",
};

export const fasilitasLabel: Record<FasilitasValue, string> = {
  KOLAM_RENANG: "Kolam Renang", CCTV: "CCTV", KEAMANAN_24JAM: "Keamanan 24 Jam",
  ONE_GATE_SYSTEM: "One Gate System", TAMAN: "Taman", BALKON: "Balkon",
  ROOFTOP: "Rooftop", GUDANG: "Gudang", DAPUR: "Dapur",
  RUANG_KELUARGA: "Ruang Keluarga", RUANG_MAKAN: "Ruang Makan", RUANG_KERJA: "Ruang Kerja",
  LAUNDRY_ROOM: "Laundry Room", AC: "AC", WATER_HEATER: "Water Heater",
  SMART_HOME: "Smart Home", INTERNET: "Internet", PLAYGROUND: "Playground",
  CLUBHOUSE: "Clubhouse", JOGGING_TRACK: "Jogging Track", LIFT: "Lift", BASEMENT: "Basement",
};

const optionalPositiveInt = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = typeof v === "string" ? Number(v.replace(/[^\d]/g, "")) : v;
    if (Number.isNaN(n) || n < 0) return null;
    return Math.trunc(n);
  })
  .nullable();

const kodeWilayahSchema = z
  .string()
  .regex(/^(\d{2})(\.\d{2})?(\.\d{2})?(\.\d{4})?$/, "Format kode wilayah tidak valid (contoh: 32.73.01.1001)")
  .optional()
  .nullable();

// Transform koordinat: terima string (titik/koma desimal) atau number → number | null | NaN
const coordinateTransform = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === "" || v === null || v === undefined) return null;
    return typeof v === "string" ? Number(v.replace(/,/g, ".")) : v;
  })
  .nullable();

// ── Base schema — semua field yang mungkin ada, dengan tipe yang benar
const priceTransform = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = typeof v === "string" ? Number(v.replace(/[^\d-]/g, "")) : v;
    if (Number.isNaN(n)) return null;
    return Math.trunc(n);
  })
  .nullable();

const listingBaseSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter").max(200, "Judul maksimal 200 karakter"),
  categoryId: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  // Wilayah administratif
  provinceCode: kodeWilayahSchema,
  regencyCode: kodeWilayahSchema,
  districtCode: kodeWilayahSchema,
  villageCode: kodeWilayahSchema,
  regionCode: kodeWilayahSchema,
  price: priceTransform,
  description: z.string().optional().nullable(),
  panoeeEmbed: z.string().max(5000, "Embed code terlalu panjang").optional().nullable(),
  metaTitle: z.string().max(70, "Meta title maksimal 70 karakter").optional().nullable(),
  metaDescription: z.string().max(160, "Meta description maksimal 160 karakter").optional().nullable(),
  ownerId: z.string().optional().nullable(),
  status: z.enum(listingStatusValues).default("DRAFT"),
  propertyType: z.enum(propertyTypeValues).default("RUMAH"),
  // ── Detail Primer
  luasTanah: optionalPositiveInt,
  luasBangunan: optionalPositiveInt,
  kamarTidur: optionalPositiveInt,
  kamarMandi: optionalPositiveInt,
  lantai: optionalPositiveInt,
  garasi: optionalPositiveInt,
  statusProperti: z.enum(propertyStatusValues).optional().nullable(),
  // Checkbox HTML kirim "on" saat dicentang / tidak ada saat tidak — normalisasi ke boolean
  nego: z
    .union([z.string(), z.boolean(), z.null(), z.undefined()])
    .transform((v) => v === true || v === "on" || v === "true" || v === "1"),
  periodeSewa: z.enum(periodeSewaValues).optional().nullable(),
  latitude: coordinateTransform.refine((v) => v === null || (v >= -90 && v <= 90), "Latitude harus antara -90 sampai 90"),
  longitude: coordinateTransform.refine((v) => v === null || (v >= -180 && v <= 180), "Longitude harus antara -180 sampai 180"),
  tahunDibangun: optionalPositiveInt,
  sertifikat: z.enum(certificateTypeValues).optional().nullable(),
  hadapRumah: z.enum(facingDirectionValues).optional().nullable(),
  dayaListrik: optionalPositiveInt,
  sumberAir: z.enum(waterSourceValues).optional().nullable(),
  // ── Fasilitas Sekunder (array string)
  fasilitas: z.array(z.enum(fasilitasValues)).default([]),
});

// ── DRAFT: hanya title wajib, semua field lain optional
export const listingDraftSchema = listingBaseSchema;

// ── PUBLISHED: semua field utama wajib diisi sebelum bisa live
export const listingPublishSchema = listingBaseSchema.extend({
  categoryId: z.string().min(1, "Kategori wajib dipilih untuk publish"),
  address: z.string().min(5, "Alamat minimal 5 karakter untuk publish"),
  city: z.string().min(2, "Kota minimal 2 karakter untuk publish").max(100),
  price: priceTransform.refine((v) => v !== null && Number.isInteger(v) && v >= 0, {
    message: "Harga wajib diisi untuk publish (angka >= 0)",
  }),
  description: z.string().min(10, "Deskripsi minimal 10 karakter untuk publish"),
  ownerId: z.string().min(1, "Customer / pemilik wajib dipilih untuk publish"),
  statusProperti: z.enum(propertyStatusValues, {
    errorMap: () => ({ message: "Status properti wajib dipilih untuk publish" }),
  }),
});

// ── Backward-compat: listingSchema masih menggunakan publish rules (default ketat)
export const listingSchema = listingPublishSchema;

export type ListingInput = z.infer<typeof listingBaseSchema>;
export type ListingDraftInput = z.infer<typeof listingDraftSchema>;
export type ListingPublishInput = z.infer<typeof listingPublishSchema>;

// Field-field yang wajib saat PUBLISHED (dipakai form untuk tampilkan indikator)
export const publishRequiredFields = [
  "categoryId", "address", "city", "price", "description", "ownerId", "statusProperti",
] as const;
export type PublishRequiredField = (typeof publishRequiredFields)[number];

// Label Bahasa Indonesia — dipakai untuk pesan error ringkas di action & form
export const listingFieldLabels: Record<string, string> = {
  title: "Judul",
  categoryId: "Kategori",
  propertyType: "Tipe Properti",
  address: "Alamat",
  city: "Kota",
  price: "Harga",
  description: "Deskripsi",
  panoeeEmbed: "Embed Panoee",
  metaTitle: "Meta Title",
  metaDescription: "Meta Description",
  ownerId: "Customer / Pemilik",
  status: "Status",
  provinceCode: "Provinsi",
  regencyCode: "Kabupaten/Kota",
  districtCode: "Kecamatan",
  villageCode: "Desa/Kelurahan",
  regionCode: "Kode Wilayah",
  luasTanah: "Luas Tanah",
  luasBangunan: "Luas Bangunan",
  kamarTidur: "Kamar Tidur",
  kamarMandi: "Kamar Mandi",
  lantai: "Lantai",
  garasi: "Garasi",
  statusProperti: "Status Properti",
  nego: "Nego",
  periodeSewa: "Periode Sewa",
  latitude: "Latitude",
  longitude: "Longitude",
  tahunDibangun: "Tahun Dibangun",
  sertifikat: "Sertifikat",
  hadapRumah: "Hadap Rumah",
  dayaListrik: "Daya Listrik",
  sumberAir: "Sumber Air",
  fasilitas: "Fasilitas",
};

export type PublishMissingField = { field: string; label: string; message: string };

// Cek kelengkapan field wajib publish langsung dari FormData — dipakai form untuk
// feedback instan sebelum submit. Aturannya SELALU sama dengan listingPublishSchema.
export function getPublishMissingFields(formData: FormData): PublishMissingField[] {
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const missing: PublishMissingField[] = [];
  const check = (field: string, label: string, ok: boolean, message: string) => {
    if (!ok) missing.push({ field, label, message });
  };
  check("title", "Judul", get("title").length >= 3, "Judul minimal 3 karakter");
  check("categoryId", "Kategori", get("categoryId") !== "", "Kategori wajib dipilih");
  check("address", "Alamat", get("address").length >= 5, "Alamat minimal 5 karakter");
  check("city", "Kota", get("city").length >= 2, "Kota minimal 2 karakter (atau pilih wilayah)");
  check("price", "Harga", get("price").replace(/[^\d]/g, "") !== "", "Harga wajib diisi");
  check("description", "Deskripsi", get("description").length >= 10, "Deskripsi minimal 10 karakter");
  check("statusProperti", "Status Properti", get("statusProperti") !== "", "Status properti wajib dipilih");
  check("ownerId", "Customer / Pemilik", get("ownerId") !== "", "Customer / pemilik wajib dipilih");
  return missing;
}

export const listingCreateSchema = listingBaseSchema;
export const listingUpdateSchema = listingBaseSchema.partial().extend({
  id: z.string().min(1),
});

export const thumbnailFileSchema = z
  .instanceof(File)
  .refine((f) => f.size > 0, "File kosong")
  .refine((f) => f.size <= 5 * 1024 * 1024, "Ukuran maksimal 5MB")
  .refine(
    (f) => ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/avif", "image/gif"].includes(f.type),
    "Format harus JPG/PNG/WebP/AVIF/GIF",
  )
  .optional()
  .nullable();
