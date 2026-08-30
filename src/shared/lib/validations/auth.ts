import { z } from "zod";

export const loginSchema = z.object({
  // Accept username OR email — "ghadhing" will match name, "ghadhing@properti360.local" will match email
  email: z.string().min(2, "Username atau Email minimal 2 karakter").max(100),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter").max(50),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter").max(72),
    confirmPassword: z.string().min(6),
    phone: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
