import { z } from "zod";

export const propertyTypeValues = ["RUMAH", "APARTEMEN", "HOTEL", "RUKO", "VENUE", "LAINNYA"] as const;

export const bookingStatusValues = ["PENDING", "CONTACTED", "DONE", "CANCELLED"] as const;
export type BookingStatusValue = (typeof bookingStatusValues)[number];

export const bookingStatusLabels: Record<BookingStatusValue, string> = {
  PENDING: "Pending",
  CONTACTED: "Dihubungi",
  DONE: "Selesai",
  CANCELLED: "Dibatalkan",
};

export const bookingStatusColors: Record<BookingStatusValue, "warning" | "info" | "success" | "error"> = {
  PENDING: "warning",
  CONTACTED: "info",
  DONE: "success",
  CANCELLED: "error",
};

export const propertyTypeLabels: Record<(typeof propertyTypeValues)[number], string> = {
  RUMAH: "Rumah",
  APARTEMEN: "Apartemen",
  HOTEL: "Hotel",
  RUKO: "Ruko",
  VENUE: "Venue",
  LAINNYA: "Lainnya",
};

// Transform input tanggal → Date | null (untuk kolom preferredDate)
const preferredDateTransform = z
  .string()
  .optional()
  .nullable()
  .transform((v) => {
    if (!v || v.trim() === "") return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  });

export const bookingSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100, "Nama maksimal 100 karakter"),
  phone: z.string().min(8, "No HP minimal 8 karakter").max(20, "No HP maksimal 20 karakter"),
  address: z.string().min(5, "Alamat minimal 5 karakter").max(500, "Alamat maksimal 500 karakter"),
  propertyType: z.enum(propertyTypeValues).default("RUMAH"),
  preferredDate: preferredDateTransform,
});

// Schema untuk form admin (create & edit) — tambah status
export const adminBookingSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100, "Nama maksimal 100 karakter"),
  phone: z.string().min(8, "No HP minimal 8 karakter").max(20, "No HP maksimal 20 karakter"),
  address: z.string().min(5, "Alamat minimal 5 karakter").max(500, "Alamat maksimal 500 karakter"),
  propertyType: z.enum(propertyTypeValues).default("RUMAH"),
  preferredDate: preferredDateTransform,
  status: z.enum(bookingStatusValues).default("PENDING"),
});

export type BookingInput = z.infer<typeof bookingSchema>;
export type AdminBookingInput = z.infer<typeof adminBookingSchema>;
