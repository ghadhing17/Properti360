"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { registerSchema, type RegisterInput } from "@/shared/lib/validations/auth";
import { registerCustomer } from "@/shared/auth/actions";

export default function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
    },
  });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    setServerSuccess(false);

    const res = await registerCustomer(values);

    if ("error" in res && res.error) {
      setServerError(res.error);
      return;
    }

    setServerSuccess(true);
    // Redirect ke login setelah 1 detik — user bisa login dengan kredensial baru
    setTimeout(() => router.push("/login"), 900);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Nama
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="Nama lengkap"
          {...register("name")}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          {...register("email")}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium">
          No. HP <span className="font-normal text-zinc-400">(opsional)</span>
        </label>
        <input
          id="phone"
          type="tel"
          placeholder="0812..."
          {...register("phone")}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="Minimal 6 karakter"
          {...register("password")}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium">
          Konfirmasi Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Ulangi password"
          {...register("confirmPassword")}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      {serverError && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>}
      {serverSuccess && (
        <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">
          Registrasi berhasil! Mengalihkan ke login...
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Mendaftar..." : "Daftar sebagai Customer"}
      </button>

      <p className="text-center text-xs text-zinc-500">
        Dengan mendaftar Anda menyetujui syarat layanan. Password di-hash dengan bcrypt.
      </p>
    </form>
  );
}
