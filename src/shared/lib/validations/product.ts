import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100, "Nama maksimal 100 karakter").trim(),
  description: z.string().min(10, "Deskripsi minimal 10 karakter").max(2000).trim(),
  price: z
    .string()
    .optional()
    .nullable()
    .transform((v) => {
      if (!v || v.trim() === "") return null;
      const n = Number(v.replace(/\D/g, ""));
      return Number.isFinite(n) && n > 0 ? n : null;
    }),
  features: z
    .string()
    .optional()
    .nullable()
    .transform((v) => {
      if (!v || v.trim() === "") return [] as string[];
      return v
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }),
  isActive: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "on" || v === "1"),
  isPopular: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "on" || v === "1"),
  order: z
    .string()
    .optional()
    .nullable()
    .transform((v) => {
      if (!v || v.trim() === "") return 0;
      const n = parseInt(v, 10);
      return Number.isFinite(n) ? n : 0;
    }),
});

export type ProductInput = z.infer<typeof productSchema>;

export type ProductForBooking = {
  id: string;
  name: string;
  price: number | null;
  isPopular: boolean;
};

export function formatPrice(price: number | null): string {
  if (price === null) return "Hubungi Kami";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(price);
}
