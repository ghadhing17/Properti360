import { z } from "zod";

// ── Profil bisnis (tab Umum) ─────────────────────────────────────────────────
const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} maksimal ${max} karakter`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

const optionalUrl = (label: string) =>
  z
    .string()
    .trim()
    .max(300, `${label} maksimal 300 karakter`)
    .refine((v) => v === "" || /^https?:\/\/.+\..+/.test(v), {
      message: `${label} harus URL valid (diawali http:// atau https://)`,
    })
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

export const generalSettingsSchema = z.object({
  siteName: z
    .string()
    .trim()
    .min(2, "Nama situs minimal 2 karakter")
    .max(80, "Nama situs maksimal 80 karakter"),
  tagline: optionalText(120, "Tagline"),
  description: optionalText(500, "Deskripsi singkat"),
  contactEmail: z
    .string()
    .trim()
    .max(120, "Email kontak maksimal 120 karakter")
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: "Format email tidak valid",
    })
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  contactPhone: optionalText(30, "No. telepon"),
  whatsapp: optionalText(30, "No. WhatsApp"),
  address: optionalText(300, "Alamat"),
  instagramUrl: optionalUrl("URL Instagram"),
  facebookUrl: optionalUrl("URL Facebook"),
});

export type GeneralSettingsInput = z.infer<typeof generalSettingsSchema>;

// ── SEO & Open Graph ─────────────────────────────────────────────────────────
export const seoSettingsSchema = z.object({
  metaTitle: z
    .string()
    .trim()
    .max(70, "Meta title maksimal 70 karakter agar tidak terpotong di hasil pencarian")
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  metaDescription: z
    .string()
    .trim()
    .max(200, "Meta description maksimal 200 karakter agar tidak terpotong di hasil pencarian")
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  ogTitle: z
    .string()
    .trim()
    .max(100, "OG title maksimal 100 karakter")
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  ogDescription: z
    .string()
    .trim()
    .max(220, "OG description maksimal 220 karakter")
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
});

export type SeoSettingsInput = z.infer<typeof seoSettingsSchema>;

// ── Jam operasional (7 hari) ─────────────────────────────────────────────────
const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
// Hari tutup: input time disabled → tidak ikut submit (string kosong).
// Default "00:00" agar tetap lolos validasi tanpa membingungkan user.
const optionalTime = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? "00:00" : v),
  z.string().regex(timePattern, "Format jam harus HH:MM")
);

export const operatingHourRowSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    isClosed: z.boolean(),
    openTime: optionalTime,
    closeTime: optionalTime,
  })
  .refine((row) => row.isClosed || row.openTime < row.closeTime, {
    message: "Jam tutup harus lebih besar dari jam buka",
  });

export const operatingHoursSchema = z.object({
  days: z.array(operatingHourRowSchema).length(7, "Data 7 hari wajib lengkap"),
});

export type OperatingHoursInput = z.infer<typeof operatingHoursSchema>;

// ── Hari libur ───────────────────────────────────────────────────────────────
export const holidaySchema = z.object({
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid"),
  name: z
    .string()
    .trim()
    .min(3, "Nama libur minimal 3 karakter")
    .max(60, "Nama libur maksimal 60 karakter"),
  isRecurring: z.boolean().default(false),
});

export type HolidayInput = z.infer<typeof holidaySchema>;

// ── Profil admin ─────────────────────────────────────────────────────────────
export const adminProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(80, "Nama maksimal 80 karakter"),
  phone: optionalText(30, "No. HP"),
});

export type AdminProfileInput = z.infer<typeof adminProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
    newPassword: z
      .string()
      .min(8, "Password baru minimal 8 karakter")
      .max(72, "Password maksimal 72 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Konfirmasi password tidak sama dengan password baru",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ── Manajemen pengguna (admin & customer) ────────────────────────────────────
export const createStaffSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(80, "Nama maksimal 80 karakter"),
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid")
    .max(120, "Email maksimal 120 karakter"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(72, "Password maksimal 72 karakter"),
  phone: optionalText(30, "No. HP"),
  role: z.enum(["ADMIN", "CUSTOMER"], {
    errorMap: () => ({ message: "Role harus ADMIN atau CUSTOMER" }),
  }),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;
